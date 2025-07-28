const Dish = require('../models/Dish');

exports.getDishes = async (req, res) => {
    try {
        const filters = {};

        if (req.query.type) filters.type = req.query.type;
        if (req.query.name) filters.name = { $regex: req.query.name, $options: 'i' };
        if (req.query.maxPrice) filters.price = { $lte: parseFloat(req.query.maxPrice) };

        if (req.query.ingredient) {
            filters.ingredients = { $in: [req.query.ingredient] };
        }

        if (req.query.allergen) {
            filters.allergens = { $in: [req.query.allergen] };
        }

        const dishes = await Dish.find(filters).populate('restaurant', 'name');
        res.json(dishes);
    } catch (err) {
        console.error('Error fetching dishes:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDishById = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id).populate('restaurant', 'name');
        if (!dish) return res.status(404).json({ message: 'Dish not found' });
        res.json(dish);
    } catch (err) {
        console.error('Error fetching dish:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDishesForRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const dishes = await Dish.find({ restaurant: restaurantId });
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createDish = async (req, res) => {
    try {
        const { name, type, ingredients, measures, allergens, price, photo, restaurant } = req.body;

        const newDish = new Dish({
            name,
            type,
            ingredients,
            measures,
            allergens,
            price,
            photo,
            restaurant
        });

        await newDish.save();
        res.status(201).json(newDish);
    } catch (err) {
        console.error('Error creating dish:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};


