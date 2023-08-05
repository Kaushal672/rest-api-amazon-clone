const express = require('express');
const multer = require('multer');
const { storage } = require('../cloudinary/index');
const {
    userSignupValidators,
    userLoginValidators,
    companyValidator,
    passwordValidator,
    updatePersonalInfoValidator,
    addressValidator,
} = require('../utils/validators');

const upload = multer({ storage });

const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const isAuth = require('../middleware/isAuth');
const userController = require('../controllers/users');
const checkValidationErrors = require('../middleware/checkValidationErrors');

router.get('/logout', userController.logout);

router.post(
    '/signup',
    upload.single('avatar'),
    userSignupValidators,
    checkValidationErrors,
    catchAsync(userController.signup)
);

router.post(
    '/login',
    userLoginValidators,
    checkValidationErrors,
    catchAsync(userController.login)
);

router.post('/refresh', catchAsync(userController.refresh));

router
    .route('/company')
    .get(isAuth, catchAsync(userController.getCompany))
    .post(
        isAuth,
        companyValidator,
        checkValidationErrors,
        catchAsync(userController.postCompany)
    );

router
    .route('/change-password')
    .post(
        isAuth,
        passwordValidator,
        checkValidationErrors,
        catchAsync(userController.postChangePassword)
    )
    .patch(
        isAuth,
        passwordValidator,
        checkValidationErrors,
        catchAsync(userController.patchChangePassword)
    );

router
    .route('/personal-info')
    .get(isAuth, catchAsync(userController.getPersonalInfo))
    .post(
        isAuth,
        upload.single('avatar'),
        updatePersonalInfoValidator,
        checkValidationErrors,
        catchAsync(userController.postPersonalInfo)
    );

router
    .route('/address')
    .get(isAuth, catchAsync(userController.getAddress))
    .post(
        isAuth,
        addressValidator,
        checkValidationErrors,
        catchAsync(userController.postAddress)
    )
    .put(
        isAuth,
        addressValidator,
        checkValidationErrors,
        catchAsync(userController.putAddress)
    )
    .patch(isAuth, catchAsync(userController.patchAddress))
    .delete(isAuth, catchAsync(userController.deleteAddress));

module.exports = router;
