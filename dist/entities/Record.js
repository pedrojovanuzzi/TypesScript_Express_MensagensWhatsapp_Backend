"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Record = void 0;
const typeorm_1 = require("typeorm");
let Record = class Record {
};
exports.Record = Record;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Record.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Record.prototype, "datavenc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "nossonum", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Record.prototype, "datapag", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, unique: true }),
    __metadata("design:type", String)
], Record.prototype, "recibo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, default: 'aberto' }),
    __metadata("design:type", String)
], Record.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "login", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 8, nullable: true, default: '5307' }),
    __metadata("design:type", String)
], Record.prototype, "cfop_lanc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "obs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Record.prototype, "processamento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, nullable: true, default: 'nao' }),
    __metadata("design:type", String)
], Record.prototype, "aviso", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "usergerou", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true, default: 'completo' }),
    __metadata("design:type", String)
], Record.prototype, "valorger", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "coletor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "linhadig", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "valor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "valorpag", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "gwt_numero", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['sim', 'nao'], default: 'nao' }),
    __metadata("design:type", String)
], Record.prototype, "imp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 8, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "referencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['fat', 'car'], default: 'fat' }),
    __metadata("design:type", String)
], Record.prototype, "tipocob", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "codigo_carne", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "chave_gnet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "chave_gnet2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "chave_juno", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "chave_galaxpay", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "chave_iugu", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Record.prototype, "numconta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Record.prototype, "gerourem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Record.prototype, "remvalor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Record.prototype, "remdata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "formapag", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "fcartaobandeira", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "fcartaonumero", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "fchequenumero", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "fchequebanco", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "fchequeagcc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Record.prototype, "percmulta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Record.prototype, "valormulta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Record.prototype, "percmora", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Record.prototype, "valormora", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Record.prototype, "percdesc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Record.prototype, "valordesc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Record.prototype, "deltitulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Record.prototype, "datadel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Record.prototype, "num_recibos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Record.prototype, "num_retornos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Record.prototype, "alt_venc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, nullable: true }),
    __metadata("design:type", String)
], Record.prototype, "uuid_lanc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Record.prototype, "tarifa_paga", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true, unique: true }),
    __metadata("design:type", String)
], Record.prototype, "id_empresa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Record.prototype, "oco01", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Record.prototype, "oco02", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Record.prototype, "oco06", void 0);
exports.Record = Record = __decorate([
    (0, typeorm_1.Entity)({ name: 'sis_lanc' }) // Substitua pelo nome da sua tabela
], Record);
