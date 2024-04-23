require("dotenv").config();
const passport = require("passport");
const { User} = require("../models/userModel");
const { outlookUser } = require("../models/outlookModel");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const OutlookStrategy = require("passport-outlook").Strategy;



passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("Google Profile:", profile);
      profile.tokens = { accessToken, refreshToken };
      try {
        const user = User.create({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails.value,
          refreshToken: refreshToken,
          accessToken: accessToken,
        });
      } catch (err) {
        throw err;
      }
      return done(null, profile);
    }
  )
);
passport.use(
  new OutlookStrategy(
    {
      clientID: process.env.OUTLOOK_CLIENT_ID,
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/outlook/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      profile.tokens = { accessToken, refreshToken };
      //console.log("Outlook Profile in passport.js:", profile);
      //console.log("this is done in passport.js", done);
      // Create or update user in your database
      try {
        const user = outlookUser.create({
          OutlookId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          accessToken: accessToken,
          refreshToken: refreshToken,
        });
      } catch (err) {
        throw err;
      }
      return done(null, profile);
    }
  )
);
    

      // if (refreshToken) user.refreshToken = refreshToken;
      // if (profile.MailboxGuid) user.mailboxGuid = profile.MailboxGuid;
      // if (profile.Alias) user.alias = profile.Alias;






module.exports = passport;
