/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line global-require
    require('dotenv').config();
}
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const productsRoute = require('./routes/products');
const authRoute = require('./routes/users');
const reviewRoute = require('./routes/reviews');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
    );
    next();
});

app.use('/auth', authRoute);
app.use('/products', productsRoute);
app.use('/products/:id/reviews', reviewRoute);

app.use((err, req, res, _next) => {
    if (err.name === 'ValidationError') err.statusCode = 422;
    if (err.name === 'MongoServerError' && err.code === 11000) {
        err.statusCode = 422;
        err.message = `${Object.entries(err.keyValue)[0][0]} (${
            Object.entries(err.keyValue)[0][1]
        }) already exists!`;
    }
    const { statusCode = 500, data = [] } = err;

    if (!err.message) err.message = 'Something went wrong, Try again!';
    res.status(statusCode).json({ message: err.message, data });
});

async function main() {
    await mongoose.connect(process.env.DB_URL);
    app.listen(process.env.PORT, () =>
        console.log('App listening on port 8080')
    );
}

main().catch((err) => console.log('ERROR', err));
