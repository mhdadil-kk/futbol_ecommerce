const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Product = require('../models/product');
const { validationResult } = require('express-validator');
const Address = require('../models/address');

require('dotenv').config(); // Load environment variables

// Configure nodemailer using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
}

const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It expires in 5 minutes.`
    };
    
    await transporter.sendMail(mailOptions);
}

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.render('user/verifyOTP', { email, error: 'Email is required to resend OTP', success: null });
        }

        const sessionUserData = req.session.userData;

        if (!sessionUserData || sessionUserData.email !== email) {
            return res.render('user/verifyOTP', { email, error: 'Invalid session or email mismatch', success: null });
        }

        const otp = generateOTP();
        console.log(otp)
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        req.session.userData.otp = otp;
        req.session.userData.otpExpiry = otpExpiry;

        await sendOTPEmail(email, otp);

        res.render('user/verifyOTP', { email, error: null, success: 'OTP has been resent successfully' });
    } catch (error) {
        console.log("Error during OTP resend:", error);
        res.status(500).send('Server Error');
    }
}




const loadRegister = async (req, res) => {
    try {
        res.render('user/register',{errors: [] ,error:''});
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
}

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
        throw new Error('Error hashing password');
    }
}

const registerUser = async (req, res) => {
    try {

        const errors = validationResult(req);
   
   
      if (!errors.isEmpty()) {
        return res.render('user/register', {
          errors:  errors.errors,
          error :''
        });
      }

        const { name, email, mobile, password, Confirmpassword } = req.body;

        if (!name || !email || !mobile || !password ,!Confirmpassword) {
            return res.status(400).render('user/register', { errors: [] ,error: 'All fields are required' });
        }

        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('user/register', { errors: [],error: 'Email already registered.' });
        }

        const sPassword = await securePassword(password);
        const otp = generateOTP();
        console.log(otp)
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        req.session.userData = { name, email, mobile, password: sPassword, otp, otpExpiry };

        
        await sendOTPEmail(email, otp);

       
        res.render('user/verifyOTP', { email, error: null ,success :null ,errors: [] });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}

const verifyOTP = async (req, res) => {
    try {
       
        const { email, otp } = req.body;
       console.log(email , otp)       
 

        if (!email || !otp) {
            return res.json({ error: 'Email and OTP are required' });
        }

        const sessionUserData = req.session.userData;

        if (!sessionUserData) {
            return res.json({ error: 'Session expired or invalid session.' });
        }

        const otpExpiry = new Date(sessionUserData.otpExpiry).getTime();
        if (sessionUserData.email === email && sessionUserData.otp === otp && otpExpiry > Date.now()) {
            const user = new User({
                name: sessionUserData.name,
                email: sessionUserData.email,
                mobile: sessionUserData.mobile,
                password: sessionUserData.password,
                isVerified: true
            });

            await user.save();
            req.session.userData = null;

            // Successful OTP verification
            res.json({ success: 'OTP verified successfully!' });
        } else {
            // Invalid or expired OTP
            res.json({ error: 'Invalid or expired OTP' });
        }
    } catch (error) {
        console.log("Error during OTP verification:", error);
        res.status(500).json({ error: 'Server Error' });
    }
};



const loadLogin = async (req, res) => {
    try {
        res.render('user/login', {errors : [] , error:""});
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
}

const verifyLogin = async (req, res) => {
    try {
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('user/login', { 
                errors:  errors.errors,
                error: ''
            });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.render('user/login', { errors : [],error: 'Email and password are required' });
        }

        const userData = await User.findOne({ email  });

        if (userData) {
            if (!userData.isVerified) {
                return res.render('user/login', {errors : [], error: 'Please verify your email before logging in' });
            }

            if(userData.is_blocked){
                return res.render('user/login',{errors : [], error: 'your not allowed' })
            }

            const checkPassword = await bcrypt.compare(password, userData.password);
            if (checkPassword) {
                req.session.user_id = userData._id;
                req.session.user = {  
                    name: userData.name,
                    email: userData.email,
                    mobile: userData.mobile,
                };
                res.redirect('/'); 
            } else {
                res.render('user/login', { errors:[], error: 'Invalid email or password' });
            }
        } else {
            res.render('user/login', {  errors:[], error: 'Invalid email or password' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
}

const loadHome = async (req, res) => {
    try {

        const products = await Product.find({ status: false }).sort({ createdAt: -1 });
        res.render('user/index' ,{products});
       
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
}




const loadProfile = async (req, res) => {
    try {
        // if (!req.session.user_id) {
        //     return res.redirect('/login'); 
        // }

        const user = await User.findById(req.session.user_id); 
        const addresses = await Address.find({ user: user._id });
        if (!user) {
            return res.redirect('/login'); 
        }

        res.render('user/profile', { user  ,addresses }); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const updateProfile = async (req, res) => {
    try {
        console.log("here")
        if (!req.session.user_id) {
            return res.redirect('/login'); 
        }

        const { name, mobile } = req.body;
        console.log(mobile)

        
        if (!name || !mobile) {
            return res.redirect('/profile');
        }

       
        await User.findByIdAndUpdate(req.session.user_id, { name, mobile });

        res.redirect('/profile'); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const loadShop = async(req,res) =>{
    try{
        const products = await Product.find({status:false})
     res.render('user/shop',{products  })
        
    }catch(error){
        console.log(error)
    }
}

const loadProductDetails = async(req, res) => {
    const productId =   req.params.id
    try{
     console.log(productId)
     const Products = await Product.find({status:false})
     const product =  await Product.findById({_id:productId })
   
     if(!product.status){
        res.render('user/shop-details',{product  , Products });

     }else{
        res.render('admin/404')
     }

    }catch(error){
        console.log(error)
    }
   
}

const addAddress = async(req,res)=>{
    const { userId, name, streetAddress, state, district, pinCode, mobile, country } = req.body;

    if (!userId || !name || !streetAddress || !state || !district || !pinCode || !mobile || !country) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try{

        const newAddress = new Address({
            user: userId, // Associate address with the user ID from the request
            name,
            streetAddress,
            state,
            district,
            pinCode,
            mobile,
            country
        });

        await newAddress.save();
        res.status(200).json({ message: 'Address saved successfully' });


    }catch(error){
        console.error('Error saving address:', error);
        res.status(500).json({ message: 'An error occurred while saving the address' });
    }

}

const updateAddress = async (req, res) => {
    try {
        const addressId = req.params.id

        const {   name, streetAddress, state, district, pinCode, mobile, country } = req.body;

        // Check if all fields are provided
        if ( !addressId || !name || !streetAddress || !state || !district || !pinCode || !mobile || !country) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const address = await Address.findById(addressId)

       

        // Update the address details
        address.name = name;
        address.streetAddress = streetAddress;
        address.state = state;
        address.district = district;
        address.pinCode = pinCode;
        address.mobile = mobile;
        address.country = country;

        await address.save();
        res.status(200).json({ message: 'Address updated successfully', address });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const  id  = req.query.id;

        await Address.deleteOne({_id:id});

       
    }catch(error){
     
        console.log(error.message)

    }
}




const logout = async (req, res) => {
    try {
        
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
                res.send("Error");
            } else {
             res.redirect('/')
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}




module.exports = {
    loadRegister,
    registerUser,
    resendOTP,
    verifyOTP,
    loadLogin,
    verifyLogin,
    loadHome,
    loadProfile,
    updateProfile,
    loadShop,
    loadProductDetails,
    addAddress,
    updateAddress,
    deleteAddress,
    logout
}
