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
            required: true,
        },
        images: [ImageSchema],
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            min: 0,
        },
        category: {
            type: String,
            required: true,
        },
        discount: {
            type: String,
            required: true,
        },
        offer: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
