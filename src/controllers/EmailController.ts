import cron from "node-cron";
import { Request, Response } from "express";
import { Record } from "../entities/Record";
import { Pix } from "../entities/Pix";
import { User } from "../entities/User";
import { AppDataSourceBoleto } from "../database/ds2";
import { AppDataSourcePix } from "../database/ds3";
import { AppDataSource } from "../database/ds";
import { format, getDay, getMonth } from "date-fns";
import { Raw } from "typeorm";
import path from 'path';
import fs, { link } from "fs";
import nodemailer from 'nodemailer';




import dotenv from "dotenv";

dotenv.config();

cron.schedule('*/50 * * * * *', () => {
    console.log('running a task every minute');
    emailController.DiasAntes15();
});

const transporter = nodemailer.createTransport({
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

    async DiasAntes15() {
        const date = new Date();
        const MesDeHoje = date.getMonth() + 1; // getMonth retorna de 0 a 11, então adicionamos 1
        const diaHoje = date.getDate(); // getDate retorna o dia do mês
        const diaVencimento = diaHoje + 5;
        

        console.log(MesDeHoje);
        console.log(diaHoje);
        

        const resultados = AppDataSourceBoleto.getRepository(Record);
        const clientes = await resultados.find({
            //Alias representa o resultado da data da coluna
            where: {
                datavenc: Raw(alias => `(MONTH(${alias}) = ${MesDeHoje} AND DAY(${alias}) = ${diaVencimento})`),
                datadel: Raw(alias => `${alias} IS NULL`),
                status: Raw(alias => `${alias} != 'pago'`)
            }
        });
        // console.log(clientes);

        clientes.map(async (client : any) => {
            try {
            let msg = `${client.login.toUpperCase()} Segue a Linha Digitavel do seu Boleto da Mensalidade: \n`;
            msg += `${client.linhadig} \n`;
            
            const idBoleto = client.uuid_lanc; 
            
            const pix_resultados = AppDataSourcePix.getRepository(Pix);
            const pix = await pix_resultados.findOne({where: {titulo: idBoleto}});
            
            
            if (pix) {  // Verifica se pix e pix.qrcode existem
                msg += "\nSegue Codigo Copia e Cola do Pix: \n\n";
                msg += `${pix.qrcode}\n`;
            } 

            const pppoe = client.login;

            const clientes = AppDataSource.getRepository(User);

            const email = await clientes.findOne({where: {login: pppoe}});

            if(email){
                const mailOptions = {
                    from: process.env.EMAIL,
                    to: String(email.email),
                    subject: 'Wip Telecom Boleto Mensalidade',
                    text: msg,
                };
                // console.log(msg);

                console.log(mailOptions);

                try {
                    await transporter.sendMail(mailOptions);         
                } catch (error) {
                    console.log(error);
                }
            }
            else{
                console.log("Sem Email Cadastrado");
            }
            } catch (error) {
                console.log(error);
            }
        })

    }
}

const emailController = new EmailController();

export default emailController;
