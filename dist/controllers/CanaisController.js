"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ds_canais_1 = require("../database/ds_canais");
const Canais_1 = require("../entities/Canais");
class CanaisController {
    async getCanais(req, res) {
        const RepositoryCanais = ds_canais_1.AppDataSource.getRepository(Canais_1.Canais);
        const canais = await RepositoryCanais.find();
        return res.json(canais);
    }
}
exports.default = new CanaisController();
