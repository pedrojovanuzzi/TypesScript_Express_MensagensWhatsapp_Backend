import WhatsApp from 'whatsapp';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import {User} from "../entities/User"
import {AppDataSource} from "../database/ds"

dotenv.config();

const waPhonerNumberId = Number(process.env.WA_PHONE_NUMBER_ID);
const wa = new WhatsApp(waPhonerNumberId);
const Token = String(process.env.CLOUD_API_ACCESS_TOKEN);
const was_token_changed = wa.updateAccessToken(Token);

class MensagensController{

    async MensagensComuns(req : Request, res : Response){
        const {msg, bairro} = req.query;

        console.log(req.query);
        

        const resultados = AppDataSource.getRepository(User);

        let UppercaseBairro! : string;

        if (typeof bairro === 'string'){
            UppercaseBairro = bairro.toUpperCase();
        }
        else{
            console.log("Error Bairro not String");
            res.send("Error Bairro not String");
        }
        
        console.log(UppercaseBairro);
        

        const clientes = await resultados.find({take: 250, where: {bairro: UppercaseBairro}});

        // console.log(clientes);
        

        if(!clientes){
            console.log("Sem Clientes");
            res.send("Sem Clientes")
        }

        clientes.map(async (client) => {
            try{

                const number = Number("55" + client.celular.replace(/[^\d]/g, ''));

                console.log(number);
                

                const sent_text_message = wa.messages.text( { "body" : String(msg) }, number);
        
                await sent_text_message.then( ( res ) =>
                {
                    // console.log( res.rawResponse() );                  
                } );
                res.sendStatus(200);
            }
            catch( e )
            {
                console.log( JSON.stringify( e ) );
            }
        }) 
    }
}

export default new MensagensController();