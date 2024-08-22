"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmailController_1 = __importDefault(require("../controllers/EmailController"));
const router = (0, express_1.Router)();
router.post("/5DiasAntes", EmailController_1.default.DiasAntes5);
router.post("/DiasDoVencimento", EmailController_1.default.DiasDoVencimento);
exports.default = router;
