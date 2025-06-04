const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definición del modelo User
const User = sequelize.define('User', {
    // ...campos existentes...
    resetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

// ...código existente...

module.exports = User;