"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSourcePix = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Pix_1 = require("../entities/Pix");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSourcePix = new typeorm_1.DataSource({
    type: "mariadb",
    host: process.env.DATABASE_HOST_API,
    port: 3306,
    username: process.env.DATABASE_USERNAME_API,
    password: process.env.DATABASE_PASSWORD_API,
    database: process.env.DATABASE_API,
    entities: [Pix_1.Pix],
    synchronize: false,
});
exports.AppDataSourcePix.initialize()
    .then(() => {
    console.log("Data Source has been initialized!");
    console.log(process.env.DATABASE_HOST_API);
})
    .catch((err) => {
    console.error("Error during Data Source initialization:", err);
});
