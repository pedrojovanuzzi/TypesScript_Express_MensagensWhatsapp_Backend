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
const ssh2_sftp_client_1 = __importDefault(require("ssh2-sftp-client"));
const qs_1 = __importDefault(require("qs"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const bull_1 = __importDefault(require("bull"));
dotenv_1.default.config();
const emailQueue = new bull_1.default('emailQueue', {
    redis: {
        host: '127.0.0.1',
        port: 6379,
    }
});
emailQueue.process(async (job) => {
    console.log('Processando email para:', job.data.mailOptions.message.toRecipients[0].emailAddress.address);
    const mailOptions = job.data.mailOptions;
    try {
        await sendEmail(mailOptions);
        console.log('E-mail enviado com sucesso!');
        emailQueue.getJobs(['waiting', 'active']).then((jobs) => {
            console.log('Jobs na fila:', jobs.length);
        });
    }
    catch (error) {
        console.error('Erro ao enviar e-mail:', error);
    }
});
async function waitUntilQueueEmpty(queue) {
    let jobs = await queue.getJobs(['waiting', 'active']);
    // console.log(jobs);
    while (jobs.length > 0) {
        console.log(`Ainda há ${jobs.length} jobs a serem processados...`);
        // Processa cada job pendente chamando sendEmail
        for (const job of jobs) {
            const mailOptions = job.data.mailOptions;
            try {
                await sendEmail(mailOptions); // Envia o e-mail para cada job
                console.log(`E-mail enviado com sucesso para: ${mailOptions.message.toRecipients[0].emailAddress.address}`);
                // Marcar o job como completo no Bull (opcional)
                await job.moveToCompleted();
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error(`Erro ao enviar e-mail para: ${mailOptions.message.toRecipients[0].emailAddress.address}: ${error.message}`);
                    // Marcar o job como falho no Bull (opcional)
                    await job.moveToFailed({ message: error.message });
                }
                else {
                    console.error('Erro desconhecido ao enviar o e-mail', error);
                }
            }
        }
        // Espera 5 segundos antes de checar novamente por novos jobs
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Verifica novamente se ainda há jobs pendentes
        jobs = await queue.getJobs(['waiting', 'active']);
    }
    console.log('Todos os jobs foram processados!');
}
emailQueue.on('error', (err) => {
    console.error('Erro na conexão com Redis:', err);
});
function addEmailToQueue(mailOptions) {
    emailQueue.add({ mailOptions }, { delay: 10000, attempts: 2 });
}
function getBase64File(filePath) {
    const file = fs_1.default.readFileSync(filePath);
    return file.toString('base64');
}
async function getToken() {
    const tokenUrl = `https://login.microsoftonline.com/${process.env.tenantId}/oauth2/v2.0/token`;
    const data = qs_1.default.stringify({
        client_id: process.env.OUTLOOK_CLIENT,
        grant_type: 'refresh_token',
        refresh_token: process.env.code, // O refresh token que você já possui
        client_secret: process.env.OUTLOOK_SECRET, // O segredo do cliente
    });
    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
    try {
        const response = await axios_1.default.post(tokenUrl, data, config);
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token
        };
    }
    catch (error) {
        console.error('Erro ao obter o token Refresh:', error.response ? error.response.data : error.message);
    }
}
async function sendEmail(mailOptions) {
    const tokenResponse = await getToken();
    if (!tokenResponse) {
        console.log("Erro ao obter token de acesso.");
        return;
    }
    const { accessToken, refreshToken } = tokenResponse;
    console.log("AUTH CODE " + accessToken);
    console.log("refreshToken " + refreshToken);
    const url = `https://graph.microsoft.com/v1.0/users/${process.env.OUTLOOK_USER}/sendMail`;
    try {
        await axios_1.default.post(url, {
            message: mailOptions.message
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("E-mail enviado com sucesso!");
    }
    catch (error) {
        console.error('Erro ao enviar e-mail:', error.response ? error.response.data : error.message);
    }
}
node_cron_1.default.schedule('0 0 * * *', () => {
    console.log('RUNNING CRONTAB BEFORE 5 DAYS');
    emailController.DiasAntes5();
});
node_cron_1.default.schedule('0 4 * * *', () => {
    console.log('RUNNING CRONTAB THE DAY');
    emailController.DiasDoVencimento();
});
node_cron_1.default.schedule('0 8 * * *', async () => {
    console.log('RUNNING JOB CLEAR');
    try {
        // Verifica o estado dos jobs
        const jobs = await emailQueue.getJobs(['waiting', 'active']);
        console.log('Jobs na fila:', jobs.length);
        // Aguarda até que a fila esteja vazia
        await waitUntilQueueEmpty(emailQueue);
        console.log('Queue processada com sucesso!');
    }
    catch (error) {
        console.error('Erro ao processar a fila:', error);
    }
});
// cron.schedule('*/1 * * * *', () => {
//     console.log('RUNNING CRONTAB TEST');
//     emailController.TesteEmail();
// })
const pdfPath = '/opt/mk-auth/print_pdf/boletos/'; // Caminho do arquivo no sistema de arquivos
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
                console.log(`Arquivo encontrado no servidor: ${remoteFilePath}`);
                await client.fastGet(remoteFilePath, localFilePath);
                console.log("PDF baixado com sucesso via SFTP");
                return true;
            }
            else {
                console.error(`Arquivo não encontrado no servidor: ${remoteFilePath}`);
                return false;
            }
        }
        catch (error) {
            console.error("Erro ao baixar o PDF via SFTP: ", error);
            return false;
        }
        finally {
            client.end();
        }
    }
    // async TesteEmail() {
    //     const date = new Date();
    //     const anoAtual = date.getFullYear(); // Obtém o ano atual
    //     const MesDeHoje = date.getMonth() + 1; // getMonth retorna de 0 a 11, então adicionamos 1
    //     const diaHoje = date.getDate(); // getDate retorna o dia do mês
    //     const diaVencimento = diaHoje;
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
    //             console.log("RemotePDF: " + remotePdfPath);
    //             const localPdfPath = path.join(__dirname, ".." , "..", 'temp', `${idBoleto}.pdf`); // Caminho local temporário para salvar o PDF
    //             // Baixar o PDF do servidor FTP antes de enviar o e-mail
    //             const pdfDownload = await this.downloadPdfFromFtp(ftpHost, ftpUser, ftpPassword, remotePdfPath, localPdfPath);
    //             if(email?.email && pdfDownload){
    //                 const mailOptions : MailOptionsWithFile = {
    //                     message: {
    //                         subject: `Sua Fatura Vence Hoje!`,
    //                         body: {
    //                             contentType: "HTML",
    //                             content: html_msg
    //                         },
    //                         toRecipients: [
    //                             {
    //                                 emailAddress: {
    //                                     address: String(email.email)
    //                                 }
    //                             }
    //                         ], 
    //                         attachments: [
    //                             {
    //                                 '@odata.type': '#microsoft.graph.fileAttachment',
    //                                 name: "Boleto.pdf",
    //                                 contentType: 'application/pdf',
    //                                 contentBytes: getBase64File(localPdfPath)
    //                             }
    //                         ]
    //                     },
    //                     saveToSentItems: "true"
    //                 }
    //                 console.log(mailOptions);
    //                 try {
    //                     addEmailToQueue(mailOptions);
    //                 } catch (error) {
    //                     console.log(error);
    //                     this.logError(error, email.email, client);
    //                 }
    //             }
    //             else if (email?.email) {
    //                 const mailOptions : MailOptions = {
    //                     message: {
    //                         subject: `Sua Fatura Vence Hoje!`,
    //                         body: {
    //                             contentType: "HTML",
    //                             content: html_msg
    //                         },
    //                         toRecipients: [
    //                             {
    //                                 emailAddress: {
    //                                     address: String(email.email)
    //                                 }
    //                             }
    //                         ], 
    //                     },
    //                     saveToSentItems: "true"
    //                 }
    //                 console.log(mailOptions);
    //                 try {
    //                     addEmailToQueue(mailOptions);
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
                // Caminho do PDF remoto no servidor FTP
                const ftpHost = String(process.env.HOST_FTP);
                const ftpUser = String(process.env.USERNAME_FTP); // ajuste com suas credenciais
                const ftpPassword = String(process.env.PASSWORD_FTP); // ajuste com suas credenciais
                const remotePdfPath = `${pdfPath}${idBoleto}.pdf`; // ajustado para o ID do cliente
                console.log("RemotePDF: " + remotePdfPath);
                const localPdfPath = path_1.default.join(__dirname, "..", "..", 'temp', `${idBoleto}.pdf`); // Caminho local temporário para salvar o PDF
                // Baixar o PDF do servidor FTP antes de enviar o e-mail
                const pdfDownload = await this.downloadPdfFromFtp(ftpHost, ftpUser, ftpPassword, remotePdfPath, localPdfPath);
                if (email?.email && pdfDownload) {
                    const mailOptions = {
                        message: {
                            subject: `Wip Telecom Boleto Mensalidade ${formattedDate}`,
                            body: {
                                contentType: "HTML",
                                content: html_msg
                            },
                            toRecipients: [
                                {
                                    emailAddress: {
                                        address: String(email.email)
                                    }
                                }
                            ],
                            attachments: [
                                {
                                    '@odata.type': '#microsoft.graph.fileAttachment',
                                    name: "Boleto.pdf",
                                    contentType: 'application/pdf',
                                    contentBytes: getBase64File(localPdfPath)
                                }
                            ]
                        },
                        saveToSentItems: "true"
                    };
                    // console.log(msg);
                    console.log(mailOptions);
                    try {
                        addEmailToQueue(mailOptions);
                    }
                    catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                }
                else if (email?.email) {
                    const mailOptions = {
                        message: {
                            subject: `Wip Telecom Boleto Mensalidade ${formattedDate}`,
                            body: {
                                contentType: "HTML",
                                content: html_msg
                            },
                            toRecipients: [
                                {
                                    emailAddress: {
                                        address: String(email.email)
                                    }
                                }
                            ],
                        },
                        saveToSentItems: "true"
                    };
                    console.log(mailOptions);
                    try {
                        addEmailToQueue(mailOptions);
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
                // Caminho do PDF remoto no servidor FTP
                const ftpHost = String(process.env.HOST_FTP);
                const ftpUser = String(process.env.USERNAME_FTP); // ajuste com suas credenciais
                const ftpPassword = String(process.env.PASSWORD_FTP); // ajuste com suas credenciais
                const remotePdfPath = `${pdfPath}${idBoleto}.pdf`; // ajustado para o ID do cliente
                console.log("RemotePDF: " + remotePdfPath);
                const localPdfPath = path_1.default.join(__dirname, "..", "..", 'temp', `${idBoleto}.pdf`); // Caminho local temporário para salvar o PDF
                // Baixar o PDF do servidor FTP antes de enviar o e-mail
                const pdfDownload = await this.downloadPdfFromFtp(ftpHost, ftpUser, ftpPassword, remotePdfPath, localPdfPath);
                if (email?.email && pdfDownload) {
                    const mailOptions = {
                        message: {
                            subject: `Sua Fatura Vence Hoje!`,
                            body: {
                                contentType: "HTML",
                                content: html_msg
                            },
                            toRecipients: [
                                {
                                    emailAddress: {
                                        address: String(email.email)
                                    }
                                }
                            ],
                            attachments: [
                                {
                                    '@odata.type': '#microsoft.graph.fileAttachment',
                                    name: "Boleto.pdf",
                                    contentType: 'application/pdf',
                                    contentBytes: getBase64File(localPdfPath)
                                }
                            ]
                        },
                        saveToSentItems: "true"
                    };
                    // console.log(msg);
                    console.log(mailOptions);
                    try {
                        addEmailToQueue(mailOptions);
                    }
                    catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                }
                else if (email?.email) {
                    // console.log(msg);
                    const mailOptions = {
                        message: {
                            subject: `Sua Fatura Vence Hoje!`,
                            body: {
                                contentType: "HTML",
                                content: html_msg
                            },
                            toRecipients: [
                                {
                                    emailAddress: {
                                        address: String(email.email)
                                    }
                                }
                            ],
                        },
                        saveToSentItems: "true"
                    };
                    console.log(mailOptions);
                    try {
                        addEmailToQueue(mailOptions);
                        this.logSend(email.email, client);
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
