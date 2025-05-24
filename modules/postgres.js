const { Sequelize } = require("sequelize");
const { POSTGRES } = require("../config");
const Models = require("./models");

const sequelize = new Sequelize(POSTGRES, {
  logging: false,
});

async function postgres() {
  try {
    const db = {};

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    db.users = Models.UserModel(Sequelize, sequelize);
    db.settings = Models.SettingModel(Sequelize, sequelize);

    await sequelize.sync({ force: false });

    return db;
  } catch (error) {
    console.error("Unable to connect to the database: ", error);
  }
}

module.exports = postgres;
