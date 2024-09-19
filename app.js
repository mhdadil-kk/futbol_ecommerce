// app.js

const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { v4: uuidv4 } = require('uuid');
const { ensureAuthenticated, isAuthenticated } = require('./middlewares/auth');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

app.use(passport.initialize()); // Initialize passport
app.use(passport.session()); // Use passport session

app.use((req, res, next) => {
    
    if (req.session.user) {
        res.locals.username = req.session.user.name; 
    } else if (req.user) {
        
        res.locals.username = req.user.displayName || req.user.name || req.user.username; // For Google login
    } else {
        res.locals.username = null; 
    }

    console.log('Username:', res.locals.username); // Debugging output to verify the username
    next();
});


// Apply isAuthenticated middleware globally for setting local variables
app.use(isAuthenticated);

// Routes
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

// Use Routes
app.use('/admin', adminRoutes);
app.use('/', userRoutes);
// Middleware to add the username to res.locals for all views



// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Route Protection Example
app.get('/protected-route', ensureAuthenticated, (req, res) => {
    res.send('This is a protected route');
});

// API route for checking authentication
app.get('/api/check-auth', (req, res) => {
    const isLoggedIn = req.session.user ? true : false; 
    res.json({ isLoggedIn });
});

// Handle 404
app.use((req, res, next) => {
    res.status(404).render('admin/404', { pageTitle: 'Page Not Found' });
});

// Handle other errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Server
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    console.log('Connected to DB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
