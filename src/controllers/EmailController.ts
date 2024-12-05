import cron from "node-cron";
import { Request, Response } from "express";
import { Record } from "../entities/Record";
import { Pix } from "../entities/Pix";
import { User } from "../entities/User";
import { AppDataSource } from "../database/ds";
import { format, subDays, addDays, getDay, getMonth, parseISO } from "date-fns";
import { Raw } from "typeorm";
import path from 'path';
import fs, { link } from "fs";
import nodemailer from 'nodemailer';
import SftpClient from 'ssh2-sftp-client';
import qs from "qs";
import axios from "axios";
import dotenv from "dotenv";
import Queue from 'bull';



dotenv.config();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const transporter = nodemailer.createTransport({
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


cron.schedule('0 16 * * *', () => {
    console.log('RUNNING CRONTAB BEFORE 10 DAYS');
    emailController.DiasAntes10();
});

cron.schedule('0 10 * * *', () => {
    console.log('RUNNING CRONTAB BEFORE 5 DAYS');
    emailController.DiasAntes5();
});

cron.schedule('0 0 * * *', () => {
    console.log('RUNNING CRONTAB THE DAY');
    emailController.DiasDoVencimento();
});

cron.schedule('*/1 * * * *', () => {
    console.log('RUNNING CRONTAB TEST');
    // emailController.TesteEmail();
    // emailController.TesteEmail5DiasAntes();
    // emailController.TesteEmail10DiasAntes();
})

// cron.schedule('30 8 * * *', () => {
//     console.log('RUNNING CRONTAB TEST');
//     emailController.TesteEmMassa();
// })


const pdfPath = '/opt/mk-auth/print_pdf/boletos/'; // Caminho do arquivo no sistema de arquivos



class EmailController {

    msg(msg : string, formattedDate : string, login : string, linhadig : string, pix : any, endereco : any, numero : any){

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

    async downloadPdfFromFtp(host: string, username: string, password: string, remoteFilePath: string, localFilePath: string) {
        const client = new SftpClient();
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
        } else {
            // console.error(`Arquivo não encontrado no servidor: ${remoteFilePath}`);
            return false;
        }
        } catch (error) {
            // console.error("Erro ao baixar o PDF via SFTP: ", error);
            return false;
        } finally {
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

    async TesteEmMassa(){
        const generateFakeEmails = (quantity: number) => {
            const fakeEmails = new Map<number, string>();
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
            } catch (error) {
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

    async processClients(diasAntes: number, opcionalMessage? : string) {
        const date = new Date();
        const dataAlvo = addDays(date, diasAntes);
        const anoAlvo = dataAlvo.getFullYear();
        const mesAlvo = dataAlvo.getMonth() + 1;
        const diaAlvo = dataAlvo.getDate();
    
        const resultados = AppDataSource.getRepository(Record);
        const clientes = await resultados.find({
            where: {
                datavenc: Raw(alias => `(YEAR(${alias}) = ${anoAlvo} AND MONTH(${alias}) = ${mesAlvo} AND DAY(${alias}) = ${diaAlvo})`),
                datadel: Raw(alias => `${alias} IS NULL`),
                status: Raw(alias => `${alias} != 'pago'`)
            }
        });
    
        console.log("Quantidade de Clientes: " + clientes.length);
        let remainingClients = clientes.length;
    
        for (const client of clientes) {
            try {
                let msg = "";
    
                const idBoleto = client.uuid_lanc;
                const pix_resultados = AppDataSource.getRepository(Pix);
                const pix = await pix_resultados.findOne({ where: { titulo: idBoleto } });
    
                const parsedDate = parseISO(String(client.datavenc));
                const formattedDate = format(parsedDate, 'dd/MM/yyyy');
                console.log("Cliente: " + client.login);
                console.log("\nData de Vencimento: " + formattedDate);
                remainingClients--;
                console.log("Clientes restantes: " + remainingClients);
    
                const pppoe = client.login;
                const clientesRepo = AppDataSource.getRepository(User);
                const email = await clientesRepo.findOne({ where: { login: pppoe, cli_ativado: "s" } });
    
                const html_msg = this.msg(msg, formattedDate, pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero);
    
                const ftpHost = String(process.env.HOST_FTP);
                const ftpUser = String(process.env.USERNAME_FTP);
                const ftpPassword = String(process.env.PASSWORD_FTP);
                const remotePdfPath = `${pdfPath}${idBoleto}.pdf`;
                const localPdfPath = path.join(__dirname, "..", "..", 'temp', `${idBoleto}.pdf`);
    
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
                    } catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                } else if (email?.email) {
                    const mailOptions = {
                        from: process.env.MAILGUNNER_USER,
                        to: String(email.email),
                        subject: `${opcionalMessage ? `${opcionalMessage} ${client.login}` : `Wip Telecom Boleto Mensalidade ${formattedDate}`} `,
                        html: html_msg,
                    };
    
                    try {
                        transporter.sendMail(mailOptions);
                        this.logSend(email.email, client);
                    } catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                } else {
                    console.log("Sem Email Cadastrado");
                    this.logError("Sem Email Cadastrado", "Email", client);
                }
    
                await sleep(50000);
    
            } catch (error) {
                console.log(error);
                this.logError(error, "N/A", client);
            }
        }
    
        console.log(`Finalizado Crontab ${diasAntes} Dias Antes`);
    }

    async processTestClients(diasAntes: number, opcionalMessage? : string) {
        const date = new Date();
        const dataAlvo = addDays(date, diasAntes);
        const anoAlvo = dataAlvo.getFullYear();
        const mesAlvo = dataAlvo.getMonth() + 1;
        const diaAlvo = dataAlvo.getDate();
    
        const resultados = AppDataSource.getRepository(Record);
        const clientes = await resultados.find({
            where: {
                datavenc: Raw(alias => `(YEAR(${alias}) = ${anoAlvo} AND MONTH(${alias}) = ${mesAlvo} AND DAY(${alias}) = ${diaAlvo})`),
                datadel: Raw(alias => `${alias} IS NULL`),
                status: Raw(alias => `${alias} != 'pago'`),
                login: "PEDROJOVANUZZI"
            }
        });
    
        console.log("Quantidade de Clientes: " + clientes.length);
        let remainingClients = clientes.length;
    
        for (const client of clientes) {
            try {
                let msg = "";
    
                const idBoleto = client.uuid_lanc;
                const pix_resultados = AppDataSource.getRepository(Pix);
                const pix = await pix_resultados.findOne({ where: { titulo: idBoleto } });
    
                const parsedDate = parseISO(String(client.datavenc));
                const formattedDate = format(parsedDate, 'dd/MM/yyyy');
                console.log("Cliente: " + client.login);
                console.log("\nData de Vencimento: " + formattedDate);
                remainingClients--;
                console.log("Clientes restantes: " + remainingClients);
    
                const pppoe = client.login;
                const clientesRepo = AppDataSource.getRepository(User);
                const email = await clientesRepo.findOne({ where: { login: pppoe, cli_ativado: "s" } });
    
                const html_msg = this.msg(msg, formattedDate, pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero);
    
                const ftpHost = String(process.env.HOST_FTP);
                const ftpUser = String(process.env.USERNAME_FTP);
                const ftpPassword = String(process.env.PASSWORD_FTP);
                const remotePdfPath = `${pdfPath}${idBoleto}.pdf`;
                const localPdfPath = path.join(__dirname, "..", "..", 'temp', `${idBoleto}.pdf`);
    
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
                    } catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                } else if (email?.email) {
                    const mailOptions = {
                        from: process.env.MAILGUNNER_USER,
                        to: String(email.email),
                        subject: `${opcionalMessage ? `${opcionalMessage} ${client.login}` : `Wip Telecom Boleto Mensalidade ${formattedDate}`} `,
                        html: html_msg,
                    };
    
                    try {
                        transporter.sendMail(mailOptions);
                        this.logSend(email.email, client);
                    } catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                } else {
                    console.log("Sem Email Cadastrado");
                    this.logError("Sem Email Cadastrado", "Email", client);
                }
    
                await sleep(50000);
    
            } catch (error) {
                console.log(error);
                this.logError(error, "N/A", client);
            }
        }
    
        console.log(`Finalizado Crontab ${diasAntes} Dias Antes`);
    }
    

    logError(error: any, email: string, cliente: any) {
        const logFilePath = path.join(__dirname, '../../logs/EmailLogs.json');
    
        // Verificar se o arquivo existe e não está vazio
        let logs = [];
        if (fs.existsSync(logFilePath)) {
            const logFileData = fs.readFileSync(logFilePath, 'utf8');
            if (logFileData.trim()) {  // Verifica se o arquivo não está vazio
                try {
                    logs = JSON.parse(logFileData);
                } catch (parseError) {
                    console.error("Erro ao fazer parse do JSON:", parseError);
                    logs = [];  // Se o JSON estiver corrompido, recomeça com um array vazio
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
        fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    }

    logSend(email: string, cliente: any) {
        const logFilePath = path.join(__dirname, '../../logs/SendLogs.json');
    
        // Verificar se o arquivo existe e não está vazio
        let logs = [];
        if (fs.existsSync(logFilePath)) {
            const logFileData = fs.readFileSync(logFilePath, 'utf8');
            if (logFileData.trim()) {  // Verifica se o arquivo não está vazio
                try {
                    logs = JSON.parse(logFileData);
                } catch (parseError) {
                    console.error("Erro ao fazer parse do JSON:", parseError);
                    logs = [];  // Se o JSON estiver corrompido, recomeça com um array vazio
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
        fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    }

}



const emailController = new EmailController();

export default emailController;
