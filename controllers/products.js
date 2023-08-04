const Product = require('../model/products');
const { cloudinary } = require('../cloudinary/index');

exports.getProducts = async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({ products });
};

exports.addProduct = async (req, res) => {
    const { title, description, price } = req.body;
    const product = new Product({
        title,
        description,
        price,
    });
    product.images = req.files.map((f) => ({
        url: f.path,
        filename: f.filename,
    }));

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
    const { title, price, description } = req.body;
    const product = await Product.findByIdAndUpdate(
        id,
        {
            title,
            price,
            description,
        },
        { new: true }
    );
    const imgs = req.files.map((f) => ({
        url: f.path,
        filename: f.filename,
    }));
    product.images.push(...imgs);
    await product.save();
    res.status(200).json({ message: 'Product updated successfully', product });
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    // eslint-disable-next-line no-restricted-syntax
    for await (const prod of Object.values(product.images)) {
        await cloudinary.uploader.destroy(prod.filename);
    }

    res.status(200).json({ message: 'Product deleted successfully', product });
};
