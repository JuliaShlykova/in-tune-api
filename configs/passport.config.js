const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('../models/User');

const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

const googleOpts = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/auth/google/callback",
  passReqToCallback: true,
  proxy: true
}

module.exports = passport => {
  passport.use(
    new JwtStrategy(jwtOpts, async (jwt_payload, done) => {
      try {
        return done(null, {_id: jwt_payload.userId});
      } catch(err){
        console.log(err);
        return done(err, false);
      }
    })
  );

  passport.use(new GoogleStrategy(googleOpts, async(request, accessToken, refreshToken, profile, done) => {
    try {
      const user = await User.findOne({googleId: profile.id});
      if (user) {
        return done(null, {_id: user._id});
      }
      const newUser = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        profileImgUrl: profile.photos[0].value,
      })
      await newUser.save();
      return done(null, {_id: newUser._id});
    } catch(err) {
      console.log('err: ', err);
      return done(err, false);
    }
  }))
}