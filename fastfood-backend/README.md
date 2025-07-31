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
example .env:
```
PORT=5050
MONGO_URI=mongodb://mongo:27017/fastfood
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=1d
```


### 4a. Run the backend locally 

```sh
npm start
```


### 4b. Or run everything with Docker Compose

It will run a mongodb instance (with a volume to persist data once the container is stopped), the backend and the frontend applications (see main readme)

```sh
docker compose up
```

The APIs will be available at http://localhost:5050 by default, a Swagger describing the APIs will be available at the /api-docs endpoint once the application is started.