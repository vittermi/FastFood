const Order = require('../models/Order');
const Dish = require('../models/Dish');
const { OrderStatus } = require('../utils/enums');

const allowedTransitions = {
    [OrderStatus.ORDERED]: [OrderStatus.PREPARING],
    [OrderStatus.ORDERED]: [OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.DELIVERING],
    [OrderStatus.DELIVERING]: [OrderStatus.DELIVERED],
};


exports.createOrder = async (req, res) => {
    try {
        const customerId = req.user.id;
        const items = req.body.items;

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


exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user.id }).populate('items.product', 'name price');
        res.json(orders);
    } catch (err) {
        console.error(`Error fetching orders: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
}


exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product', 'name price');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.customer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only view your own orders' });
        }
        res.json(order);
    } catch (err) {
        console.error(`Error fetching order: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
}


exports.updateStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { newStatus } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const currentStatus = order.status;

        const allowed = allowedTransitions[currentStatus] || [];
        if (!allowed.includes(newStatus)) {
            return res.status(400).json({
                message: `Invalid status transition from "${currentStatus}" to "${newStatus}"`
            });
        }

        order.status = newStatus;
        await order.save();

        res.status(200).json(order);
    } catch (err) {
        console.error('Error updating order status:', err.message);
        res.status(500).json({ message: err.message });
    }
};
