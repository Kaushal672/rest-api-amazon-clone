/* eslint-disable no-underscore-dangle */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const {
    generateCustomerInformation,
    generateFooter,
    generateHeader,
    generatePriceTable,
    savePdfToFile,
} = require('../utils/createPdf');
const User = require('../model/users');
const Product = require('../model/products');
const { Cart } = require('../model/cart');
const Order = require('../model/orders');
const Review = require('../model/reviews');
const { cloudinary } = require('../cloudinary/index');
const ExpressError = require('../utils/ExpressError');
const { escapeRegex } = require('../utils/helper');

exports.getProducts = async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({ products });
};

exports.addProduct = async (req, res) => {
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
            select: '-__v -updatedAt',
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

exports.getOrders = async (req, res) => {
    const orders = await Order.find({ userId: req.userId })
        .sort({
            createdAt: -1,
        })
        .limit(10)
        .populate('products.productId');

    if (!orders) throw new ExpressError('Orders not found', 404);

    res.status(200).json({ orders });
};

exports.postOrders = async (req, res) => {
    const { productId, mode } = req.body;
    const user = await User.findById(req.userId);
    const address = user.addresses.find((addr) => addr.default);

    if (!address) throw new ExpressError('No default address found!', 403);

    let order;
    let products;
    let total;
    if (mode === 'cart') {
        order = await Cart.findOne(
            { userId: req.userId },
            {
                _id: 0,
                'items.productId': 1,
                'items.quantity': 1,
                'items.price': 1,
            }
        );
        products = order.items;
        total = order.items.reduce(
            (tot, cur) => tot + cur.price * cur.quantity,
            0
        );
    } else {
        const product = await Product.findById(productId);

        order = {
            items: [
                {
                    productId: {
                        title: product.title,
                        images: [{ url: product.images[0].url }],
                    },
                    quantity: 1,
                    price: product.formattedPrice,
                },
            ],
        };

        products = [
            {
                productId: product._id,
                price: product.formattedPrice,
                quantity: 1,
            },
        ];
        total = product.formattedPrice;
    }

    const customer = await stripe.customers.create({
        metadata: {
            userId: req.userId,
            products: JSON.stringify(products),
            total,
            mode,
            origin: req.get('origin'),
            address: JSON.stringify(address),
        },
    });

    if (mode === 'cart') {
        order = await order.populate('items.productId', 'title images');
    }

    const session = await stripe.checkout.sessions.create({
        line_items: order.items.map((prod) => {
            return {
                price_data: {
                    currency: 'INR',
                    product_data: {
                        name: prod.productId.title,
                        images: [prod.productId.images[0].url],
                    },
                    unit_amount: prod.price * 100,
                },
                quantity: prod.quantity,
            };
        }),
        customer: customer.id,
        payment_intent_data: {
            shipping: {
                name: address.fullName,
                phone: `+91${address.phone}`,
                address: {
                    country: address.country,
                    state: address.state,
                    city: address.city,
                    line1: address.addressline,
                    postal_code: address.pincode,
                },
            },
        },
        mode: 'payment',
        success_url: `${req.protocol}://${req.get(
            'host'
        )}/products/checkout?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.get('origin')}/${
            mode === 'cart' ? 'cart' : `products/${products[0].productId}`
        }`,
    });

    res.status(200).json({ url: session.url });
};

exports.getCheckoutSuccess = async (req, res, next) => {
    const sessionId = req.query.session_id;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customer = await stripe.customers.retrieve(session.customer);

    const products = JSON.parse(customer.metadata.products);

    const order = new Order({
        products,
        userId: customer.metadata.userId,
        total: +customer.metadata.total,
    });

    const populatedOrder = await order.populate('products.productId', 'title');

    const invoiceName = `invoice-${order._id}.pdf`;

    const invoicePath = path.join(
        __dirname,
        '..',
        'data',
        'invoices',
        invoiceName
    );

    const pdfDoc = new PDFDocument({ size: 'A4', margin: 50 });

    pdfDoc.registerFont('Arial', 'public/fonts/arial.ttf');
    pdfDoc.font('Arial');

    generateHeader(pdfDoc, customer.metadata.origin);
    generateCustomerInformation(
        pdfDoc,
        order._id.toString(),
        JSON.parse(customer.metadata.address),
        +customer.metadata.total
    );
    generatePriceTable(pdfDoc, populatedOrder, +customer.metadata.total);
    generateFooter(pdfDoc);

    await savePdfToFile(pdfDoc, invoicePath);

    const invoice = await cloudinary.uploader.upload(invoicePath, {
        resource_type: 'auto',
        use_filename: true,
        unique_filename: false,
    });

    order.invoice = {
        filename: invoice.public_id,
        url: invoice.url.replace('upload/', 'upload/fl_attachment/'),
    };

    await order.save();

    if (customer.metadata.mode === 'cart') {
        await Cart.updateOne(
            { userId: customer.metadata.userId },
            { $set: { items: [] } }
        );
    }

    fs.unlink(invoicePath, function (err) {
        if (err) {
            next(err);
        }
    });

    res.redirect(`${customer.metadata.origin}/orders`);
};

exports.searchProducts = async (req, res) => {
    const { q, category } = req.query;
    const regex = new RegExp(escapeRegex(q), 'gi');

    const query = {
        $text: { $search: regex },
    };

    if (category !== 'All') {
        const catRgx = new RegExp(escapeRegex(escapeRegex(category)), 'i');
        query.category = catRgx;
    }

    const products = await Product.find(query);

    res.status(200).json({ products, query: q });
};
