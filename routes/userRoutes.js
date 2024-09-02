const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const passportController = require('../controllers/passportController');

const passport = require('passport'); 
const { ensureAuthenticated } = require('../middlewares/auth');
const { validateRegister,validateLogin } = require('../middlewares/validation');
require('../passport');

// Define your user routes here
router.get('/register', userController.loadRegister);
router.post('/register',validateRegister, userController.registerUser);
router.post('/resend-otp', userController.resendOTP);
router.post('/verify-otp', userController.verifyOTP); 
router.get('/login', userController.loadLogin);
router.post('/login',validateLogin, userController.verifyLogin);
router.get('/', userController.loadHome);
router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/failure' }), 
    passportController.successGoogleLogin
);

router.get('/success', passportController.successGoogleLogin); 
router.get('/failure', passportController.failureGoogleLogin);
router.get('/profile', ensureAuthenticated,userController.loadProfile);
router.post('/update-profile', userController.updateProfile);
router.get('/shop',userController.loadShop)
router.get('/product/:id',userController.loadProductDetails);

router.get('/logout',userController.logout);


module.exports = router;
