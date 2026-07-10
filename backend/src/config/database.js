require('dotenv').config();
const { Sequelize } = require('sequelize');

let sequelize;
const useMySQL = Boolean(
  process.env.DB_HOST &&
  process.env.DB_NAME &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD
);

if (useMySQL) {
  console.log('📡 Connecting to MySQL database...');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      timezone: '+05:30',
    }
  );
} else {
  console.log('📂 Local development: Using SQLite database...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './chatapp.sqlite',
    logging: false,
  });
}

module.exports = sequelize;

