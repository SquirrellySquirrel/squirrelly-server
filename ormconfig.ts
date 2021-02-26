module.exports = {
  name: "default",
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  logging: true,
  migrationsRun: true,
  migrations: ["dist/migration/*.js"],
  entities: ["dist/entity/*.js"]
};