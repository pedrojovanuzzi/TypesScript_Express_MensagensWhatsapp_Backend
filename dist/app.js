"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes/routes"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const email_routes_1 = __importDefault(require("./routes/email.routes"));
const canais_routes_1 = __importDefault(require("./routes/canais.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, '../frontend/build')));
app.use(express_1.default.json());
app.use('/canais', canais_routes_1.default);
app.use('/', routes_1.default);
app.use('/email', email_routes_1.default);
exports.default = app;
