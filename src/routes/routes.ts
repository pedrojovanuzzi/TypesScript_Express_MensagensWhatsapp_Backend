import { Router } from "express";
import { Request, Response, NextFunction } from 'express';
import MensagensController from "../controllers/MensagensController";

const router = Router();

router.post('/EnviaMensagem', MensagensController.MensagensComuns);
router.get('/EnviaMensagem', (req : Request, res : Response) => {
    res.send("test");
});

export default router;