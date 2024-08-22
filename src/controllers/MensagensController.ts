import WhatsApp from 'whatsapp';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import {User} from "../entities/User"
import {AppDataSource} from "../database/ds"
import { ComponentTypesEnum } from 'whatsapp/build/types/enums';
import { MessageTemplateObject } from 'whatsapp/build/types/messages';
import { LanguagesEnum } from 'whatsapp/build/types/enums';
import { ParametersTypesEnum } from 'whatsapp/build/types/enums';

dotenv.config();

const waPhonerNumberId = Number(process.env.WA_PHONE_NUMBER_ID);
const wa = new WhatsApp(waPhonerNumberId);
const Token = String(process.env.CLOUD_API_ACCESS_TOKEN);
const was_token_changed = wa.updateAccessToken(Token);
const API_PASSWORD = process.env.API_PASSWORD;




class MensagensController{

    async MensagensBairro(req : Request, res : Response){
        const {msg, bairro} = req.query;
        const {password} = req.body;

        console.log(req.query);
        
        if(password != API_PASSWORD){
            console.log("Senha Incorreta");
            res.sendStatus(400);
            
        }
        else{
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
        

        const clientes = await resultados.find({where: {bairro: UppercaseBairro, cli_ativado: "s"}});

        // console.log(clientes);
        

        if(!clientes){
            console.log("Sem Clientes");
            res.send("Sem Clientes")
        }

        clientes.map(async (client : any) => {
            try{

                const test: MessageTemplateObject<ComponentTypesEnum> = {
                    name: "aviso_bairro",
                    language: {
                        code: LanguagesEnum.Portuguese_BR,
                        policy: 'deterministic'
                    },
                    components: [
                        {
                            type: ComponentTypesEnum.Header,
                            parameters: [
                                {
                                    type: ParametersTypesEnum.Text,
                                    text: UppercaseBairro
                                }
                            ]
                        },
                        {
                            type: ComponentTypesEnum.Body,
                            parameters: [
                                {
                                    type: ParametersTypesEnum.Text,
                                    text: String(msg),
                                },
                                {
                                    type: ParametersTypesEnum.Text,
                                    text: UppercaseBairro,
                                },
                            ],
                        }
                    ],
                };

                const number = Number("55" + client.celular.replace(/[^\d]/g, ''));

                console.log(number);
                
        
                await wa.messages.template( test, number ).then( ( res ) =>
                    {
                        console.log( res.rawResponse() );
                    } );
                
            }
            catch( e )
            {
                console.log( JSON.stringify( e ) );
            }
            res.sendStatus(200);
        }) 
        }
        
    }

    async MensagemConhecerBot(req : Request, res : Response){
        const {password} = req.body;

        console.log(password);
        

        if(password != API_PASSWORD){
            console.log("Senha Incorreta");
            res.sendStatus(400);
        }
        else{
            const resultados = AppDataSource.getRepository(User);

            const clientes = await resultados.find({where: {cli_ativado: "s"}});

            if(!clientes){
                console.log("Sem Clientes");
                res.send("Sem Clientes")
            }

            clientes.map(async (client : any) => {
                try{
    
                    const test: MessageTemplateObject<ComponentTypesEnum> = {
                        name: "notificao_bot",
                        language: {
                            code: LanguagesEnum.Portuguese_BR,
                            policy: 'deterministic'
                        },
                    };
    
                    const number = Number("55" + client.celular.replace(/[^\d]/g, ''));
    
                    console.log(number);
                    
            
                    await wa.messages.template( test, number ).then( ( res ) =>
                        {
                            console.log( res.rawResponse() );
                        } );
                    
                }
                catch( e )
                {
                    console.log( JSON.stringify( e ) );
                }
                res.sendStatus(200);
            }) 

        }

    }

}

export default new MensagensController();