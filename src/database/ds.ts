import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Record } from "../entities/Record";
import { Pix } from "../entities/Pix";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mariadb",
  host: process.env.DATABASE_HOST_API,
  port: 3306,
  username: process.env.DATABASE_USERNAME_API,
  password: process.env.DATABASE_PASSWORD_API,
  database: process.env.DATABASE_API,
  entities: {User, Record, Pix},
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
