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
        "https://cdn.jsdelivr.net", // bootstrap
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // non sicurissimo ma c'est la vie
        "https://cdn.jsdelivr.net", // bootstrap
        "https://fonts.googleapis.com", // google fonts
      ],
      fontSrc: [
        "'self'",
        "https://fonts.googleapis.com", // google fonts
        "https://fonts.gstatic.com", // google fonts
        "https://cdn.jsdelivr.net", // bootstrap
      ],
      imgSrc: ["*", "data:"], // para las imajes de meals.json y bootstrap
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);


// api frontend

const pagePath = path.join(__dirname, 'public', 'pages');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(pagePath, 'login.html')));
app.get('/restaurants', (_req, res) => res.sendFile(path.join(pagePath, 'browse-restaurants.html')));

app.get('/menu/:id', (req, res) => {
    const restaurantId = req.params.id;
    res.sendFile(path.join(pagePath, 'menu.html'));
});

app.get('/owner/restaurant', (_req, res) => res.sendFile(path.join(pagePath, 'manage-restaurant.html')));

app.get('/register', (_req, res) => res.sendFile(path.join(pagePath, 'register.html')));

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
