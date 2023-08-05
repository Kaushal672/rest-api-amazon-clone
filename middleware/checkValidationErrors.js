const { validationResult } = require('express-validator');
const ExpressError = require('../utils/ExpressError');
const { cloudinary } = require('../cloudinary');

const checkValidationErrors = async (req, _res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // if there is file then  delete uploaded image
        if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename);
        }
        return next(
            new ExpressError('Validation Failed!', 422, errors.array())
        );
    }
    next();
};

module.exports = checkValidationErrors;
