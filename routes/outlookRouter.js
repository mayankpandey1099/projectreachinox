const express = require("express");
//const passport = require("passport");
const {signin, outlookCallback, getMails, sendAutoMail} = require("../controller/outlookController");
const outlookRouter = express.Router();

outlookRouter.get("/signin", signin);
outlookRouter.get("/", outlookCallback);
outlookRouter.get("/get-mails", getMails);

module.exports = { outlookRouter };
