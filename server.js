const express = require("express");
require("dotenv").config();
const session = require("express-session");
const cors = require("cors");
const { sequelize } = require("./utils/db");
const { googleRouter } = require("./routes/googleRouter");
const { outlookRouter } = require("./routes/outlookRouter");
const passport = require("./middleware/passport");

const app = express();
app.use(cors());

app.use(
  session({
    secret: "session",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send(
    '<a href="/auth/google">Sign in with Google</a>'
  );
});
 

app.use("/auth", googleRouter);
app.use("/auth", outlookRouter)

const port = 3000;

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log("Server is runnig ...");
  });
});
