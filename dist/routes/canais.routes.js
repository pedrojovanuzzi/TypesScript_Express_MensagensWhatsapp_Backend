"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Rota que vai retornar um JSON de canais de outro App Web que está sendo utilizado pela empresa
const express_1 = require("express");
const CanaisController_1 = __importDefault(require("../controllers/CanaisController"));
const router = (0, express_1.Router)();
router.get("/get_canais", CanaisController_1.default.getCanais);
exports.default = router;
