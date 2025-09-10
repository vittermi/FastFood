# FastFood Backend

This is the backend for the FastFood project.

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/vittermi/FastFood.git
cd ./FastFood/fastfood-backend
```
### 2. Install dependencies
```sh
npm install
```

### 3. Set up environment variables 
example .env (docker compose):
```
PORT=5050
MONGO_URI=mongodb://mongo:27017/fastfood
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=1d
```

example .env (Local):
```
PORT=5050
MONGO_URI=mongodb://localhost:27017/fastfood
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=1d
```

Change the MONGO_URI variable accordingly if running a remote mongo server.

### 4a. Run the backend locally (requires running mongodb instance)

```sh
npm start
```

**If your mongo instance is empty** import templateDishes with the following command.
If your mongo was not running do not worry, the script checks for duplicates.

```sh
npm run import:dishes
```

### 4b. Or run everything with Docker Compose

It will run a mongodb instance (with a volume to persist data once the container is stopped), the backend and the frontend applications

```sh
docker compose up
```

The app will be available at http://localhost:5050 by default.
A Swagger describing the APIs will be available at http://localhost:5050/api-docs once the application is started.

To import the dish data, you have to run the following command

```sh
docker compose exec backend npm run import:dishes
```

which will check if in the mongodb instance running inside the container the DishTemplate collection exists, and if not imports meal.json
