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

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization '
    );
    next();
});

app.use('/products', productsRoute);

app.use((err, req, res, _next) => {
    const { statusCode = 500 } = err;
    // eslint-disable-next-line no-param-reassign
    if (!err.message) err.message = 'Something went wrong, Try again!';
    res.status(statusCode).json({ message: err.message });
});

async function main() {
    await mongoose.connect(process.env.DB_URL);
    app.listen(process.env.PORT, () =>
        console.log('App listening on port 8080')
    );
}

main().catch((err) => console.log('ERROR', err));
