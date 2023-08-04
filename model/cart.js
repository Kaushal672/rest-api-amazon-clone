const mongoose = require('mongoose');

const { Schema } = mongoose;

const itemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: {
        type: Number,
        max: [10, 'Only 10 quantity of one item can be added.'],
        required: true,
    },
    price: { type: Number, required: true },
});

const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    items: [itemSchema],
});

cartSchema.methods.addToCart = function (productId, quantity, price, replace) {
    const index = this.items.findIndex(
        (p) => p.productId.toString() === productId
    );

    let qty = +quantity;
    const updatedCartItems = this.items.slice();

    if (index > -1) {
        qty += replace ? 0 : this.items[index].quantity;
        updatedCartItems[index].quantity = qty;
    } else {
        updatedCartItems.push({ productId, quantity: qty, price });
    }

    this.items = updatedCartItems;
    return this.save();
};

cartSchema.methods.removeFromCart = async function (productId) {
    const updatedCarItems = this.items.filter(
        (p) => p.productId.toString() !== productId
    );

    this.items = updatedCarItems;

    return this.save();
};

module.exports = { Cart: mongoose.model('Cart', cartSchema), itemSchema };
