

// middleware/auth.js

const isAuthenticated = (req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated(); // Use Passport's method to check authentication
    next();
};

// middleware/auth.js

const ensureAuthenticated = (req, res, next) => {
    if (req.session.user_id) { // Use Passport's method to check authentication
        return next();
    } else {
        res.redirect('/login');
    }
};
const ensureAdmin = (req, res, next) => {
    if (req.session.admin_id) { 
        // Use Passport's method to check authentication
        return next();
    } else {
        res.redirect('/admin');
    }
};

const  islogin = (req,res,next) =>{
    if(req.session.admin_id){
        res.redirect('/admin/dashboard')
    }else{
       return next()
    }
}

module.exports = {
    ensureAuthenticated,
    ensureAdmin,
    isAuthenticated,
    islogin
};
