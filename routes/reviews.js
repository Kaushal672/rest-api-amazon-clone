const express = require('express');
const { reviewValidators } = require('../utils/validators');

const router = express.Router({ mergeParams: true });
const isAuth = require('../middleware/isAuth');
const reviewController = require('../controllers/reviews');
const catchAsync = require('../utils/catchAsync');

router.post(
    '/',
    isAuth,
    reviewValidators,
    catchAsync(reviewController.postReview)
);
router.delete('/:reviewId', isAuth, catchAsync(reviewController.deleteReview));

module.exports = router;
