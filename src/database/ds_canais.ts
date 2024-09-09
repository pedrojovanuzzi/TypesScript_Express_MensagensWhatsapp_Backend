import "reflect-metadata";
import { DataSource } from "typeorm";
import { Canais } from "../entities/Canais";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DATABASE_HOST_API_CANAIS,
  port: 3306,
  username: process.env.DATABASE_USERNAME_API_CANAIS,
  password: process.env.DATABASE_PASSWORD_API_CANAIS,
  database: process.env.DATABASE_API_CANAIS,
  entities: {Canais},
  synchronize: false,
});

AppDataSource.initialize()
  .then(() => {
    // console.log("Data Source has been initialized!");
    // console.log(process.env.DATABASE_HOST_API);
    
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
