import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sis_qrpix' }) // Substitua pelo nome da sua tabela
export class Pix {

    @PrimaryGeneratedColumn()
    titulo!: string;  // Definindo uma chave primária para a entidade

    @Column({ type: 'longtext', nullable: true })
    qrcode!: string;
}