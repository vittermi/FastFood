const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { OrderStatus } = require('../utils/enums');



function createDateRangeFilter(days) {
    if (!days) return {};
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    return { createdAt: { $gte: startDate, $lte: endDate } };
}

exports.getSummary = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id }).select('_id').lean().exec();

        const days = req.query.days;

        let filter = { restaurant: restaurant._id };
        const dateFilter = createDateRangeFilter(days);
        filter = { ...filter, ...dateFilter };

        const ordersPerDay = await getOrdersPerDay(filter);
        const totalDelivered = await getTotalDelivered(filter);
        const averageOrderPrice = await getAverageOrderPrice(filter);
        const mostOrderedProducts = await getMostOrderedProducts(filter);
        const leastOrderedProducts = await getLeastOrderedProducts(filter);

        res.status(200).json({
            success: true,
            data: {
                period: days ? `${days} days` : 'all time',
                ordersPerDay,
                totalDelivered,
                averageOrderPrice,
                mostOrderedProducts,
                leastOrderedProducts
            }
        });
    } catch (error) {
        console.error('Error getting statistics summary:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getOrdersPerDay = async (req, res) => {
    try {
        const restaurantId = await getRestaurantIdFromUser(req.user.id);
        const days = req.query.days;
        
        let filter = { restaurant: restaurantId };
        const dateFilter = createDateRangeFilter(days);
        filter = { ...filter, ...dateFilter };

        const result = await getOrdersPerDay(filter);

        res.status(200).json({
            success: true,
            data: {
                period: days ? `${days} days` : 'all time',
                orders: result
            }
        });
    } catch (error) {
        console.error('Error getting orders per day:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getTotalDelivered = async (req, res) => {
    try {
        const restaurantId = await getRestaurantIdFromUser(req.user.id);
        const days = req.query.days;
        
        let filter = { restaurant: restaurantId };
        const dateFilter = createDateRangeFilter(days);
        filter = { ...filter, ...dateFilter };

        const result = await getTotalDelivered(filter);

        res.status(200).json({
            success: true,
            data: {
                period: days ? `${days} days` : 'all time',
                ...result
            }
        });
    } catch (error) {
        console.error('Error getting total delivered orders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getAverageOrderPrice = async (req, res) => {
    try {
        const restaurantId = await getRestaurantIdFromUser(req.user.id);
        const days = req.query.days;
        

        let filter = { restaurant: restaurantId };
        const dateFilter = createDateRangeFilter(days);
        filter = { ...filter, ...dateFilter };

        const result = await getAverageOrderPrice(filter);

        res.status(200).json({
            success: true,
            data: {
                period: days ? `${days} days` : 'all time',
                ...result
            }
        });
    } catch (error) {
        console.error('Error getting average order price:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMostOrderedProducts = async (req, res) => {
    try {
        const restaurantId = await getRestaurantIdFromUser(req.user.id);
        const days = req.query.days;
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        

        let filter = { restaurant: restaurantId };
        const dateFilter = createDateRangeFilter(days);
        filter = { ...filter, ...dateFilter };

        const result = await getMostOrderedProducts(filter, limit);

        res.status(200).json({
            success: true,
            data: {
                period: days ? `${days} days` : 'all time',
                products: result
            }
        });
    } catch (error) {
        console.error('Error getting most ordered products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getLeastOrderedProducts = async (req, res) => {
    try {
        const restaurantId = await getRestaurantIdFromUser(req.user.id);
        const days = req.query.days;
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        

        let filter = { restaurant: restaurantId };
        const dateFilter = createDateRangeFilter(days);
        filter = { ...filter, ...dateFilter };

        const result = await getLeastOrderedProducts(filter, limit);

        res.status(200).json({
            success: true,
            data: {
                period: days ? `${days} days` : 'all time',
                products: result
            }
        });
    } catch (error) {
        console.error('Error getting least ordered products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


async function getOrdersPerDay(filter = {}) {
    return await Order.aggregate([
        { $match: filter },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" }
                },
                count: { $sum: 1 },
                date: { $first: "$createdAt" }
            }
        },
        { $sort: { date: -1 } },
        {
            $project: {
                _id: 0,
                date: {
                    $dateToString: { format: "%Y-%m-%d", date: "$date" }
                },
                count: 1
            }
        }
    ]);
}

async function getTotalDelivered(filter = {}) {
    const deliveredFilter = { ...filter, status: OrderStatus.DELIVERED };

    const result = await Order.aggregate([
        { $match: deliveredFilter },
        {
            $group: {
                _id: null,
                total: { $sum: "$totalAmount" },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                count: 1
            }
        }
    ]);

    return result.length > 0 ? result[0] : { total: 0, count: 0 };
}

async function getAverageOrderPrice(filter = {}) {
    const result = await Order.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                averagePrice: { $avg: "$totalAmount" },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                averagePrice: 1,
                count: 1
            }
        }
    ]);

    return result.length > 0 ? result[0] : { averagePrice: 0, count: 0 };
}

async function getMostOrderedProducts(filter = {}, limit = 5) {
    return await Order.aggregate([
        { $match: filter },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.dish",
                totalOrdered: { $sum: "$items.quantity" }
            }
        },
        { $sort: { totalOrdered: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: "dishes",
                localField: "_id",
                foreignField: "_id",
                as: "dishDetails"
            }
        },
        { $unwind: "$dishDetails" },
        {
            $project: {
                _id: 0,
                dish: "$dishDetails.name",
                dishId: "$_id",
                totalOrdered: 1
            }
        }
    ]);
}

async function getLeastOrderedProducts(filter = {}, limit = 5) {
    return await Order.aggregate([
        { $match: filter },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.dish",
                totalOrdered: { $sum: "$items.quantity" }
            }
        },
        { $sort: { totalOrdered: 1 } },
        { $limit: limit },
        {
            $lookup: {
                from: "dishes",
                localField: "_id",
                foreignField: "_id",
                as: "dishDetails"
            }
        },
        { $unwind: "$dishDetails" },
        {
            $project: {
                _id: 0,
                dish: "$dishDetails.name",
                dishId: "$_id",
                totalOrdered: 1
            }
        }
    ]);
}
