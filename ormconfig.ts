module.exports = {
  name: "default",
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  logging: process.env.DB_LOGGING ? JSON.parse(process.env.DB_LOGGING) : false,
  migrationsRun: true,
  migrations: [process.env.DB_MIGRATIONS],
  entities: [process.env.DB_ENTITIES],
  extra: {
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10
  }
};