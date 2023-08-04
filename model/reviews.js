const mongoose = require('mongoose');

const { Schema } = mongoose;

const reviewSchema = new Schema(
    {
        body: { type: String, required: true },
        rating: {
            type: Number,
            min: [1, 'Rating should be minimum 1.'],
            max: [5, 'Rating should not be more than 5'],
        },
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
