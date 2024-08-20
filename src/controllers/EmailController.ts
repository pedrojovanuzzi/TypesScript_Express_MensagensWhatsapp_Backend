import cron from "node-cron";
import { Request, Response } from "express";

// cron.schedule('*/5 * * * * *', () => {
//     console.log('running a task every minute');
//   });

class EmailController{
    async DiasAntes15(req: Request, res : Response){
        res.sendStatus(200);
    }
    
}

export default new EmailController();