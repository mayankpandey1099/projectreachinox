const express = require("express");
const passport = require("passport");
const {outlookHandler} = require("../controller/outlookController");

const outlookRouter = express.Router();

outlookRouter.get(
  "/outlook",
  passport.authenticate("windowslive", {
    scope: [
      "openid",
      "profile",
      "offline_access",
      "https://outlook.office.com/Mail.Read",
    ],
  })
);

outlookRouter.get(
  "/outlook/callback",
  passport.authenticate("windowslive", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/outlook");
  }
);

outlookRouter.get("/outlook", outlookHandler);

module.exports = { outlookRouter };
