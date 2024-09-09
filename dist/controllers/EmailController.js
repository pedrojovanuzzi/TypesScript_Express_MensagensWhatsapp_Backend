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
const typeorm_1 = require("typeorm");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const basic_ftp_1 = require("basic-ftp");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
node_cron_1.default.schedule('0 1 * * *', () => {
    console.log('RUNNING CRONTAB BEFORE 5 DAYS');
    emailController.DiasAntes5();
});
node_cron_1.default.schedule('0 4 * * *', () => {
    console.log('RUNNING CRONTAB THE DAY');
    emailController.DiasDoVencimento();
});
// cron.schedule('*/1 * * * *', () => {
//     console.log('RUNNING CRONTAB TEST');
//     emailController.TesteEmail();
// })
const pdfPath = '/opt/mk-auth/print_pdf/boletos/'; // Caminho do arquivo no sistema de arquivos
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
    async downloadPdfFromFtp(host, user, password, remoteFilePath, localFilePath) {
        const client = new basic_ftp_1.Client();
        try {
            await client.access({
                host,
                user,
                password,
                secure: false // ou true, se o servidor usar FTP seguro
            });
            await client.downloadTo(localFilePath, remoteFilePath);
        }
        catch (error) {
            console.error('Erro ao baixar o PDF via FTP: ', error);
        }
        finally {
            client.close();
        }
    }
    //   async TesteEmail() {
    //     const date = new Date();
    //     const anoAtual = date.getFullYear(); // Obtém o ano atual
    //     const MesDeHoje = date.getMonth() + 1; // getMonth retorna de 0 a 11, então adicionamos 1
    //     const diaHoje = date.getDate(); // getDate retorna o dia do mês
    //     const diaVencimento = diaHoje + 5;
    //     console.log(MesDeHoje);
    //     console.log(diaHoje);
    //     const resultados = AppDataSource.getRepository(Record);
    //     const clientes = await resultados.find({
    //         where: {
    //             datavenc: Raw(alias => `(YEAR(${alias}) = ${anoAtual} AND MONTH(${alias}) = ${MesDeHoje} AND DAY(${alias}) = ${diaVencimento})`),
    //             datadel: Raw(alias => `${alias} IS NULL`),
    //             status: Raw(alias => `${alias} != 'pago'`),
    //             login: "PEDROJOVANUZZI"
    //         }
    //     });
    //     console.log(clientes);
    //     clientes.map(async (client: any) => {
    //         try {
    //             let msg = "";
    //             const idBoleto = client.uuid_lanc;
    //             const pix_resultados = AppDataSource.getRepository(Pix);
    //             const pix = await pix_resultados.findOne({ where: { titulo: idBoleto } });
    //             const dateString = client.datavenc;
    //             const formattedDate = dateString.split(' ')[0].split('-').reverse().join('/');
    //             const pppoe = client.login;
    //             const clientesRepo = AppDataSource.getRepository(User);
    //             const email = await clientesRepo.findOne({ where: { login: pppoe, cli_ativado: "s" } });
    //             const html_msg = this.msg(msg, formattedDate, pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero);
    //             // Caminho do PDF remoto no servidor FTP
    //             const ftpHost = String(process.env.HOST_FTP);
    //             const ftpUser = String(process.env.USERNAME_FTP); // ajuste com suas credenciais
    //             const ftpPassword = String(process.env.PASSWORD_FTP); // ajuste com suas credenciais
    //             const remotePdfPath = `${pdfPath}${idBoleto}.pdf`; // ajustado para o ID do cliente
    //             const localPdfPath = path.join(__dirname, ".." , "..", 'temp', `${idBoleto}.pdf`); // Caminho local temporário para salvar o PDF
    //             // Baixar o PDF do servidor FTP antes de enviar o e-mail
    //             await this.downloadPdfFromFtp(ftpHost, ftpUser, ftpPassword, remotePdfPath, localPdfPath);
    //             if (email?.email) {
    //                 const mailOptions = {
    //                     from: process.env.EMAIL,
    //                     to: String(email.email),
    //                     subject: `Wip Telecom Boleto Mensalidade ${formattedDate}`,
    //                     html: html_msg,
    //                     attachments: [
    //                         {
    //                             filename: 'documento.pdf',
    //                             path: localPdfPath // Especifica o caminho local do PDF baixado
    //                         }
    //                     ]
    //                 };
    //                 console.log(mailOptions);
    //                 try {
    //                     await transporter.sendMail(mailOptions);
    //                     console.log("E-mail enviado com sucesso!");
    //                 } catch (error) {
    //                     console.log(error);
    //                     this.logError(error, email.email, client);
    //                 }
    //                 // Após enviar o e-mail, deletar o arquivo local temporário
    //                 fs.unlinkSync(localPdfPath);
    //             } else {
    //                 console.log("Sem Email Cadastrado");
    //                 this.logError("Sem Email Cadastrado", "Email", client);
    //             }
    //         } catch (error) {
    //             console.log(error);
    //             this.logError(error, "N/A", client);
    //         }
    //     });
    //     console.log("Finalizado");
    // }
    async DiasAntes5() {
        const date = new Date();
        const anoAtual = date.getFullYear(); // Obtém o ano atual
        const MesDeHoje = date.getMonth() + 1; // getMonth retorna de 0 a 11, então adicionamos 1
        const diaHoje = date.getDate(); // getDate retorna o dia do mês
        const diaVencimento = diaHoje + 5;
        console.log(MesDeHoje);
        console.log(diaHoje);
        const resultados = ds_1.AppDataSource.getRepository(Record_1.Record);
        const clientes = await resultados.find({
            //Alias representa o resultado da data da coluna
            where: {
                datavenc: (0, typeorm_1.Raw)(alias => `(YEAR(${alias}) = ${anoAtual} AND MONTH(${alias}) = ${MesDeHoje} AND DAY(${alias}) = ${diaVencimento})`),
                datadel: (0, typeorm_1.Raw)(alias => `${alias} IS NULL`),
                status: (0, typeorm_1.Raw)(alias => `${alias} != 'pago'`)
            }
        });
        // console.log(clientes);
        clientes.map(async (client) => {
            try {
                let msg = "";
                const idBoleto = client.uuid_lanc;
                const pix_resultados = ds_1.AppDataSource.getRepository(Pix_1.Pix);
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
        const resultados = ds_1.AppDataSource.getRepository(Record_1.Record);
        const clientes = await resultados.find({
            //Alias representa o resultado da data da coluna
            where: {
                datavenc: (0, typeorm_1.Raw)(alias => `(YEAR(${alias}) = ${anoAtual} AND MONTH(${alias}) = ${MesDeHoje} AND DAY(${alias}) = ${diaVencimento})`),
                datadel: (0, typeorm_1.Raw)(alias => `${alias} IS NULL`),
                status: (0, typeorm_1.Raw)(alias => `${alias} != 'pago'`)
            }
        });
        // console.log(clientes);
        clientes.map(async (client) => {
            try {
                let msg = "";
                const idBoleto = client.uuid_lanc;
                const pix_resultados = ds_1.AppDataSource.getRepository(Pix_1.Pix);
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
