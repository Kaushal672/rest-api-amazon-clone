const express = require('express');
const { reviewValidators } = require('../utils/validators');

const router = express.Router({ mergeParams: true });
const isAuth = require('../middleware/isAuth');
const reviewController = require('../controllers/reviews');
const catchAsync = require('../utils/catchAsync');
const checkValidationErrors = require('../middleware/checkValidationErrors');

router.post(
    '/',
    isAuth,
    reviewValidators,
    checkValidationErrors,
    catchAsync(reviewController.postReview)
);
router.delete('/:reviewId', isAuth, catchAsync(reviewController.deleteReview));

module.exports = router;
