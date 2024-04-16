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
        console.log(user);
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
      console.log("Outlook Profile:", profile);
      // Create or update user in your database
      const user = {
        outlookId: profile.id,
        name: profile.DisplayName,
        email: profile.EmailAddress,
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
      console.log(user);
      if (refreshToken) user.refreshToken = refreshToken;
      if (profile.MailboxGuid) user.mailboxGuid = profile.MailboxGuid;
      if (profile.Alias) user.alias = profile.Alias;

      outlookUser.create(user, (err, user) => {
        if (err) return done(err);
        return done(null, user);
      });
    }
  )
);




module.exports = passport;
