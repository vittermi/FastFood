const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { UserTypes } = require('../utils/enums');;

exports.createRestaurant = async (req, res) => {
    try {
        const { name, address, phone, vat, hours } = req.body;
        const owner = await User.findById(req.user.id);

        if (owner.userType != UserTypes.RESTAURATEUR)
            return res.status(403).json({ message: 'Only restaurateurs can create restaurants' });

        const existingRestaurant = await Restaurant.findOne({ owner: owner._id });
        if (existingRestaurant) 
            return res.status(400).json({ message: 'Restaurant already exists for this owner' });
        

        const newRestaurant = new Restaurant({
            owner,
            name,
            address,
            phone,
            vat,
            hours,
        });

        await newRestaurant.save();
        res.status(201).json(newRestaurant);
    } catch (err) {
        console.error(`Error creating restaurant: ${err.message}`);

        if (err.name === 'ValidationError')
            return res.status(400).json({ message: 'Invalid input', details: err.errors });

        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.getRestaurants = async (req, res) => {
    try {
        const filters = {};

        //todo aggiungi luogo
        if (req.query.owner) filters.owner = req.query.owner;
        if (req.query.name) filters.name = { $regex: req.query.name, $options: 'i' };
        if (req.query.openAt) {
            const [day, time] = req.query.openAt.split(',');
            if (day && time) {
                filters.hours = {
                    $elemMatch: {
                        day: day.toLowerCase(),
                        open: { $lte: time },
                        close: { $gte: time }
                    }
                };
            }
        }

        const restaurants = await Restaurant.find(filters).populate('owner', 'username email');
        res.json(restaurants);
    } catch (err) {
        console.error(`Error fetching restaurants: ${err.message}`);

        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'username email');
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (err) {
        console.error(`Error fetching restaurant: ${err.message}`);

        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.updateRestaurant = async (req, res) => {
    try {
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ updatedRestaurant });
    } catch (err) {
        console.error(`Error updating restaurant: ${err.message}`);

        if (err.name === 'ValidationError')
            return res.status(400).json({ message: 'Invalid input', details: err.errors });

        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.deleteRestaurant = async (req, res) => {
    try {
        await Restaurant.findByIdAndDelete(req.params.id);
        res.json({ message: 'Restaurant deleted' });
    } catch (err) {
        console.error(`Error deleting restaurant: ${err.message}`);

        res.status(500).json({ message: 'Internal server error' });
    }
}


