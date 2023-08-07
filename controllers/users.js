/* eslint-disable no-underscore-dangle */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../model/users');
const Product = require('../model/products');
const { Cart } = require('../model/cart');
const { createJSONToken } = require('../utils/helper');
const ExpressError = require('../utils/ExpressError');
const { cloudinary } = require('../cloudinary');

const DEFAULT_PROFILE_FILENAME = 'India Tour/default_avatar_fbyzfp.jpg';

exports.signup = async (req, res) => {
    const { email, password, phone, username } = req.body;
    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
        email,
        password: hashedPw,
        phone,
        username,
        addresses: [],
    });

    if (req.file) {
        user.avatar.filename = req.file.filename;
        user.avatar.url = req.file.path;
    }

    const cart = new Cart({ userId: user._id, items: [] });

    user.cart = cart._id;

    await cart.save();

    await user.save();

    const accessToken = createJSONToken(
        { username: user.username, userId: user._id.toString() },
        process.env.JWT_ACCESS_KEY,
        '10m'
    );

    const refreshToken = createJSONToken(
        { userId: user._id.toString() },
        process.env.JWT_REFRESH_KEY,
        '24h'
    );

    res.cookie('jwt_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        message: 'Successfully signed up!',
        accessToken,
        address: null,
        cart: 0,
    });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('cart');

    if (!user) {
        throw new ExpressError('Email or Password is wrong', 422);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ExpressError('Email or Password is wrong', 422);
    }
    const accessToken = createJSONToken(
        { username: user.username, userId: user._id.toString() },
        process.env.JWT_ACCESS_KEY,
        '30s'
    );
    const refreshToken = createJSONToken(
        { userId: user._id.toString() },
        process.env.JWT_REFRESH_KEY,
        '24h'
    );

    res.cookie('jwt_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
    });

    const defaultAddress = user.addresses.find((el) => el.default);

    res.status(200).json({
        message: 'Successfully logged in!',
        accessToken,
        address: defaultAddress,
        cart: user.cart.items.length,
    });
};

exports.logout = (req, res) => {
    res.clearCookie('jwt_token', { path: '/', sameSite: 'none', secure: true });
    res.status(200).json({ message: 'Successfully logged out!' });
};

exports.refresh = async (req, res) => {
    const refreshToken = req.cookies.jwt_token || null;

    if (!refreshToken) {
        throw new ExpressError('Not Authonticated', 401);
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
    } catch (e) {
        throw new ExpressError('Not Authonticated', 401);
    }

    const user = await User.findById(decoded.userId);

    const accessToken = createJSONToken(
        { username: user.username, userId: user._id.toString() },
        process.env.JWT_ACCESS_KEY,
        '30s'
    );

    // Update refresh token so the user is logged in as long as user is browsing.
    // const newRefreshToken = createJSONToken(
    //     { userId: user._id.toString() },
    //     process.env.JWT_REFRESH_KEY,
    //     '24h'
    // );

    // res.cookie('jwt_token', newRefreshToken, {
    //     httpOnly: true,
    //     secure: true,
    // sameSite: 'none',
    //     maxAge: 24 * 60 * 60 * 1000,
    // });

    res.status(200).json({ accessToken });
};

exports.postChangePassword = async (req, res) => {
    const { password } = req.body;

    const user = await User.findById(req.userId);
    if (!user) throw new ExpressError('User not found.', 404);
    if (!user.admin)
        throw new ExpressError('You are not an admin to change password.', 403);
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) throw new ExpressError('Password is incorrect', 422);
    const otpToken = createJSONToken(
        { userId: user._id },
        process.env.JWT_PASSWORD_RESET_TOKEN,
        '10m'
    );

    res.cookie('otp_token', otpToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 10 * 60 * 1000,
    });

    res.status(200).json({ message: 'Success' });
};

exports.patchChangePassword = async (req, res) => {
    const token = req.cookies.otp_token;

    if (!token) throw new ExpressError('Access Denied', 403);

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_PASSWORD_RESET_TOKEN);
    } catch (e) {
        throw new ExpressError('Access Denied', 403);
    }

    const { password } = req.body;
    const hashedPw = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(decoded.userId, {
        password: hashedPw,
    });

    await user.save();

    res.status(200).json({ message: 'Successfully updated password!' });
};

exports.getPersonalInfo = async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new ExpressError('User Not Found!', 404);
    const filteredUser = {
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
    };
    res.status(200).json({ user: filteredUser });
};

exports.postPersonalInfo = async (req, res) => {
    const { email, username, phone } = req.body;

    const user = await User.findById(req.userId);

    if (req.file) {
        // delete the previous image if it is not the default image
        if (user.avatar.filename !== DEFAULT_PROFILE_FILENAME) {
            await cloudinary.uploader.destroy(user.avatar.filename);
        }

        user.avatar.filename = req.file.filename;
        user.avatar.url = req.file.path;
    }

    user.email = email;
    user.username = username;
    user.phone = phone;

    await user.save();

    res.status(200).json({ message: 'Successfully updated personal info.' });
};

exports.getAddress = async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new ExpressError('User Not Found!', 404);

    const address = user.addresses;

    res.status(200).json({ address });
};

exports.postAddress = async (req, res) => {
    const {
        country,
        fullName,
        phone,
        pincode,
        addressline,
        state,
        city,
        defaultAddress,
    } = req.body;
    const user = await User.findById(req.userId);
    if (!user) throw new ExpressError('Use Not Found.', 404);

    const address = {
        country,
        fullName,
        phone,
        pincode,
        addressline,
        city,
        state,
        default: defaultAddress === 'on',
    };

    const updatedAddress = await user.addAddress(address);

    const curAddress = updatedAddress.addresses.find((addr) => addr.default);
    res.status(200).json({
        message: 'Successfully added address.',
        address: curAddress,
    });
};

exports.putAddress = async (req, res) => {
    const { country, fullName, phone, pincode, addressline, state, city, id } =
        req.body;
    const user = await User.findById(req.userId);
    if (!user) throw new ExpressError('User Not Found.', 404);

    const address = {
        country,
        fullName,
        phone,
        pincode,
        addressline,
        city,
        state,
    };
    await user.updateAddress(address, id);

    res.status(200).json({ message: 'Successfully updated address.' });
};

exports.patchAddress = async (req, res) => {
    const { id } = req.body;
    const user = await User.findById(req.userId);

    if (!user) throw new ExpressError('User not found!', 404);

    user.addresses = user.addresses.slice().map((addr) => {
        return {
            ...addr,
            default: addr._id.toString() === id,
        };
    });
    await user.save();

    const address = user.addresses.find((addr) => addr.default);
    res.status(200).json({ address });
};

exports.deleteAddress = async (req, res) => {
    const { id } = req.body;

    const user = await User.findById(req.userId);
    if (!user) throw new ExpressError('Use Not Found.', 404);

    await user.removeAddress(id);

    res.status(200).json({ message: 'Successfully removed address' });
};

exports.getCompany = async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new ExpressError('Use Not Found.', 404);
    if (!user.company) return res.status(200).json({ seller: false });
    const products = await Product.find({ seller: req.userId });

    res.status(200).json({ seller: true, company: user.company, products });
};

exports.postCompany = async (req, res) => {
    const { company } = req.body;
    await User.findByIdAndUpdate(req.userId, { company });

    res.status(200).json({ message: 'Successfully added company name' });
};
