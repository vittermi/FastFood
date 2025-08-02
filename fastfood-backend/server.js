const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yml');

const path = require('path')



dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());


// configurazione header CSP helmet per evitare attacchi XSS e permettere bootstrap ecc
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net", 
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // non sicurissimo ma c'est la vie
        "https://cdn.jsdelivr.net",
      ],
      fontSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
      ],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);


// api frontend

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/restaurants', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'browse-restaurants.html')));

app.get('/menu/:id', (req, res) => {
    const restaurantId = req.params.id;
    res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

app.get('/owner/restaurants', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'manage-restaurants.html')));




// api backend 


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/orders', require('./src/routes/order.routes'));
app.use('/api/restaurants', require('./src/routes/restaurant.routes'));
app.use('/api/dishes', require('./src/routes/dish.routes'));


const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error(err));
