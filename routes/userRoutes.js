const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const passportController = require('../controllers/passportController');
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')

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
router.post('/add_address' ,userController.addAddress)
router.post('/updateAddress/:id',userController.updateAddress)
router.get('/delete_address/:id',userController.deleteAddress)
router.get('/cart',cartController.loadCart)
router.post('/add-to-cart',cartController.addToCart)
router.post('/remove/:productId',cartController.removeProduct)
router.post('/update-quantity/:productId',cartController.updateCart)

router.get('/checkout',cartController.loadcheckout)
router.post('/place-order',orderController.placeOrder)
router.get('/orders',orderController.loadOrderList)
router.get('/order-details/:orderId',orderController.loadOrderDetails)
router.post('/order/cancel/:orderId',orderController.cancelOrder)
router.get('/logout',userController.logout);


module.exports = router;
