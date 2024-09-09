import { AppDataSource } from "../database/ds_canais";
import { Canais } from "../entities/Canais";
import { Request, Response } from "express";

class CanaisController{
    async getCanais(req : Request, res : Response){
        const RepositoryCanais = AppDataSource.getRepository(Canais);
        const canais = RepositoryCanais.find();
        return res.json(canais);
    }
}

export default new CanaisController();