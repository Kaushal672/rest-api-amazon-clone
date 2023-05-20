const express = require('express');
const multer = require('multer');
const { storage } = require('../cloudinary/index');

const catchAsync = require('../utils/catchAsync');

const upload = multer({
    storage,
    limits: { fileSize: 4e6, files: 3 },
});

const router = express.Router();

const productController = require('../controllers/products');

router
    .route('/')
    .get(catchAsync(productController.getProducts))
    .post(upload.array('image'), catchAsync(productController.addProduct));

router
    .route('/:id')
    .get(catchAsync(productController.getProduct))
    .put(upload.array('image'), catchAsync(productController.updateProduct))
    .delete(catchAsync(productController.deleteProduct));

module.exports = router;
