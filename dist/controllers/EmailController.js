"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const Record_1 = require("../entities/Record");
const Pix_1 = require("../entities/Pix");
const User_1 = require("../entities/User");
const ds_1 = require("../database/ds");
const date_fns_1 = require("date-fns");
const typeorm_1 = require("typeorm");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const ssh2_sftp_client_1 = __importDefault(require("ssh2-sftp-client"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const transporter = nodemailer_1.default.createTransport({
    host: 'smtp.mailgun.org',
    port: 587, // Porta SMTP para envio de e-mails
    secure: false, // true para 465, false para outras portas como 587
    auth: {
        user: process.env.MAILGUNNER_USER,
        pass: process.env.MAILGUNNER_PASS,
    },
    pool: true, // Ativa o uso de pool de conexões
    maxConnections: 1, // Limita o número de conexões simultâneas
    tls: {
        ciphers: 'SSLv3'
    }
});
node_cron_1.default.schedule('0 16 * * *', () => {
    console.log('RUNNING CRONTAB BEFORE 10 DAYS');
    emailController.DiasAntes10();
});
node_cron_1.default.schedule('0 10 * * *', () => {
    console.log('RUNNING CRONTAB BEFORE 5 DAYS');
    emailController.DiasAntes5();
});
node_cron_1.default.schedule('0 0 * * *', () => {
    console.log('RUNNING CRONTAB THE DAY');
    emailController.DiasDoVencimento();
});
// cron.schedule('*/1 * * * *', () => {
//     console.log('RUNNING CRONTAB TEST');
//     // emailController.TesteEmail();
//     // emailController.TesteEmail5DiasAntes();
//     // emailController.TesteEmail10DiasAntes();
// })
// cron.schedule('30 8 * * *', () => {
//     console.log('RUNNING CRONTAB TEST');
//     emailController.TesteEmMassa();
// })
const pdfPath = '/opt/mk-auth/print_pdf/boletos/'; // Caminho do arquivo no sistema de arquivos
class EmailController {
    msg(msg, formattedDate, login, linhadig, pix, endereco, numero, senha) {
        msg = `<p><strong>${login.toUpperCase()}</strong></p>\n`;
        if (linhadig) {
            msg += `<p>Segue a linha digitável do seu boleto da mensalidade:</p>\n`;
            msg += `<p><strong>${linhadig}</strong></p>\n`;
            msg += `<p>Caso não tenha chegado seu PDF, acesse nossa central para poder baixa-lo sempre que precisar</p>\n`;
            msg += `<p><a href="https://mk.wiptelecomunicacoes.com.br/central/login.hhvm">Central do Assinante</a></p>\n`;
            msg += `<p><strong>Login: ${login}</strong></p>\n`;
            msg += `<p><strong>Senha: ${senha}</strong></p>\n`;
        }
        if (pix) {
            msg += `<p>Segue o código <strong>copia e cola</strong> do Pix:</p>\n`;
            msg += `<p><strong>${pix}</strong></p>\n`;
        }
        msg += `<p>DATA DE VENCIMENTO: <strong>${formattedDate}</strong></p>`;
        msg += `<p>ENDEREÇO: ${endereco.toUpperCase()} Nº${numero}</p>`;
        msg += `<p>BOT DE AUTO-ATENDIMENTO WIP TELECOM, disponível 24 horas, para efetuar pagamentos, super rápido e dinâmico, CLIQUE NO LINK ABAIXO:</p>`;
        msg += `<p><a href="https://wa.me/message/MWHGELKC45WDN1">Wip Telecom Bot</a></p>`;
        msg += `<p><em>Mensagem automática, não responder neste e-mail. Para dúvidas, entre em contato pelo número (14)98233-2963</em></p>`;
        msg += `<p>Att.: WIP TELECOM</p>`;
        msg += `<p>Agradecemos sua preferência!</p>`;
        msg += `<p style="color: red;"><strong>ATENÇÃO: CASO JÁ TENHA PAGO/AGENDADO, DESCONSIDERE ESTE E-MAIL!</strong></p>`;
        return msg;
    }
    async downloadPdfFromFtp(host, username, password, remoteFilePath, localFilePath) {
        const client = new ssh2_sftp_client_1.default();
        try {
            await client.connect({
                host,
                port: 22,
                username,
                password,
            });
            const fileExists = await client.exists(remoteFilePath);
            if (fileExists) {
                // console.log(`Arquivo encontrado no servidor: ${remoteFilePath}`);
                await client.fastGet(remoteFilePath, localFilePath);
                // console.log("PDF baixado com sucesso via SFTP");
                return true;
            }
            else {
                // console.error(`Arquivo não encontrado no servidor: ${remoteFilePath}`);
                return false;
            }
        }
        catch (error) {
            // console.error("Erro ao baixar o PDF via SFTP: ", error);
            return false;
        }
        finally {
            client.end();
        }
    }
    async TesteEmail() {
        await this.processTestClients(0, "Sua Fatura Vence Hoje");
    }
    async TesteEmail5DiasAntes() {
        await this.processTestClients(5);
    }
    async TesteEmail10DiasAntes() {
        await this.processTestClients(10);
    }
    async TesteEmMassa() {
        const generateFakeEmails = (quantity) => {
            const fakeEmails = new Map();
            const domains = ['example.com', 'test.com', 'fake.com'];
            for (let i = 1; i <= quantity; i++) {
                const username = `user${i}`;
                const domain = domains[Math.floor(Math.random() * domains.length)];
                const email = `${username}@${domain}`;
                fakeEmails.set(i, email);
            }
            return fakeEmails;
        };
        const fakeEmailsMap = generateFakeEmails(500);
        // Converte o Map para um array e aplica o map()
        const emailArray = Array.from(fakeEmailsMap).map(([key, email]) => {
            return { key, email }; // Pode personalizar o retorno aqui
        });
        for (const client of emailArray) {
            const mailOptions = {
                from: process.env.MAILGUNNER_USER,
                to: String(client.email),
                subject: `Test Email`,
                msg: "Testando Envio"
            };
            try {
                await transporter.sendMail(mailOptions);
                console.log("Teste Email Enviado: " + client.email);
            }
            catch (error) {
                console.log(error);
            }
            await sleep(50000); // Pausa de 36 segundos
        }
    }
    async DiasDoVencimento() {
        await this.processClients(0, "Sua Fatura Vence Hoje");
    }
    async DiasAntes5() {
        await this.processClients(5);
    }
    async DiasAntes10() {
        await this.processClients(10);
    }
    async processClients(diasAntes, opcionalMessage) {
        const date = new Date();
        const dataAlvo = (0, date_fns_1.addDays)(date, diasAntes);
        const anoAlvo = dataAlvo.getFullYear();
        const mesAlvo = dataAlvo.getMonth() + 1;
        const diaAlvo = dataAlvo.getDate();
        const resultados = ds_1.AppDataSource.getRepository(Record_1.Record);
        const clientes = await resultados.find({
            where: {
                datavenc: (0, typeorm_1.Raw)(alias => `(YEAR(${alias}) = ${anoAlvo} AND MONTH(${alias}) = ${mesAlvo} AND DAY(${alias}) = ${diaAlvo})`),
                datadel: (0, typeorm_1.Raw)(alias => `${alias} IS NULL`),
                status: (0, typeorm_1.Raw)(alias => `${alias} != 'pago'`)
            }
        });
        console.log("Quantidade de Clientes: " + clientes.length);
        let remainingClients = clientes.length;
        for (const client of clientes) {
            try {
                let msg = "";
                const idBoleto = client.uuid_lanc;
                const pix_resultados = ds_1.AppDataSource.getRepository(Pix_1.Pix);
                const pix = await pix_resultados.findOne({ where: { titulo: idBoleto } });
                const parsedDate = (0, date_fns_1.parseISO)(String(client.datavenc));
                const formattedDate = (0, date_fns_1.format)(parsedDate, 'dd/MM/yyyy');
                console.log("Cliente: " + client.login);
                console.log("\nData de Vencimento: " + formattedDate);
                remainingClients--;
                console.log("Clientes restantes: " + remainingClients);
                const pppoe = client.login;
                const clientesRepo = ds_1.AppDataSource.getRepository(User_1.User);
                const email = await clientesRepo.findOne({ where: { login: pppoe, cli_ativado: "s" } });
                const html_msg = this.msg(msg, formattedDate, pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero, email?.cpf_cnpj);
                const ftpHost = String(process.env.HOST_FTP);
                const ftpUser = String(process.env.USERNAME_FTP);
                const ftpPassword = String(process.env.PASSWORD_FTP);
                const remotePdfPath = `${pdfPath}${idBoleto}.pdf`;
                const localPdfPath = path_1.default.join(__dirname, "..", "..", 'temp', `${idBoleto}.pdf`);
                const pdfDownload = await this.downloadPdfFromFtp(ftpHost, ftpUser, ftpPassword, remotePdfPath, localPdfPath);
                if (email?.email && pdfDownload) {
                    const mailOptions = {
                        from: process.env.MAILGUNNER_USER,
                        to: String(email.email),
                        subject: `${opcionalMessage ? `${opcionalMessage} ${client.login}` : `Wip Telecom Boleto Mensalidade ${formattedDate}`} `,
                        html: html_msg,
                        attachments: [
                            {
                                filename: 'Boleto.pdf',
                                path: localPdfPath
                            }
                        ]
                    };
                    try {
                        transporter.sendMail(mailOptions);
                        this.logSend(email.email, client);
                    }
                    catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                }
                else if (email?.email) {
                    const mailOptions = {
                        from: process.env.MAILGUNNER_USER,
                        to: String(email.email),
                        subject: `${opcionalMessage ? `${opcionalMessage} ${client.login}` : `Wip Telecom Boleto Mensalidade ${formattedDate}`} `,
                        html: html_msg,
                    };
                    try {
                        transporter.sendMail(mailOptions);
                        this.logSend(email.email, client);
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
                await sleep(50000);
            }
            catch (error) {
                console.log(error);
                this.logError(error, "N/A", client);
            }
        }
        console.log(`Finalizado Crontab ${diasAntes} Dias Antes`);
    }
    async processTestClients(diasAntes, opcionalMessage) {
        const date = new Date();
        const dataAlvo = (0, date_fns_1.addDays)(date, diasAntes);
        const anoAlvo = dataAlvo.getFullYear();
        const mesAlvo = dataAlvo.getMonth() + 1;
        const diaAlvo = dataAlvo.getDate();
        const resultados = ds_1.AppDataSource.getRepository(Record_1.Record);
        const clientes = await resultados.find({
            where: {
                datavenc: (0, typeorm_1.Raw)(alias => `(YEAR(${alias}) = ${anoAlvo} AND MONTH(${alias}) = ${mesAlvo} AND DAY(${alias}) = ${diaAlvo})`),
                datadel: (0, typeorm_1.Raw)(alias => `${alias} IS NULL`),
                status: (0, typeorm_1.Raw)(alias => `${alias} != 'pago'`),
                login: "PEDROJOVANUZZI"
            }
        });
        console.log("Quantidade de Clientes: " + clientes.length);
        let remainingClients = clientes.length;
        for (const client of clientes) {
            try {
                let msg = "";
                const idBoleto = client.uuid_lanc;
                const pix_resultados = ds_1.AppDataSource.getRepository(Pix_1.Pix);
                const pix = await pix_resultados.findOne({ where: { titulo: idBoleto } });
                const parsedDate = (0, date_fns_1.parseISO)(String(client.datavenc));
                const formattedDate = (0, date_fns_1.format)(parsedDate, 'dd/MM/yyyy');
                console.log("Cliente: " + client.login);
                console.log("\nData de Vencimento: " + formattedDate);
                remainingClients--;
                console.log("Clientes restantes: " + remainingClients);
                const pppoe = client.login;
                const clientesRepo = ds_1.AppDataSource.getRepository(User_1.User);
                const email = await clientesRepo.findOne({ where: { login: pppoe, cli_ativado: "s" } });
                const html_msg = this.msg(msg, formattedDate, pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero, email?.cpf_cnpj);
                const ftpHost = String(process.env.HOST_FTP);
                const ftpUser = String(process.env.USERNAME_FTP);
                const ftpPassword = String(process.env.PASSWORD_FTP);
                const remotePdfPath = `${pdfPath}${idBoleto}.pdf`;
                const localPdfPath = path_1.default.join(__dirname, "..", "..", 'temp', `${idBoleto}.pdf`);
                const pdfDownload = await this.downloadPdfFromFtp(ftpHost, ftpUser, ftpPassword, remotePdfPath, localPdfPath);
                if (email?.email && pdfDownload) {
                    const mailOptions = {
                        from: process.env.MAILGUNNER_USER,
                        to: String(email.email),
                        subject: `${opcionalMessage ? `${opcionalMessage} ${client.login}` : `Wip Telecom Boleto Mensalidade ${formattedDate}`} `,
                        html: html_msg,
                        attachments: [
                            {
                                filename: 'Boleto.pdf',
                                path: localPdfPath
                            }
                        ]
                    };
                    try {
                        transporter.sendMail(mailOptions);
                        this.logSend(email.email, client);
                    }
                    catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                }
                else if (email?.email) {
                    const mailOptions = {
                        from: process.env.MAILGUNNER_USER,
                        to: String(email.email),
                        subject: `${opcionalMessage ? `${opcionalMessage} ${client.login}` : `Wip Telecom Boleto Mensalidade ${formattedDate}`} `,
                        html: html_msg,
                    };
                    try {
                        transporter.sendMail(mailOptions);
                        this.logSend(email.email, client);
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
                await sleep(50000);
            }
            catch (error) {
                console.log(error);
                this.logError(error, "N/A", client);
            }
        }
        console.log(`Finalizado Crontab ${diasAntes} Dias Antes`);
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
    logSend(email, cliente) {
        const logFilePath = path_1.default.join(__dirname, '../../logs/SendLogs.json');
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
        const newLog = {
            tipo: "BOLETO ENVIADO",
            email,
            cliente: cliente.login,
            date: new Date().toISOString()
        };
        logs.push(newLog);
        // Salvar os logs de volta no arquivo
        fs_1.default.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    }
}
const emailController = new EmailController();
exports.default = emailController;
