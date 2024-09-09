"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Canais_1 = require("../entities/Canais");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: process.env.DATABASE_HOST_API_CANAIS,
    port: 3306,
    username: process.env.DATABASE_USERNAME_API_CANAIS,
    password: process.env.DATABASE_PASSWORD_API_CANAIS,
    database: process.env.DATABASE_API_CANAIS,
    entities: { Canais: Canais_1.Canais },
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
