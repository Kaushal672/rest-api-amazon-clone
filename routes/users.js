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

router.get('/logout', userController.logout);

router.post(
    '/signup',
    upload.single('avatar'),
    userSignupValidators,
    catchAsync(userController.signup)
);

router.post('/login', userLoginValidators, catchAsync(userController.login));

router.post('/refresh', catchAsync(userController.refresh));

router
    .route('/company')
    .get(isAuth, catchAsync(userController.getCompany))
    .post(isAuth, companyValidator, catchAsync(userController.postCompany));

router
    .route('/change-password')
    .post(
        isAuth,
        passwordValidator,
        catchAsync(userController.postChangePassword)
    )
    .patch(
        isAuth,
        passwordValidator,
        catchAsync(userController.patchChangePassword)
    );

router
    .route('/personal-info')
    .get(isAuth, catchAsync(userController.getPersonalInfo))
    .post(
        isAuth,
        updatePersonalInfoValidator,
        upload.single('avatar'),
        catchAsync(userController.postPersonalInfo)
    );

router
    .route('/address')
    .get(isAuth, catchAsync(userController.getAddress))
    .post(isAuth, addressValidator, catchAsync(userController.postAddress))
    .put(isAuth, addressValidator, catchAsync(userController.putAddress))
    .patch(isAuth, catchAsync(userController.patchAddress))
    .delete(isAuth, catchAsync(userController.deleteAddress));

module.exports = router;
