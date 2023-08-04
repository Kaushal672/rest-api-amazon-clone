const { checkValidationErrors } = require('../utils/validators');
const Product = require('../model/products');
const { Cart } = require('../model/cart');
const Order = require('../model/orders');
const Review = require('../model/reviews');
const { cloudinary } = require('../cloudinary/index');
const ExpressError = require('../utils/ExpressError');

exports.getProducts = async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({ products });
};

exports.addProduct = async (req, res) => {
    checkValidationErrors(req);
    const { title, description, price, discount, category, images } = req.body;
    const user = await User.findById(req.userId);
    if (!user.company)
        throw new ExpressError('You are not a seller on Amazon.', 403);
    const product = new Product({
        title,
        description,
        price,
        discount,
        category,
        images: JSON.parse(images),
        seller: req.userId,
    });
    await product.save();

    res.status(201).json({
        message: 'Product added successfully',
        product,
    });
};

exports.getProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id).populate([
        { path: 'seller', select: 'company' },
        {
            path: 'rating.reviews',
            options: { limit: 10 },
            select: '-createdAt -updatedAt',
            populate: {
                path: 'author',
                model: 'User',
                select: 'username avatar',
            },
        },
    ]);
    if (!product) {
        throw new ExpressError('Post could not be found', 404);
    }

    res.status(200).json({ product });
};

exports.updateProduct = async (req, res) => {
    checkValidationErrors(req);
    const { id } = req.params;
    const { title, description, price, discount, category, images } = req.body;
    const product = await Product.findByIdAndUpdate(
        id,
        {
            title,
            price,
            description,
            discount,
            category,
            images: JSON.parse(images),
        },
        { new: true }
    );
    await product.save();

    res.status(200).json({
        message: 'Product updated successfully',
        product,
    });
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (product.seller.toString() !== req.userId)
        throw new ExpressError('Action Denied', 403);

    // eslint-disable-next-line no-restricted-syntax
    for await (const prod of Object.values(product.images)) {
        await cloudinary.uploader.destroy(prod.filename);
    }

    await Product.deleteOne({ _id: id });

    await Cart.updateMany({}, { $pull: { items: { productId: id } } });
    await Review.deleteMany({ productId: id });
    await Order.updateMany({}, { $pull: { products: { productId: id } } });
    res.status(200).json({
        message: 'Product deleted successfully',
        product,
    });
};

exports.deleteImage = async (req, res) => {
    const { files } = req.body;
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filename } of JSON.parse(files)) {
        await cloudinary.uploader.destroy(filename);
    }
    res.status(200).json({ message: 'Deleted Images' });
};

exports.getCart = async (req, res) => {
    const cart = await Cart.findOne({ userId: req.userId }).populate(
        'items.productId'
    );

    if (!cart) throw new ExpressError('Cart not found', 404);

    const total = cart.items.reduce(
        (tot, cur) => tot + cur.price * cur.quantity,
        0
    );

    res.status(200).json({ cart: { ...cart._doc, total } });
};

exports.addToCart = async (req, res) => {
    const { productId, quantity = 1, replace } = req.body;

    const product = await Product.findById(productId);
    if (!product) throw new ExpressError('Product not found.', 404);

    const cart = await Cart.findOne({ userId: req.userId });

    if (!cart) throw new ExpressError('Cart not found', 404);

    await cart.addToCart(productId, quantity, product.formattedPrice, replace);

    res.status(200).json({ message: 'Successfully added to cart.' });
};

exports.removeFromCart = async (req, res) => {
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId: req.userId });

    if (!cart) throw new ExpressError('Cart not found', 404);

    await cart.removeFromCart(productId);

    res.status(200).json({ message: 'Successfully removed from cart.' });
};

};
