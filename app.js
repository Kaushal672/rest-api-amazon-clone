const express = require('express');
const mongoose = require('mongoose');
const productsRoute = require('./routes/products');
require('dotenv').config();

const app = express();

app.use(express.json());
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
