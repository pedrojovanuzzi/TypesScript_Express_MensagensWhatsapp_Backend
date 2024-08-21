import { Router } from "express";
import { Request, Response, NextFunction } from 'express';
import path from "path";
import EmailController from "../controllers/EmailController";

const router = Router();

router.post("/5DiasAntes", EmailController.DiasAntes5);
router.post("/DiasDoVencimento", EmailController.DiasDoVencimento);


export default router;