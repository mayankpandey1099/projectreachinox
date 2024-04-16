const { sequelize } = require("../utils/db");
const { DataTypes } = require("sequelize");

const outlookUser = sequelize.define("OutlookUser", {
  OutlookId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = { outlookUser };
