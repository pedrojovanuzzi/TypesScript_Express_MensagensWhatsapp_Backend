// Rota que vai retornar um JSON de canais de outro App Web que está sendo utilizado pela empresa
import { Router } from "express";
import { Request, Response, NextFunction } from 'express';
import path from "path";
import CanaisController from "../controllers/CanaisController";

const router = Router();

router.get("/get_canais", CanaisController.getCanais);



export default router;