const { DataSource } = require("typeorm");
require('dotenv').config();

const connectionSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrationsTableName: 'migrations_history',
  migrations: [
    'dist/@configs/database/migrations/*.js',
    'dist/@configs/database/seeding/*.js'
  ],
  synchronize: false,
});

module.exports = connectionSource;
