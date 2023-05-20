const express = require('express');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

const productController = require('../controllers/products');

router
    .route('/')
    .get(catchAsync(productController.getProducts))
    .post(catchAsync(productController.addProduct));

router.route('/:id').get(catchAsync(productController.getProduct));

module.exports = router;
