const express = require('express');

const catchAsync = require('../utils/catchAsync');
const { productValidators } = require('../utils/validators');

const router = express.Router();

const productController = require('../controllers/products');
const isAuth = require('../middleware/isAuth');

router
    .route('/')
    .get(catchAsync(productController.getProducts))
    .post(isAuth, productValidators, catchAsync(productController.addProduct))
    .delete(isAuth, catchAsync(productController.deleteImage));

router
    .route('/cart')
    .get(isAuth, catchAsync(productController.getCart))
    .post(isAuth, catchAsync(productController.addToCart))
    .delete(isAuth, catchAsync(productController.removeFromCart));

router
    .route('/:id')
    .get(catchAsync(productController.getProduct))
    .put(isAuth, productValidators, catchAsync(productController.updateProduct))
    .delete(isAuth, catchAsync(productController.deleteProduct));

module.exports = router;
