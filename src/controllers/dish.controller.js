const Dish = require('../models/Dish');
const DishTemplate = require('../models/DishTemplate');
const Restaurant = require('../models/Restaurant');

const CATEGORY_CACHE_TTL_MS = Infinity; // Dati sempre uguali una volta eseguito imporz
let categoryCache = { list: null, expiresAt: 0 };



exports.createDish = async (req, res) => {

    const restaurant = await Restaurant.findOne({ owner: req.user.id }).select('_id').lean().exec();

    try {
        const {
            baseDish, name, type, ingredients, category,
            allergens, price, tags, photo
        } = req.body;

        if (baseDish) {
            const base = await DishTemplate.findById(baseDish);
            if (!base) return res.status(404).json({ message: `Base dish with id ${Dish.baseDish}` });
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
            tags,
            photo,
        });

        await newDish.save();

        console.log(`Dish created: ${newDish}`);
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
        if (req.query.category) filters.category = req.query.category;

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
            ingredients: (Array.isArray(dish.ingredients) && dish.ingredients.length > 0)
                ? dish.ingredients : base.ingredients,
            category: dish.category || base.category,
            allergens: (Array.isArray(dish.allergens) && dish.allergens.length > 0)
                ? dish.allergens : base.allergens,
            price: dish.price,
            tags: (Array.isArray(dish.tags) && dish.tags.length > 0)
                ? dish.tags : base.tags,
            photo: dish.photo || base.photo,
        };

        res.json(merged);
        console.log(`Dish fetched: ${merged}`);
    } catch (err) {
        console.error(`Error fetching dish: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getTemplateDishById = async (req, res) => {
    try {
        const templateDish = await DishTemplate.findById(req.params.id)
        if (!templateDish) return res.status(404).json({ message: 'Template not found' });

        res.json(templateDish);
        console.log(`Dish fetched: ${templateDish._id}`);
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
        if (req.query.category) filters.category = req.query.category;
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
                ingredients: (Array.isArray(dish.ingredients) && dish.ingredients.length > 0)
                    ? dish.ingredients : base.ingredients,
                category: dish.category || base.category,
                allergens: (Array.isArray(dish.allergens) && dish.allergens.length > 0)
                    ? dish.allergens : base.allergens,
                price: dish.price,
                tags: (Array.isArray(dish.tags) && dish.tags.length > 0)
                    ? dish.tags : base.tags,
                photo: dish.photo || base.photo,
            };
        });

        res.json(result);

    } catch (err) {
        console.error(`Error fetching dishes for restaurant}: ${err.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getDishCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const skip = (page - 1) * limit;

        const now = Date.now();
        if (!categoryCache.list || now >= categoryCache.expiresAt) {
            const rows = await DishTemplate.aggregate([
                { $match: { category: { $type: "string", $ne: "" } } },
                { $group: { _id: { $toLower: "$category" }, sample: { $first: "$category" } } },
                { $project: { _id: 0, category: "$sample" } },
                { $sort: { category: 1 } },
            ]);

            categoryCache.list = rows.map(r => r.category);
            categoryCache.expiresAt = now + CATEGORY_CACHE_TTL_MS;
        }

        const totalItems = categoryCache.list.length;
        const data = categoryCache.list.slice(skip, skip + limit);

        res.json({
            data, 
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalItems / limit),
                totalItems
            }
        });
    } catch (err) {
        console.error(`Error fetching distinct categories: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.updateDish = async (req, res) => {

    const dishId = req.params.id;

    try {
        const {
            name, ingredients, category,
            allergens, price, tags, photo
        } = req.body;

        const dish = await Dish.findById(dishId);
        if (!dish) return res.status(404).json({ message: `Dish with id ${dishId} not found` });
        
        const updatedDish = await Dish.findByIdAndUpdate(dishId, {
            name,
            ingredients,
            category,
            allergens,
            price,
            tags,
            photo,
        });

        console.log(`Dish updated: ${dishId}`);
        res.status(200).json(updatedDish);
    } catch (err) {
        console.error('Error updating dish:', err.message);

        if (err.name === 'ValidationError')
            return res.status(400).json({ message: 'Invalid input', details: err.errors });

        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.deleteDish = async (req, res) => {
    try {
        const dishId = req.params.id;

        const dish = await Dish.findById(dishId);
        if (!dish) return res.status(404).json({ message: `Dish with id ${dishId} not found` });

        await Dish.findByIdAndDelete(dishId);
        console.log(`Dish deleted: ${dishId}`);
        res.status(200).send();
    } catch (err) {
        console.error('Error deleting dish:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

