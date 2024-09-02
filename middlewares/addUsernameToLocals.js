// Middleware to add the username to res.locals for all views
const addUsernameToLocals = (req, res, next) => {
    if (req.session.user) {
        res.locals.username = req.session.user.name;
    } else {
        res.locals.username = null; // No user is logged in
    }
    next();
};

module.exports = addUsernameToLocals;
