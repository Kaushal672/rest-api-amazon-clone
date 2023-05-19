const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            min: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
