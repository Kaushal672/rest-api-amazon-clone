const mongoose = require('mongoose');
const { itemSchema } = require('./cart');

const { Schema } = mongoose;

const invoiceSchema = new Schema({
    url: String,
    filename: String,
});

const ordersSchema = new Schema(
    {
        products: [itemSchema],
        invoice: invoiceSchema,
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        total: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', ordersSchema);
