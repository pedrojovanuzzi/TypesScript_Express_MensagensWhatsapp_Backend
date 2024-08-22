import { Router } from "express";
import { Request, Response, NextFunction } from 'express';
import MensagensController from "../controllers/MensagensController";
import path from "path";

const router = Router();

router.post('/EnviaMensagem', MensagensController.MensagensBairro);
router.post('/EnviaMensagemConhecerBot', MensagensController.MensagemConhecerBot);
router.post('/EnviaMensagemPON', MensagensController.MensagensPON);
router.get('*', (req : Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});


export default router;