import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tb_canais' }) // Substitua pelo nome da sua tabela
export class Canais {

    @PrimaryGeneratedColumn()
    idcanal!: number;

    @Column({ type: 'varchar', length: 255})
    canal!: string;

    @Column({ type: 'varchar', length: 400, nullable: true })
    url!: string;

    @Column({ type: 'varchar', length: 300, nullable: true })
    imagens!: string;

    @Column({ type: 'int', nullable: true })
    ativo!: string;

    @Column({ type: 'int', nullable: true })
    visualizacoes!: string;

    @Column({ type: 'tinyint', nullable: true })
    adulto!: string;
}