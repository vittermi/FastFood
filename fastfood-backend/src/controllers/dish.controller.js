const Dish = require('../models/Dish');
const DishTemplate = require('../models/DishTemplate');
const Restaurant = require('../models/Restaurant');


exports.createDish = async (req, res) => {
    try {
        const {
            baseDish, restaurant, name, type, ingredients, category,
            allergens, price, isAvailable, photo
        } = req.body;

        if (baseDish) {
            const base = await DishTemplate.findById(baseDishId);
            if (!base) return res.status(404).json({ message: `Base dish with id ${Dish.baseDishId}` });
        }

        const newDish = new Dish({
            restaurant,
            baseDish,
            name,
            type,
            ingredients,
            category,
            allergens,
            price,
            isAvailable, // se null default true
            photo,
            restaurant
        });

        await newDish.save();
        res.status(201).json(newDish);
    } catch (err) {
        console.error('Error creating dish:', err.message);

        if (err.name === 'ValidationError')
            return res.status(400).json({ message: 'Invalid input', details: err.errors });

        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getTemplateDishes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const skip = (page - 1) * limit;

        const filters = {};
        if (req.query.type) filters.type = req.query.type;

        const templates = await DishTemplate.find(filters)
            .skip(skip)
            .limit(limit);

        const total = await DishTemplate.countDocuments(filters);

        res.json({
            data: templates,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (err) {
        console.error(`Error fetching dish templates: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getDishById = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id).populate('baseDish');
        if (!dish) return res.status(404).json({ message: 'Dish not found' });

        const base = dish.baseDish || {};

        const merged = {
            _id: dish._id,
            restaurant: dish.restaurant,
            baseDish: base._id || null,
            name: dish.name || base.name,
            ingredients: dish.ingredients || base.ingredients,
            measures: dish.measures || base.measures,
            allergens: dish.allergens || base.allergens,
            type: dish.type || base.type,
            photo: dish.photo || base.photo,
            price: dish.price,
            isAvailable: dish.isAvailable
        };

        res.json(merged);
    } catch (err) {
        console.error(`Error fetching dish: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getDishesForRestaurant = async (req, res) => {
    try {

        const { restaurantId } = req.params;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) 
            return res.status(404).json({ message: 'Restaurant not found' });
        

        const filters = {};
        if (req.query.type) filters.type = req.query.type;
        if (req.query.isAvailable) filters.isAvailable = req.query.isAvailable === 'true';
        if (req.query.name) filters.name = new RegExp(req.query.name, 'i');

        if (req.query.minPrice) filters.price = { ...filters.price, $gte: parseFloat(req.query.minPrice) };
        if (req.query.maxPrice) filters.price = { ...filters.price, $lte: parseFloat(req.query.maxPrice) };

        filters.restaurant = restaurantId;

        const dishes = await Dish.find(filters).populate('baseDish');
        const result = dishes.map(dish => {
        const base = dish.baseDish || {};

      return {
        _id: dish._id,
        restaurant: dish.restaurant,
        baseDish: base._id || null,
        name: dish.name || base.name,
        ingredients: dish.ingredients || base.ingredients,
        measures: dish.measures || base.measures,
        allergens: dish.allergens || base.allergens,
        type: dish.type || base.type,
        photo: dish.photo || base.photo,
        price: dish.price,
        isAvailable: dish.isAvailable
      };
    });

    res.json(result);

        res.json(dishes);
    } catch (err) {
        console.error(`Error fetching dishes for restaurant}: ${err.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};


//todo update e delete se i piatti possono essere modificat/cancellati (per riferimento a Order)


