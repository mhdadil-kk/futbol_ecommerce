const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('name')
    .isLength({ min: 4}).withMessage('Name must be at least 4 characters long')
    .matches(/^(?!.*  )[a-zA-Z0-9_ ]+$/).withMessage('Name must contain only letters, numbers and underscores'),
    
  body('email')
    .isEmail().withMessage('Enter a valid email'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
.withMessage('Password must contain at least one letter, one number, and one special character'),
  
  body('mobile')
    .isMobilePhone().withMessage('Enter a valid mobile number')
    .isLength({ min: 10, max: 10 }).withMessage('Mobile number must contain 10 digits')
    .matches(/^[0-9]{10,15}$/).withMessage('Enter a valid mobile number'),

  (req, res, next) => {
    const errors = validationResult(req);
 
    if (!errors.isEmpty()) {
      req.errors = errors.array(); // Store errors in request object
      return next(); // Proceed to the controller to handle errors
    }
    next(); // No errors, proceed to the controller
  }
];

const validateLogin = [
  body('email')
    .isEmail().withMessage('Enter a valid email')
    .normalizeEmail(), // Optional: Sanitizes email input

  body('password')
  .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
.withMessage('Password must contain at least one letter, one number, and one special character')// Updated length
.trim(), // Optional: Trims whitespace from the password

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.errors = errors.array(); // Store errors in request object
      return next(); // Proceed to the controller to handle errors
    }
    next(); // No errors, proceed to the controller
  }
];

module.exports = {
  validateRegister,
  validateLogin
};
