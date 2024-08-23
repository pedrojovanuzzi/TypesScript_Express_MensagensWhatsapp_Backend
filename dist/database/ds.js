"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Record_1 = require("../entities/Record");
const Pix_1 = require("../entities/Pix");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mariadb",
    host: process.env.DATABASE_HOST_API,
    port: 3306,
    username: process.env.DATABASE_USERNAME_API,
    password: process.env.DATABASE_PASSWORD_API,
    database: process.env.DATABASE_API,
    entities: { User: User_1.User, Record: Record_1.Record, Pix: Pix_1.Pix },
    synchronize: false,
});
exports.AppDataSource.initialize()
    .then(() => {
    // console.log("Data Source has been initialized!");
    // console.log(process.env.DATABASE_HOST_API);
})
    .catch((err) => {
    console.error("Error during Data Source initialization:", err);
});
