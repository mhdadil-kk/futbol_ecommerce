const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('./models/user'); // Assuming this is the correct path to your user model

passport.serializeUser((user, done) => {
    done(null, user.id); // Storing user ID in the session
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); // Retrieving full user details from the database
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
},
async (request, accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.email });

        if (!user) {
            user = new User({
                email: profile.email,
                name: profile.displayName,
                isVerified: true,
                isAdmin: false, // or any other default value for new users
            });
            await user.save();
        }

        return done(null, user); // Passing user object to `serializeUser`
    } catch (error) {
        return done(error, null);
    }
}));
