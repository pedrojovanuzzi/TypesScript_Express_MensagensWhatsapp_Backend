"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_1 = __importDefault(require("whatsapp"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../entities/User");
const ds_1 = require("../database/ds");
dotenv_1.default.config();
const waPhonerNumberId = Number(process.env.WA_PHONE_NUMBER_ID);
const wa = new whatsapp_1.default(waPhonerNumberId);
const Token = String(process.env.CLOUD_API_ACCESS_TOKEN);
const was_token_changed = wa.updateAccessToken(Token);
const API_PASSWORD = process.env.API_PASSWORD;
class MensagensController {
    async MensagensBairro(req, res) {
        const { msg, bairro } = req.query;
        const { password } = req.body;
        console.log(req.query);
        if (password != API_PASSWORD) {
            console.log("Senha Incorreta");
            res.sendStatus(400);
        }
        else {
            const resultados = ds_1.AppDataSource.getRepository(User_1.User);
            let UppercaseBairro;
            if (typeof bairro === 'string') {
                UppercaseBairro = bairro.toUpperCase();
            }
            else {
                console.log("Error Bairro not String");
                res.send("Error Bairro not String");
            }
            console.log(UppercaseBairro);
            const clientes = await resultados.find({ where: { bairro: UppercaseBairro, cli_ativado: "s" } });
            // console.log(clientes);
            if (!clientes) {
                console.log("Sem Clientes");
                res.send("Sem Clientes");
            }
            clientes.map(async (client) => {
                try {
                    const test = {
                        name: "aviso_bairro",
                        language: {
                            code: "pt_BR" /* LanguagesEnum.Portuguese_BR */,
                            policy: 'deterministic'
                        },
                        components: [
                            {
                                type: "header" /* ComponentTypesEnum.Header */,
                                parameters: [
                                    {
                                        type: "text" /* ParametersTypesEnum.Text */,
                                        text: UppercaseBairro
                                    }
                                ]
                            },
                            {
                                type: "body" /* ComponentTypesEnum.Body */,
                                parameters: [
                                    {
                                        type: "text" /* ParametersTypesEnum.Text */,
                                        text: String(msg),
                                    },
                                    {
                                        type: "text" /* ParametersTypesEnum.Text */,
                                        text: UppercaseBairro,
                                    },
                                ],
                            }
                        ],
                    };
                    const number = Number("55" + client.celular.replace(/[^\d]/g, ''));
                    console.log(number);
                    await wa.messages.template(test, number).then((res) => {
                        // console.log( res.rawResponse() );
                    });
                }
                catch (e) {
                    console.log(JSON.stringify(e));
                }
                res.sendStatus(200);
            });
        }
    }
    async MensagemConhecerBot(req, res) {
        const { password } = req.body;
        console.log(password);
        if (password != API_PASSWORD) {
            console.log("Senha Incorreta");
            res.sendStatus(400);
        }
        else {
            const resultados = ds_1.AppDataSource.getRepository(User_1.User);
            const clientes = await resultados.find({ where: { cli_ativado: "s" } });
            if (!clientes) {
                console.log("Sem Clientes");
                res.send("Sem Clientes");
            }
            clientes.map(async (client) => {
                try {
                    const test = {
                        name: "notificao_bot",
                        language: {
                            code: "pt_BR" /* LanguagesEnum.Portuguese_BR */,
                            policy: 'deterministic'
                        },
                    };
                    const number = Number("55" + client.celular.replace(/[^\d]/g, ''));
                    console.log(number);
                    await wa.messages.template(test, number).then((res) => {
                        // console.log( res.rawResponse() );
                    });
                }
                catch (e) {
                    console.log(JSON.stringify(e));
                }
                res.sendStatus(200);
            });
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
            if (!clientes) {
                console.log("Sem Clientes");
                res.send("Sem Clientes");
            }
            clientes.map(async (client) => {
                try {
                    const test = {
                        name: "aviso_pon",
                        language: {
                            code: "pt_BR" /* LanguagesEnum.Portuguese_BR */,
                            policy: 'deterministic'
                        },
                        components: [
                            {
                                type: "header" /* ComponentTypesEnum.Header */,
                                parameters: [
                                    {
                                        type: "text" /* ParametersTypesEnum.Text */,
                                        text: String(titulo)
                                    }
                                ]
                            },
                            {
                                type: "body" /* ComponentTypesEnum.Body */,
                                parameters: [
                                    {
                                        type: "text" /* ParametersTypesEnum.Text */,
                                        text: String(msg)
                                    }
                                ],
                            }
                        ],
                    };
                    const number = Number("55" + client.celular.replace(/[^\d]/g, ''));
                    console.log(number);
                    await wa.messages.template(test, number).then((res) => {
                        // console.log( res.rawResponse() );
                    });
                }
                catch (e) {
                    console.log(JSON.stringify(e));
                }
                res.sendStatus(200);
            });
        }
    }
}
exports.default = new MensagensController();
