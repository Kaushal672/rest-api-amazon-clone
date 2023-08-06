const mongoose = require('mongoose');

const { Schema } = mongoose;

const ImageSchema = new Schema({
    url: String,
    filename: String,
});

const productSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is not valid'],
        },
        images: {
            type: [ImageSchema],
            validate: {
                validator: (v) =>
                    Array.isArray(v) && v.length > 0 && v.length <= 3,
                message: 'Please upload atleast one and at most 3 images.',
            },
        },
        description: {
            type: String,
            required: [true, 'Description is not valid'],
        },
        price: {
            type: Number,
            min: [0, 'Price must be greater or equal to zero'],
        },
        category: {
            type: String,
            required: [true, 'Category is not valid'],
        },
        discount: {
            type: Number,
            min: [0, 'Discount must be greater or equal to 0'],
            max: [100, 'Discount must be lesser or equal to 100'],
        },
        offer: String,
        seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        formattedPrice: Number,
        rating: {
            reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
            overallRating: { type: Number, default: 0 },
        },
    },

    { timestamps: true }
);

productSchema.pre('save', function (next) {
    this.formattedPrice =
        +Math.floor(this.price - this.price * (this.discount / 100))
            .toString()
            .slice(0, -1) *
            10 +
        9;
    next();
});

productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
