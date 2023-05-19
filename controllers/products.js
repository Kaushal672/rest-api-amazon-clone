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
