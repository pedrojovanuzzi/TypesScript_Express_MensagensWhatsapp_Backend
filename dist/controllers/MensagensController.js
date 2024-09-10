"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_1 = __importDefault(require("whatsapp"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../entities/User");
const ds_1 = require("../database/ds");
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const waPhonerNumberId = Number(process.env.WA_PHONE_NUMBER_ID);
const wa = new whatsapp_1.default(waPhonerNumberId);
const Token = String(process.env.CLOUD_API_ACCESS_TOKEN);
const was_token_changed = wa.updateAccessToken(Token);
const API_PASSWORD = process.env.API_PASSWORD;
const url = `https://graph.facebook.com/v20.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
class MensagensController {
    async MensagensBairro(req, res) {
        const { msg, bairro } = req.query;
        const { password } = req.body;
        if (password !== API_PASSWORD) {
            console.log("Senha Incorreta");
            return res.sendStatus(400);
        }
        const resultados = ds_1.AppDataSource.getRepository(User_1.User);
        let UppercaseBairro;
        if (typeof bairro === 'string') {
            UppercaseBairro = bairro.toUpperCase();
        }
        else {
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
            await Promise.all(clientes.map(async (client) => {
                try {
                    const number = Number("55" + client.celular.replace(/[^\d]/g, ''));
                    console.log(number);
                    const text = await axios_1.default.post(url, {
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
                    }, {
                        headers: {
                            Authorization: `Bearer ${Token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    console.log('Template message sent successfully:', text.data);
                }
                catch (error) {
                    console.error('Error sending template message:', error);
                }
            }));
            res.sendStatus(200);
        }
        catch (error) {
            console.error('Error processing clients:', error);
            res.status(500).send("Error processing clients");
        }
    }
    async MensagensPON(req, res) {
        const { titulo, msg, pon } = req.query;
        const { password } = req.body;
        console.log(req.query);
        if (password != API_PASSWORD) {
            console.log("Senha Incorreta");
            res.sendStatus(400);
        }
        else {
            const resultados = ds_1.AppDataSource.getRepository(User_1.User);
            const clientes = await resultados.find({ where: { porta_olt: String(pon), cli_ativado: "s" } });
            // console.log(clientes);
            if (clientes.length === 0) {
                console.log("Sem Clientes");
                return res.send("Sem Clientes");
            }
            await Promise.all(clientes.map(async (client) => {
                try {
                    const number = Number("55" + client.celular.replace(/[^\d]/g, ''));
                    console.log(number);
                    const text = await axios_1.default.post(url, {
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
                    }, {
                        headers: {
                            Authorization: `Bearer ${Token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    console.log('Template message sent successfully:', text.data);
                }
                catch (error) {
                    console.error('Error sending template message:', error);
                }
            }));
        }
        res.sendStatus(200);
    }
}
exports.default = new MensagensController();
