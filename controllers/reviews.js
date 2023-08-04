/* eslint-disable no-underscore-dangle */
const round = require('lodash.round');
const divide = require('lodash.divide');
const multiply = require('lodash.multiply');
const Review = require('../model/reviews');
const Product = require('../model/products');

exports.postReview = async (req, res) => {
    const { body, rating } = req.body;
    const { id } = req.params;
    const product = await Product.findById(id);
    const review = new Review({
        body,
        rating,
        author: req.userId,
        productId: product._id,
    });

    const totalReviews = product.rating.reviews.length;
    const newOverallRating = round(
        divide(
            round(multiply(product.rating.overallRating, totalReviews)) +
                +rating,
            totalReviews + 1
        ),
        1
    );

    product.rating.reviews.push(review._id);
    product.rating.overallRating = newOverallRating;

    await review.save();
    await product.save();
    res.status(200).json({ message: 'Succesfully added review.' });
};

exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    const product = await Product.findById(id);

    const totalReviews = product.rating.reviews.length;

    const newOverallRating =
        totalReviews - 1 === 0
            ? 0
            : round(
                  divide(
                      round(
                          multiply(product.rating.overallRating, totalReviews)
                      ) - review.rating,
                      totalReviews - 1
                  ),
                  1
              );

    product.rating.reviews.pull(reviewId);
    product.rating.overallRating = newOverallRating;

    await product.save();
    await review.deleteOne();
    res.status(200).json({ message: 'Succesfully deleted review.' });
};
