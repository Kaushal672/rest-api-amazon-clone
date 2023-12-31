const express = require('express');

const catchAsync = require('../utils/catchAsync');
const { productValidators } = require('../utils/validators');

const router = express.Router();

const productController = require('../controllers/products');
const isAuth = require('../middleware/isAuth');
const checkValidationErrors = require('../middleware/checkValidationErrors');

router
    .route('/')
    .get(catchAsync(productController.getProducts))
    .post(
        isAuth,
        productValidators,
        checkValidationErrors,
        catchAsync(productController.addProduct)
    )
    .delete(isAuth, catchAsync(productController.deleteImage));

router.get('/search', catchAsync(productController.searchProducts));

router
    .route('/cart')
    .get(isAuth, catchAsync(productController.getCart))
    .post(isAuth, catchAsync(productController.addToCart))
    .delete(isAuth, catchAsync(productController.removeFromCart));

router
    .route('/orders')
    .get(isAuth, catchAsync(productController.getOrders))
    .post(isAuth, catchAsync(productController.postOrders));

router.route('/checkout').get(catchAsync(productController.getCheckoutSuccess));

router
    .route('/:id')
    .get(catchAsync(productController.getProduct))
    .put(
        isAuth,
        productValidators,
        checkValidationErrors,
        catchAsync(productController.updateProduct)
    )
    .delete(isAuth, catchAsync(productController.deleteProduct));

module.exports = router;
