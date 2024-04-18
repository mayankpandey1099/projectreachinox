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
      "https://outlook.office.com/Mail.Send",
    ],
  })
);

outlookRouter.get(
  "/outlook/callback",
  passport.authenticate("windowslive"),
  (req, res)=>{
   try {
     res.redirect("/auth/outlookmail");
    } catch (error) {
      console.error("Error in callback:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

outlookRouter.get("/outlookmail", outlookHandler);

module.exports = { outlookRouter };
