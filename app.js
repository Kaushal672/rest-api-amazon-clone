const express = require('express');
const mongoose = require('mongoose');
const productsRoute = require('./routes/products');
require('dotenv').config();

const app = express();

app.use('/products', productsRoute);

async function main() {
    await mongoose.connect(process.env.DB_URL);
    app.listen(process.env.PORT);
}

main().catch((err) => console.log('ERROR', err));
