import cron from "node-cron";
import { Request, Response } from "express";
import {Record} from "../entities/Record"
import {AppDataSource} from "../database/ds2"
// cron.schedule('*/5 * * * * *', () => {
//     console.log('running a task every minute');
//   });

class EmailController{
    async DiasAntes15(req: Request, res : Response){
        const resultados = AppDataSource.getRepository(Record);
        const clientes = resultados.find();
        console.log(clientes);
        res.sendStatus(200);
    }
    
}

export default new EmailController();