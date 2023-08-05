const { body } = require('express-validator');
const User = require('../model/users');

const productValidators = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Enter a valid title.')
        .escape(),
    body('price')
        .isInt({ min: 0, allow_leading_zeroes: false })
        .withMessage('Enter a valid price.')
        .escape(),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Enter a valid description.')
        .escape(),
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Enter a valid category.')
        .escape(),
    body('discount')
        .isInt({ min: 0, max: 100 })
        .withMessage('Enter a valid discount.')
        .escape(),
];

const reviewValidators = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Enter a valid rating.')
        .escape(),
    body('body').trim().notEmpty().withMessage('Enter a valid body.').escape(),
];

const passwordValidator = body('password')
    .trim()
    .isStrongPassword({ minLowercase: 0, minUppercase: 0 })
    .withMessage('Enter a valid password.')
    .escape();

const userSignupValidators = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Enter a valid email.')
        .escape()
        .normalizeEmail()
        .custom(async (value) => {
            const user = await User.findOne({ email: value });
            if (user) throw new Error('User already exist.');
        }),
    passwordValidator,
    body('phone')
        .trim()
        .isMobilePhone(['en-IN'])
        .withMessage('Enter a valid phone number.')
        .escape(),
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Enter a valid username.')
        .escape(),
];

const userLoginValidators = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Enter a valid email.')
        .escape()
        .normalizeEmail(),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Enter a valid password.')
        .escape(),
];

const updatePersonalInfoValidator = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Enter a valid email.')
        .escape()
        .normalizeEmail()
        .custom(async (value, { req }) => {
            const user = await User.findOne({
                email: value,
                _id: { $ne: req.userId },
            });
            if (user) throw new Error('User already exist.');
        }),
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Enter a valid username.')
        .escape(),
    body('phone')
        .trim()
        .isMobilePhone(['en-IN'])
        .withMessage('Enter a valid phone.')
        .escape(),
];

const addressValidator = [
    body('country')
        .trim()
        .isLength({ min: 1, max: 30 })
        .withMessage('Enter a valid country.')
        .escape(),
    body('fullName')
        .trim()
        .isLength({ min: 1, max: 30 })
        .withMessage('Enter a valid fullName.')
        .escape(),
    body('phone')
        .trim()
        .isMobilePhone(['en-IN'])
        .withMessage('Enter a valid phone.')
        .escape(),
    body('pincode')
        .trim()
        .isPostalCode('IN')
        .withMessage('Enter a valid pincode.')
        .escape(),
    body('addressline')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Enter a valid address line.')
        .escape(),
    body('state')
        .trim()
        .isLength({ min: 1, max: 30 })
        .withMessage('Enter a valid state.')
        .escape(),
    body('city')
        .trim()
        .isLength({ min: 1, max: 30 })
        .withMessage('Enter a valid city.')
        .escape(),
];

const companyValidator = body('company')
    .trim()
    .notEmpty()
    .withMessage('Enter a valid company.')
    .escape();

module.exports = {
    productValidators,
    companyValidator,
    addressValidator,
    updatePersonalInfoValidator,
    userLoginValidators,
    userSignupValidators,
    reviewValidators,
    passwordValidator,
};
