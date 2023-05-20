const Product = require('../model/products');

exports.getProducts = async (req, res) => {
    const { page = 1 } = req.query;
    const perPage = 2;
    const count = await Product.find().countDocuments();

    const products = await Product.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage);
    res.status(200).json({ products, count });
};

exports.addProduct = async (req, res) => {
    console.log('Inside controller');
    const { title, description, price } = req.body;
    const product = new Product({
        title,
        description,
        price,
    });
    product.imageUrl = req.files[0].path;

    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
};

exports.getProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
        const error = new Error('Post could not be found');
        error.statusCode = 404;
        throw error;
    }
    res.status(200).json({ product });
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { title, price, description, imageUrl } = req.body;
    const product = await Product.findByIdAndUpdate(
        id,
        {
            title,
            price,
            description,
            imageUrl,
        },
        { new: true }
    );
    await product.save();
    res.status(200).json({ message: 'Product updated successfully', product });
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    res.status(200).json({ message: 'Product deleted successfully', product });
};
