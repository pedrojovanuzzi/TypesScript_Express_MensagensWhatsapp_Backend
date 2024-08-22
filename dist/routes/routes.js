"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MensagensController_1 = __importDefault(require("../controllers/MensagensController"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
router.post('/EnviaMensagem', MensagensController_1.default.MensagensBairro);
router.post('/EnviaMensagemConhecerBot', MensagensController_1.default.MensagemConhecerBot);
router.post('/EnviaMensagemPON', MensagensController_1.default.MensagensPON);
router.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../frontend/build', 'index.html'));
});
exports.default = router;
