module.exports = class Models {
  static UserModel(Sequelize, sequelize) {
    return sequelize.define("user", {
      chat_id: {
        type: Sequelize.DataTypes.BIGINT,
        primaryKey: true,
      },
      username: {
        type: Sequelize.DataTypes.STRING,
      },
      referred_by: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
      },
      referral_count: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_channel_sent: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      }
    });
  }

  static SettingModel(Sequelize, sequelize) {
    return sequelize.define("setting", {
      key: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true,
      },
      value: {
        type: Sequelize.DataTypes.STRING,
      },
    });
  }
};
