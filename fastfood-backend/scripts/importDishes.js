const fs = require('fs');
const path = require('path');
const DishTemplate = require('../src/models/DishTemplate'); 
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  await importDishesIfEmpty();
  await mongoose.disconnect();
}

async function importDishesIfEmpty() {
    const dishCount = await DishTemplate.countDocuments();
    if (dishCount > 0) {
        console.log('Collection is not empty, import skipped.');
        return;
    }

    const raw = fs.readFileSync(path.join(__dirname, 'meals.json'), 'utf-8');
    const data = JSON.parse(raw);

    const dishes = data.map(item => transformDishData(item));


    await DishTemplate.insertMany(dishes);
    console.log(`Imported ${dishes.length} meals.`);
}

function transformDishData(dish) {
    return {
        name: dish.strMeal,
        ingredients: dish.ingredients,
        allergens: [], // al momento non sono previsti allergeni
        category: dish.strCategory || '',
        tags: dish.strTags ? dish.strTags.split(',').map(tag => tag.trim()) : [],
        photo: dish.strMealThumb || ''
    };
}

main()
    .then(() => process.exit())
    .catch(err => { console.error(err); process.exit(1); });
