import WhatsApp from 'whatsapp';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import {User} from "../entities/User"
import {AppDataSource} from "../database/ds"
import { ComponentTypesEnum } from 'whatsapp/build/types/enums';
import { MessageTemplateObject } from 'whatsapp/build/types/messages';
import { LanguagesEnum } from 'whatsapp/build/types/enums';
import { ParametersTypesEnum } from 'whatsapp/build/types/enums';
import axios from 'axios';

dotenv.config();

const waPhonerNumberId = Number(process.env.WA_PHONE_NUMBER_ID);
const wa = new WhatsApp(waPhonerNumberId);
const Token = String(process.env.CLOUD_API_ACCESS_TOKEN);
const was_token_changed = wa.updateAccessToken(Token);
const API_PASSWORD = process.env.API_PASSWORD;

const url = `https://graph.facebook.com/v20.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;



class MensagensController{

    async MensagensBairro(req: Request, res: Response) {
        const { msg, bairro } = req.query;
        const { password } = req.body;
      
        if (password !== API_PASSWORD) {
          console.log("Senha Incorreta");
          return res.sendStatus(400);
        }
      
        const resultados = AppDataSource.getRepository(User);
        let UppercaseBairro: string | undefined;
      
        if (typeof bairro === 'string') {
          UppercaseBairro = bairro.toUpperCase();
        } else {
          console.log("Error Bairro not String");
          return res.status(400).send("Error Bairro not String");
        }
      
        console.log(UppercaseBairro);
      
        const clientes = await resultados.find({
          where: { bairro: UppercaseBairro, cli_ativado: "s" }
        });
      
        if (clientes.length === 0) {
          console.log("Sem Clientes");
          return res.send("Sem Clientes");
        }
      
        try {
          await Promise.all(
            clientes.map(async (client: any) => {
              try {
                const number = Number("55" + client.celular.replace(/[^\d]/g, ''));
                console.log(number);
      
                const text = await axios.post(
                  url,
                  {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: number,
                    type: 'template',
                    template: {
                      name: "aviso_bairro",
                      language: {
                        code: "pt_BR",
                      },
                      components: [
                        {
                          type: "header",
                          parameters: [
                            {
                              type: "text",
                              text: UppercaseBairro,
                            },
                          ],
                        },
                        {
                          type: "body",
                          parameters: [
                            {
                              type: "text",
                              text: String(msg),
                            },
                            {
                              type: "text",
                              text: UppercaseBairro,
                            },
                          ],
                        },
                      ],
                    },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${Token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
      
                console.log('Template message sent successfully:', text.data);
              } catch (error) {
                console.error('Error sending template message:', error);
              }
            })
          );
      
          res.sendStatus(200);
        } catch (error) {
          console.error('Error processing clients:', error);
          res.status(500).send("Error processing clients");
        }
      }


    async MensagensPON(req : Request, res : Response){
        const {titulo, msg, pon} = req.query;
        const {password} = req.body;

        console.log(req.query);
        
        if(password != API_PASSWORD){
            console.log("Senha Incorreta");
            res.sendStatus(400);
            
        }
        else{
        const resultados = AppDataSource.getRepository(User);

        const clientes = await resultados.find({where: {porta_olt: String(pon), cli_ativado: "s"}});

        // console.log(clientes);
        

        if (clientes.length === 0) {
            console.log("Sem Clientes");
            return res.send("Sem Clientes");
          }

          
        await Promise.all(
        clientes.map(async (client : any) => {
            try {
                const number = Number("55" + client.celular.replace(/[^\d]/g, ''));
                console.log(number);
      
                const text = await axios.post(
                  url,
                  {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: number,
                    type: 'template',
                    template: {
                      name: "aviso_pon",
                      language: {
                        code: "pt_BR",
                      },
                      components: [
                        {
                          type: "header",
                          parameters: [
                            {
                              type: "text",
                              text: String(titulo),
                            },
                          ],
                        },
                        {
                          type: "body",
                          parameters: [
                            {
                              type: "text",
                              text: String(msg),
                            },
                          ],
                        },
                      ],
                    },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${Token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
      
                console.log('Template message sent successfully:', text.data);
              } catch (error) {
                console.error('Error sending template message:', error);
              }   
        }))
        }
        res.sendStatus(200);
    }

}

export default new MensagensController();