const { Redis } = require("ioredis");

const connection = new Redis({
  port: process.env.PORT_R,
  host: process.env.HOST_R,
  username: "default",
  password: process.env.PASS_R,
  maxRetriesPerRequest: null,
});


module.exports = connection;