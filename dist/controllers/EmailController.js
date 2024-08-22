"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const Record_1 = require("../entities/Record");
const Pix_1 = require("../entities/Pix");
const User_1 = require("../entities/User");
const ds2_1 = require("../database/ds2");
const ds3_1 = require("../database/ds3");
const ds_1 = require("../database/ds");
const typeorm_1 = require("typeorm");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
node_cron_1.default.schedule('40 10 * * *', () => {
    console.log('RUNNING CRONTAB');
    emailController.DiasAntes5();
    emailController.DiasDoVencimento();
});
const transporter = nodemailer_1.default.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587, // Porta SMTP para envio de e-mails
    secure: false, // true para 465, false para outras portas como 587
    auth: {
        user: process.env.EMAIL, // Seu e-mail do Outlook
        pass: process.env.PASSWORD_EMAIL, // Sua senha do e-mail
    },
    pool: true, // Ativa o uso de pool de conexões
    maxConnections: 1, // Limita o número de conexões simultâneas
    rateLimit: 1, // Limita o número de mensagens por segundo
    tls: {
        ciphers: 'SSLv3'
    }
});
class EmailController {
    msg(msg, formattedDate, login, linhadig, pix, endereco, numero) {
        msg = `<p><strong>${login.toUpperCase()}</strong></p>\n`;
        if (linhadig) {
            msg += `<p>Segue a linha digitável do seu boleto da mensalidade:</p>\n`;
            msg += `<p><strong>${linhadig}</strong></p>\n`;
        }
        if (pix) {
            msg += `<p>Segue o código <strong>copia e cola</strong> do Pix:</p>\n`;
            msg += `<p><strong>${pix}</strong></p>\n`;
        }
        msg += `<p>DATA DE VENCIMENTO: <strong>${formattedDate}</strong></p>`;
        msg += `<p>ENDEREÇO: ${endereco.toUpperCase()} Nº${numero}</p>`;
        msg += `<p>BOT DE AUTO-ATENDIMENTO WIP TELECOM, disponível 24 horas, para efetuar pagamentos, super rápido e dinâmico, CLIQUE NO LINK ABAIXO:</p>`;
        msg += `<p><a href="https://wa.me/message/MWHGELKC45WDN1">https://wa.me/message/MWHGELKC45WDN1</a></p>`;
        msg += `<p><em>Mensagem automática, não responder neste e-mail. Para dúvidas, entre em contato pelo número (14)98233-2963</em></p>`;
        msg += `<p>Att.: WIP TELECOM</p>`;
        msg += `<p>Agradecemos sua preferência!</p>`;
        msg += `<p style="color: red;"><strong>ATENÇÃO: CASO JÁ TENHA PAGO/AGENDADO, DESCONSIDERE ESTE E-MAIL!</strong></p>`;
        return msg;
    }
    async DiasAntes5() {
        const date = new Date();
        const anoAtual = date.getFullYear(); // Obtém o ano atual
        const MesDeHoje = date.getMonth() + 1; // getMonth retorna de 0 a 11, então adicionamos 1
        const diaHoje = date.getDate(); // getDate retorna o dia do mês
        const diaVencimento = diaHoje + 5;
        console.log(MesDeHoje);
        console.log(diaHoje);
        const resultados = ds2_1.AppDataSourceBoleto.getRepository(Record_1.Record);
        const clientes = await resultados.find({
            //Alias representa o resultado da data da coluna
            where: {
                datavenc: (0, typeorm_1.Raw)(alias => `(YEAR(${alias}) = ${anoAtual} AND MONTH(${alias}) = ${MesDeHoje} AND DAY(${alias}) = ${diaVencimento})`),
                datadel: (0, typeorm_1.Raw)(alias => `${alias} IS NULL`),
                status: (0, typeorm_1.Raw)(alias => `${alias} != 'pago'`)
            },
            take: 1
        });
        // console.log(clientes);
        clientes.map(async (client) => {
            try {
                let msg = "";
                const idBoleto = client.uuid_lanc;
                const pix_resultados = ds3_1.AppDataSourcePix.getRepository(Pix_1.Pix);
                const pix = await pix_resultados.findOne({ where: { titulo: idBoleto } });
                const dateString = client.datavenc;
                const formattedDate = dateString.split(' ')[0].split('-').reverse().join('/');
                const pppoe = client.login;
                const clientes = ds_1.AppDataSource.getRepository(User_1.User);
                const email = await clientes.findOne({ where: { login: pppoe, cli_ativado: "s" } });
                const html_msg = this.msg(msg, formattedDate, pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero);
                if (email?.email) {
                    const mailOptions = {
                        from: process.env.EMAIL,
                        to: String(email.email),
                        subject: `Wip Telecom Boleto Mensalidade ${formattedDate}`,
                        html: html_msg,
                    };
                    // console.log(msg);
                    console.log(mailOptions);
                    try {
                        await transporter.sendMail(mailOptions);
                    }
                    catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                }
                else {
                    console.log("Sem Email Cadastrado");
                    this.logError("Sem Email Cadastrado", "Email", client);
                }
            }
            catch (error) {
                console.log(error);
                this.logError(error, "N/A", client);
            }
        });
        console.log("Finalizado");
    }
    async DiasDoVencimento() {
        const date = new Date();
        const anoAtual = date.getFullYear(); // Obtém o ano atual
        const MesDeHoje = date.getMonth() + 1; // getMonth retorna de 0 a 11, então adicionamos 1
        const diaHoje = date.getDate(); // getDate retorna o dia do mês
        const diaVencimento = diaHoje;
        console.log(MesDeHoje);
        console.log(diaHoje);
        const resultados = ds2_1.AppDataSourceBoleto.getRepository(Record_1.Record);
        const clientes = await resultados.find({
            //Alias representa o resultado da data da coluna
            where: {
                datavenc: (0, typeorm_1.Raw)(alias => `(YEAR(${alias}) = ${anoAtual} AND MONTH(${alias}) = ${MesDeHoje} AND DAY(${alias}) = ${diaVencimento})`),
                datadel: (0, typeorm_1.Raw)(alias => `${alias} IS NULL`),
                status: (0, typeorm_1.Raw)(alias => `${alias} != 'pago'`)
            },
            take: 1
        });
        // console.log(clientes);
        clientes.map(async (client) => {
            try {
                let msg = "";
                const idBoleto = client.uuid_lanc;
                const pix_resultados = ds3_1.AppDataSourcePix.getRepository(Pix_1.Pix);
                const pix = await pix_resultados.findOne({ where: { titulo: idBoleto } });
                const dateString = client.datavenc;
                const formattedDate = dateString.split(' ')[0].split('-').reverse().join('/');
                const pppoe = client.login;
                const clientes = ds_1.AppDataSource.getRepository(User_1.User);
                const email = await clientes.findOne({ where: { login: pppoe, cli_ativado: "s" } });
                const html_msg = this.msg(msg, formattedDate, pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero);
                if (email?.email) {
                    const mailOptions = {
                        from: process.env.EMAIL,
                        to: String(email?.email),
                        subject: `Sua Fatura Vence Hoje ${pppoe.toUpperCase()}`,
                        html: html_msg,
                    };
                    // console.log(msg);
                    console.log(mailOptions);
                    try {
                        await transporter.sendMail(mailOptions);
                    }
                    catch (error) {
                        // console.log(error);
                        this.logError(error, email?.email, client);
                    }
                }
                else {
                    console.log("Sem Email Cadastrado");
                    this.logError("Sem Email Cadastrado", "Email", client);
                }
            }
            catch (error) {
                // console.log(error);
                this.logError(error, "N/A", client);
            }
        });
        console.log("Finalizado");
    }
    logError(error, email, cliente) {
        const logFilePath = path_1.default.join(__dirname, '../../logs/EmailLogs.json');
        // Verificar se o arquivo existe e não está vazio
        let logs = [];
        if (fs_1.default.existsSync(logFilePath)) {
            const logFileData = fs_1.default.readFileSync(logFilePath, 'utf8');
            if (logFileData.trim()) { // Verifica se o arquivo não está vazio
                try {
                    logs = JSON.parse(logFileData);
                }
                catch (parseError) {
                    console.error("Erro ao fazer parse do JSON:", parseError);
                    logs = []; // Se o JSON estiver corrompido, recomeça com um array vazio
                }
            }
        }
        // Adicionar o novo log de erro
        const newLog = {
            email,
            cliente: cliente.login,
            error: error.message || error,
            date: new Date().toISOString()
        };
        logs.push(newLog);
        // Salvar os logs de volta no arquivo
        fs_1.default.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    }
}
const emailController = new EmailController();
exports.default = emailController;
