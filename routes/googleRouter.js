

const passport = require("../middleware/passport");
const {gmailHandler} = require("../controller/gmailController");
const express = require("express");
const googlerouter = express.Router();

googlerouter.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

googlerouter.get(
  "/google/callback",
  passport.authenticate("google"),
  (req, res) => {
    try {
      res.redirect("/auth/gmail");
    } catch (error) {
      console.error("Error in googleCallback:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

googlerouter.get("/gmail", gmailHandler);

module.exports = { googlerouter };
