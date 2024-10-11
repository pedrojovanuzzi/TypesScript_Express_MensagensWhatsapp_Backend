import cron from "node-cron";
import { Request, Response } from "express";
import { Record } from "../entities/Record";
import { Pix } from "../entities/Pix";
import { User } from "../entities/User";
import { AppDataSource } from "../database/ds";
import { format, getDay, getMonth } from "date-fns";
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


cron.schedule('0 8 * * *', () => {
    console.log('RUNNING CRONTAB BEFORE 5 DAYS');
    emailController.DiasAntes5();
});
cron.schedule('16 9 * * *', () => {
    console.log('RUNNING CRONTAB THE DAY');
    emailController.DiasDoVencimento();
});

// cron.schedule('*/1 * * * *', () => {
//     console.log('RUNNING CRONTAB TEST');
//     emailController.TesteEmail();
// })

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
            console.log(`Arquivo encontrado no servidor: ${remoteFilePath}`);
            await client.fastGet(remoteFilePath, localFilePath);
            console.log("PDF baixado com sucesso via SFTP");
            return true;
        } else {
            console.error(`Arquivo não encontrado no servidor: ${remoteFilePath}`);
            return false;
        }
        } catch (error) {
            console.error("Erro ao baixar o PDF via SFTP: ", error);
            return false;
        } finally {
            client.end();
        }
      }
      
    async TesteEmail() {
        const date = new Date();
        const anoAtual = date.getFullYear(); // Obtém o ano atual
        const MesDeHoje = date.getMonth() + 1; // getMonth retorna de 0 a 11, então adicionamos 1
        const diaHoje = date.getDate(); // getDate retorna o dia do mês
        const diaVencimento = diaHoje;
    
        
        
    
        const resultados = AppDataSource.getRepository(Record);
        const clientes = await resultados.find({
            where: {
                datavenc: Raw(alias => `(YEAR(${alias}) = ${anoAtual} AND MONTH(${alias}) = ${MesDeHoje} AND DAY(${alias}) = ${diaVencimento})`),
                datadel: Raw(alias => `${alias} IS NULL`),
                status: Raw(alias => `${alias} != 'pago'`),
                login: "PEDROJOVANUZZI"
            }
        });
        console.log(clientes);
    
        for (const client of clientes){
            try {
                let msg = "";
    
                const idBoleto = client.uuid_lanc;
    
                const pix_resultados = AppDataSource.getRepository(Pix);
                const pix = await pix_resultados.findOne({ where: { titulo: idBoleto } });
                
                const dateObject = new Date(client.datavenc);
                const dateString = dateObject.toISOString().split('T')[0]; // Saída: '11/10/2024'
                const [year, month, day] = dateString.split('-');
                const formattedDate = `${day}/${month}/${year}`; 
    
                console.log("\nData de Vencimento: " + formattedDate);

                const pppoe = client.login;
    
                const clientesRepo = AppDataSource.getRepository(User);
                const email = await clientesRepo.findOne({ where: { login: pppoe, cli_ativado: "s" } });
    
                const html_msg = this.msg(msg, formattedDate, pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero);
    
                // Caminho do PDF remoto no servidor FTP
                const ftpHost = String(process.env.HOST_FTP);
                const ftpUser = String(process.env.USERNAME_FTP); // ajuste com suas credenciais
                const ftpPassword = String(process.env.PASSWORD_FTP); // ajuste com suas credenciais
                const remotePdfPath = `${pdfPath}${idBoleto}.pdf`; // ajustado para o ID do cliente
                
                
                const localPdfPath = path.join(__dirname, ".." , "..", 'temp', `${idBoleto}.pdf`); // Caminho local temporário para salvar o PDF

                // Baixar o PDF do servidor FTP antes de enviar o e-mail
                const pdfDownload = await this.downloadPdfFromFtp(ftpHost, ftpUser, ftpPassword, remotePdfPath, localPdfPath);
    
                if(email?.email && pdfDownload){
                    
                        const mailOptions = {
                        from: process.env.MAILGUNNER_USER,
                        to: String(email.email),
                        subject: `Sua Fatura Vence Hoje ${pppoe.toUpperCase()}`,
                        html: html_msg,
                        attachments: [
                            {
                                filename: 'Boleto.pdf',
                                path: localPdfPath // Especifica o caminho local do PDF baixado
                            }
                        ]
                    };
    
                    
    
                    try {
                        await transporter.sendMail(mailOptions);
                    } catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
                }
                else if (email?.email) {
                    const mailOptions = {
                        from: process.env.MAILGUNNER_USER,
                        to: String(email.email),
                        subject: `Wip Telecom Boleto Mensalidade ${formattedDate}`,
                        html: html_msg,
                    };
    
                    
    
                    try {
                        await transporter.sendMail(mailOptions);
                    } catch (error) {
                        console.log(error);
                        this.logError(error, email.email, client);
                    }
    
                    // Após enviar o e-mail, deletar o arquivo local temporário
                    fs.unlinkSync(localPdfPath);
                } else {
                    console.log("Sem Email Cadastrado");
                    this.logError("Sem Email Cadastrado", "Email", client);
                }
            } catch (error) {
                console.log(error);
                this.logError(error, "N/A", client);
            }
        };
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
    
            await sleep(36000); // Pausa de 36 segundos
        }

        

    }

    async DiasAntes5() {
        const date = new Date();
        const anoAtual = date.getFullYear(); // Obtém o ano atual
        const MesDeHoje = date.getMonth() + 1; // getMonth retorna de 0 a 11, então adicionamos 1
        const diaHoje = date.getDate(); // getDate retorna o dia do mês
        const diaVencimento = diaHoje + 5;
        

        
        
        

        const resultados = AppDataSource.getRepository(Record);
        const clientes = await resultados.find({
            //Alias representa o resultado da data da coluna
            where: {
                datavenc: Raw(alias => `(YEAR(${alias}) = ${anoAtual} AND MONTH(${alias}) = ${MesDeHoje} AND DAY(${alias}) = ${diaVencimento})`),
                datadel: Raw(alias => `${alias} IS NULL`),
                status: Raw(alias => `${alias} != 'pago'`)
            }
        });
        
        console.log("Quantidade de Clientes: " + clientes.length);
        

        for (const client of clientes) {
            try {
            let msg = "";
            
            const idBoleto = client.uuid_lanc; 
            
            const pix_resultados = AppDataSource.getRepository(Pix);
            const pix = await pix_resultados.findOne({where: {titulo: idBoleto}});
            

            const dateObject = new Date(client.datavenc);
            const dateString = dateObject.toISOString().split('T')[0]; // Saída: '11/10/2024'
            const [year, month, day] = dateString.split('-');
            const formattedDate = `${day}/${month}/${year}`; 

            console.log("\nData de Vencimento: " + formattedDate);
            
            
            const pppoe = client.login;
            
            const clientes = AppDataSource.getRepository(User);

            const email = await clientes.findOne({where: {login: pppoe , cli_ativado: "s"}});
            

            const html_msg = this.msg(msg,formattedDate,pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero);

            // Caminho do PDF remoto no servidor FTP
            const ftpHost = String(process.env.HOST_FTP);
            const ftpUser = String(process.env.USERNAME_FTP); // ajuste com suas credenciais
            const ftpPassword = String(process.env.PASSWORD_FTP); // ajuste com suas credenciais
            const remotePdfPath = `${pdfPath}${idBoleto}.pdf`; // ajustado para o ID do cliente
            
            
            const localPdfPath = path.join(__dirname, ".." , "..", 'temp', `${idBoleto}.pdf`); // Caminho local temporário para salvar o PDF

            // Baixar o PDF do servidor FTP antes de enviar o e-mail
            const pdfDownload = await this.downloadPdfFromFtp(ftpHost, ftpUser, ftpPassword, remotePdfPath, localPdfPath);


            if(email?.email && pdfDownload){

                const mailOptions = {
                    from: process.env.MAILGUNNER_USER,
                    to: String(email.email),
                    subject: `Wip Telecom Boleto Mensalidade ${formattedDate}`,
                    html: html_msg,
                    attachments: [
                        {
                            filename: 'Boleto.pdf',
                            path: localPdfPath // Especifica o caminho local do PDF baixado
                        }
                    ]
                };
                
                

                

                try {
                    transporter.sendMail(mailOptions);
                } catch (error) {
                    console.log(error);
                    this.logError(error, email.email, client);
                }
            }
            else if(email?.email){
                
                const mailOptions = {
                    from: process.env.MAILGUNNER_USER,
                    to: String(email.email),
                    subject: `Wip Telecom Boleto Mensalidade ${formattedDate}`,
                    html: html_msg,
                };

                

                try {
                    transporter.sendMail(mailOptions);
                    this.logSend(email.email, client);
                } catch (error) {
                    console.log(error);
                    this.logError(error, email.email, client);
                }
            }
            else{
                console.log("Sem Email Cadastrado");
                this.logError("Sem Email Cadastrado", "Email", client);
            }

            await sleep(36000);

            } catch (error) {
                console.log(error);
                this.logError(error, "N/A", client);
            }

            
            
        }
        
    }

    async DiasDoVencimento() {
        const date = new Date();
        const anoAtual = date.getFullYear(); // Obtém o ano atual
        const MesDeHoje = date.getMonth() + 1; // getMonth retorna de 0 a 11, então adicionamos 1
        const diaHoje = date.getDate(); // getDate retorna o dia do mês
        const diaVencimento = diaHoje;
        

        
        
        

        const resultados = AppDataSource.getRepository(Record);
        const clientes = await resultados.find({
            //Alias representa o resultado da data da coluna
            where: {
                datavenc: Raw(alias => `(YEAR(${alias}) = ${anoAtual} AND MONTH(${alias}) = ${MesDeHoje} AND DAY(${alias}) = ${diaVencimento})`),
                datadel: Raw(alias => `${alias} IS NULL`),
                status: Raw(alias => `${alias} != 'pago'`)
            }
        });
        
        console.log("Quantidade de Clientes: " + clientes.length);

        for(const client of clientes){
            try {
                let msg = "";

            
            const idBoleto = client.uuid_lanc; 
            
            const pix_resultados = AppDataSource.getRepository(Pix);
            const pix = await pix_resultados.findOne({where: {titulo: idBoleto}});
            

            const dateObject = new Date(client.datavenc);
            const dateString = dateObject.toISOString().split('T')[0]; // Saída: '11/10/2024'
            const [year, month, day] = dateString.split('-');
            const formattedDate = `${day}/${month}/${year}`; 

            console.log("\nData de Vencimento: " + formattedDate);

            const pppoe = client.login;
            
            const clientes = AppDataSource.getRepository(User);

            const email = await clientes.findOne({where: {login: pppoe , cli_ativado: "s"}});

            const html_msg = this.msg(msg,formattedDate,pppoe, client.linhadig, pix?.qrcode, email?.endereco, email?.numero);

            // Caminho do PDF remoto no servidor FTP
            const ftpHost = String(process.env.HOST_FTP);
            const ftpUser = String(process.env.USERNAME_FTP); // ajuste com suas credenciais
            const ftpPassword = String(process.env.PASSWORD_FTP); // ajuste com suas credenciais
            const remotePdfPath = `${pdfPath}${idBoleto}.pdf`; // ajustado para o ID do cliente
            
            
            const localPdfPath = path.join(__dirname, ".." , "..", 'temp', `${idBoleto}.pdf`); // Caminho local temporário para salvar o PDF

            // Baixar o PDF do servidor FTP antes de enviar o e-mail
            const pdfDownload = await this.downloadPdfFromFtp(ftpHost, ftpUser, ftpPassword, remotePdfPath, localPdfPath);

            if(email?.email && pdfDownload){
                const mailOptions = {
                    from: process.env.MAILGUNNER_USER,
                    to: String(email.email),
                    subject: `Sua Fatura Vence Hoje ${pppoe.toUpperCase()}`,
                    html: html_msg,
                    attachments: [
                        {
                            filename: 'Boleto.pdf',
                            path: localPdfPath // Especifica o caminho local do PDF baixado
                        }
                    ]
                };
                
                

                

                try {
                    transporter.sendMail(mailOptions); 
                } catch (error) {
                    console.log(error);
                    this.logError(error, email.email, client);
                }
            }
            else if(email?.email){
                
                const mailOptions = {
                    from: process.env.MAILGUNNER_USER,
                    to: String(email.email),
                    subject: `Sua Fatura Vence Hoje ${pppoe.toUpperCase()}`,
                    html: html_msg,
                };

                
                

                try {
                    transporter.sendMail(mailOptions); 
                    this.logSend(email.email, client);
                    
                } catch (error) {
                    // console.log(error);
                    this.logError(error, email?.email, client);
                }
            }
            else{
                console.log("Sem Email Cadastrado");
                this.logError("Sem Email Cadastrado", "Email", client);
            }

            await sleep(36000);
            } catch (error) {
                // console.log(error);
                this.logError(error, "N/A", client);
            }       
        }
        
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
