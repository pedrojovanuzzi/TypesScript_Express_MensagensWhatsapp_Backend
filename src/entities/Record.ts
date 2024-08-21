import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sis_lanc' }) // Substitua pelo nome da sua tabela
export class Record {
  @PrimaryGeneratedColumn()
    id!: number;

  @Column({ type: 'date', nullable: true })
    datavenc!: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
    nossonum!: string;

  @Column({ type: 'date', nullable: true })
    datapag!: Date;

  @Column({ type: 'varchar', length: 16, nullable: true })
    nome!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
    recibo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'aberto' })
    status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
    login!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
    tipo!: string;

  @Column({ type: 'varchar', length: 8, nullable: true, default: '5307' })
    cfop_lanc!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
    obs!: string;

  @Column({ type: 'date', nullable: true })
    processamento!: Date;

  @Column({ type: 'varchar', length: 3, nullable: true, default: 'nao' })
    aviso!: string;

  @Column({ type: 'text', nullable: true })
    url!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
    usergerou!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, default: 'completo' })
    valorger!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
    coletor!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
    linhadig!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
    valor!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
    valorpag!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
    gwt_numero!: string;

  @Column({ type: 'enum', enum: ['sim', 'nao'], default: 'nao' })
    imp!: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
    referencia!: string;

  @Column({ type: 'enum', enum: ['fat', 'car'], default: 'fat' })
    tipocob!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
    codigo_carne!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
    chave_gnet!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
    chave_gnet2!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
    chave_juno!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
    chave_galaxpay!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
    chave_iugu!: string;

  @Column({ type: 'int', nullable: true })
    numconta!: number;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
    gerourem!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 })
    remvalor!: number;

  @Column({ type: 'date', nullable: true })
    remdata!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
    formapag!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
    fcartaobandeira!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
    fcartaonumero!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
    fchequenumero!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
    fchequebanco!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
    fchequeagcc!: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, default: 0.00 })
    percmulta!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 })
    valormulta!: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, default: 0.00 })
    percmora!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 })
    valormora!: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, default: 0.00 })
    percdesc!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 })
    valordesc!: number;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
    deltitulo!: number;

  @Column({ type: 'date', nullable: true })
    datadel!: Date;

  @Column({ type: 'int', nullable: true, default: 0 })
    num_recibos!: number;

  @Column({ type: 'int', nullable: true, default: 0 })
    num_retornos!: number;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
    alt_venc!: number;

  @Column({ type: 'varchar', length: 48, nullable: true })
    uuid_lanc!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 })
    tarifa_paga!: number;

  @Column({ type: 'varchar', length: 16, nullable: true, unique: true })
    id_empresa!: string;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
    oco01!: number;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
    oco02!: number;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
    oco06!: number;

}
