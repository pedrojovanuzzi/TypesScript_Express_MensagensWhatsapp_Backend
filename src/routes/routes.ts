import { Router } from "express";
import { Request, Response, NextFunction } from 'express';
import MensagensController from "../controllers/MensagensController";
import LoginController from "../controllers/LoginController";
import path from "path";

const router = Router();

router.post('/login', LoginController.login);
router.post('/EnviaMensagem', MensagensController.MensagensBairro);
router.post('/EnviaMensagemPON', MensagensController.MensagensPON);
router.post('/EnviaMensagemGrupo', MensagensController.MensagensGrupo);
router.get('*', (req : Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});


export default router;