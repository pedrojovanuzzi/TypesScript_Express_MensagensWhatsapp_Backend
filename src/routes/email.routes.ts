import { Router } from "express";
import { Request, Response, NextFunction } from 'express';
import path from "path";
import EmailController from "../controllers/EmailController";

const router = Router();

router.post("/15DiasAntes", EmailController.DiasAntes15);


export default router;