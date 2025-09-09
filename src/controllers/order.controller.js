const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { OrderStatus, UserTypes } = require('../utils/enums');
const { isValidTransition, computeAllowedTransitions } = require('../utils/orderStateMachine');
const Preference = require('../models/Preference');


function isPaymentTypeSet(preference) {
    if (!preference) return false;
    if (preference.paymentType === 'cash') return true;
    if (preference.paymentType === 'card') return !!(preference.cardDetails && preference.cardDetails.token);
    return false;
}

function areRequiredConsentsGiven(preference) {
    if (!preference || !preference.consents) return false;
    return preference.consents.tos && preference.consents.privacy;
}

exports.createOrder = async (req, res) => {
    try {
        const customerId = req.user.id;
        const items = req.body.items;
        const restaurantId = req.body.restaurantId;

        const user = await User.findById(customerId);
        const preference = await Preference.findOne({ customer: customerId });

        if (!preference) 
            return res.status(403).json({ message: 'Please set your preferences before placing an order.' });
        else if (!isPaymentTypeSet(preference))
            return res.status(403).json({ message: 'Payment method not set.' });
        else if (!areRequiredConsentsGiven(preference)) 
            return res.status(403).json({ message: 'Please set required consents in preferences.' });

        if (!items || !Array.isArray(items) || items.length === 0)
            return res.status(400).json({ message: 'Invalid order items.' });

        if (user?.userType !== UserTypes.CUSTOMER) return res.status(403).json({ message: 'Forbidden' });

        let totalAmount = 0;
        const itemsDerivedInfo = [];

        for (const item of items) {
            const dish = await Dish.findById(item.dish);
            if (!dish) return res.status(404).json({ message: `Dish not found: ${item.dish}` });

            const itemTotal = dish.price * item.quantity;
            totalAmount += itemTotal;

            itemsDerivedInfo.push({
                dish: dish._id,
                quantity: item.quantity,
                priceAtOrder: dish.price
            });
        }

        const order = new Order({
            restaurant: restaurantId,
            customer: customerId,
            items: itemsDerivedInfo,
            totalAmount,
            status: OrderStatus.ORDERED
        });

        await order.save();
        res.status(201).json(order);
    } catch (err) {
        console.error(`Error creating order: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};


exports.getOrdersByRestaurant = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const restaurant = await Restaurant.findOne({ owner: req.user.id }).select('_id').lean().exec();

        if (user?.userType !== UserTypes.RESTAURATEUR) return res.status(403).json({ message: 'Forbidden' });
        if (!restaurant) return res.status(404).json({ message: 'No restaurant found' });

        const orders = await Order.find({ restaurant }).populate('items.dish', 'name price')
            .populate('customer', 'username');
        res.json(orders);
    } catch (err) {
        console.error(`Error fetching orders: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
}


exports.getOrdersByCustomer = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user?.userType !== UserTypes.CUSTOMER) return res.status(403).json({ message: 'Forbidden' });

        const orders = await Order.find({ customer: req.user.id })
            .populate('items.dish', 'name price')
            .populate('restaurant', 'name');

        const processedOrders = await Promise.all(orders.map(async (order) => {
            const orderObj = order.toObject();

            if (orderObj.status === OrderStatus.ORDERED) {
                const estimatedMinutes = await calculateEstimatedPreparationTimeMins(order);
                orderObj.estimatedPreparationTime = estimatedMinutes;
            }

            return orderObj;
        }));

        res.json(processedOrders);
    } catch (err) {
        console.error(`Error fetching orders: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
}


async function calculateEstimatedPreparationTimeMins(order) {

    const populateOpts = {
        path: 'items.dish',
        select: 'ingredients baseDish',
        populate: {
            path: 'baseDish',
            model: 'DishTemplate',
            select: 'ingredients'
        }
    };

    const earlierOrders = await Order.find({
        restaurant: order.restaurant._id,
        status: { $in: [OrderStatus.ORDERED, OrderStatus.PREPARATION] },
        createdAt: { $lt: order.createdAt }
    }).populate(populateOpts).lean();

    const currentOrder = await Order.findById(order._id).populate(populateOpts).lean();

    const earlierAndCurrentOrders = [currentOrder, ...earlierOrders];

    let additionalTime = 0;

    for (const orderToProcess of earlierAndCurrentOrders) {
        for (const item of orderToProcess.items) {
            const dish = item.dish; // sbajato?
            if (!dish) continue;

            let ingredients = dish.ingredients || [];
            if (dish.baseDish && dish.baseDish.ingredients && dish.baseDish.ingredients.length > 0)
                ingredients = dish.baseDish.ingredients;

            const dishComplexity = Math.max(1, ingredients.length / 2);
            additionalTime += item.quantity * dishComplexity;
        }
    }

    return Math.round(additionalTime);
}

exports.getOrderStatuses = (_req, res) => {
    try {
        res.status(200).json(Object.values(OrderStatus));
    } catch (err) {
        console.error(`Error fetching order statuses: ${err.message}`);
        res.status(500).json({ message: 'Failed to fetch order statuses' });
    }
};

exports.getAvailableTransitions = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const includeCancel = String(req.query.includeCancel).toLowerCase() === 'true';
        const transitions = computeAllowedTransitions(order, { includeCancel });

        return res.json({
            orderId: order.id,
            status: order.status,
            transitions,
        });
    } catch (err) {
        console.error(`Error fetching available transitions: ${err.message}`);
        res.status(500).json({ message: 'Failed to fetch available transitions' });
    }
};


exports.updateStatus = async (req, res) => {
    try {

        const customerId = req.user.id;
        const user = await User.findById(customerId);

        if (user?.userType !== UserTypes.RESTAURATEUR) return res.status(403).json({ message: 'Forbidden' });

        const { newStatus } = req.body;

        if (!newStatus) return res.status(400).json({ message: 'New status is required' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status))
            return res.status(400).json({ message: `Order is ${order.status} and cannot transition` });

        if (!isValidTransition(order, newStatus))
            return res.status(400).json({ message: `Invalid status transition from "${order.status}" to "${newStatus}"` });

        order.status = newStatus;

        await order.save();
        res.status(200).json(order);
    } catch (err) {
        console.error('Error updating order status:', err.message);
        res.status(500).json({ message: err.message });
    }
};
