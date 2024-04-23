const express = require("express");
//const passport = require("passport");
const {authenticate, outlookCallback, getUserEmails} = require("../controller/outlookController");
const outlookRouter = express.Router();

outlookRouter.get(
  "/outlook", authenticate
  // passport.authenticate("windowslive", {
  // })
);

outlookRouter.get(
  "/outlook/callback", outlookCallback
  // passport.authenticate("windowslive"),
  // (req, res)=>{
  //  try {
  //    res.redirect("/auth/outlookmail");
  //   } catch (error) {
  //     console.error("Error in callback:", error);
  //     res.status(500).send("Internal Server Error");
  //   }
  // }
);

outlookRouter.get("/get-user-profile", getUserEmails);

module.exports = { outlookRouter };
