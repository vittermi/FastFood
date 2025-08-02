const Cart = require('../models/Cart');
const Dish = require('../models/Dish');

exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ customer: req.user.id }).populate('items.dish');
        if (!cart) return res.json({ items: [] });
        res.json(cart);
    } catch (err) {
        console.error(`Error fetching cart: ${err.message}`);

        if (err.name === 'ValidationError') 
            return res.status(400).json({ message: 'Invalid cart data' });
        
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { dishId, quantity } = req.body;
        if (!dishId || quantity < 1) return res.status(400).json({ message: 'Invalid input' });

        const cart = await Cart.findOne({ customer: req.user.id }) || new Cart({ customer: req.user.id });

        const existingItem = cart.items.find(item => item.dish.toString() === dishId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ dish: dishId, quantity });
        }

        await cart.save();
        res.status(200).json(cart);
    } catch (err) {
        console.error(`Error adding to cart: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ customer: req.user.id });
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        console.error(`Error clearing cart: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.removeDishFromCart = async (req, res) => {
    try {
        const { dishId } = req.params;
        const cart = await Cart.findOne({ customer: req.user.id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.items = cart.items.filter(item => item.dish.toString() !== dishId);
        await cart.save();
        res.status(200).json(cart);
    } catch (err) {
        console.error(`Error removing dish: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};
