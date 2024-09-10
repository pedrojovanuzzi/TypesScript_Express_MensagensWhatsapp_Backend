"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ds_canais_1 = require("../database/ds_canais");
const Canais_1 = require("../entities/Canais");
class CanaisController {
    async getCanais(req, res) {
        const RepositoryCanais = ds_canais_1.AppDataSource.getRepository(Canais_1.Canais);
        try {
            // Recupera os canais do banco de dados
            const canais = await RepositoryCanais.find({ where: { ativo: "1" } });
            // Gera o conteúdo no formato m3u8
            let m3u8Content = '#EXTM3U\n';
            canais.forEach((canal) => {
                m3u8Content += `#EXTINF:-1, ${canal.canal}\n`; // Nome do canal
                m3u8Content += `${canal.url}\n`; // URL do canal (ajuste conforme sua estrutura)
            });
            // Define o cabeçalho para forçar o download como um arquivo m3u8
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Content-Disposition', 'attachment; filename="playlist.m3u8"');
            // Envia o conteúdo m3u8 como um arquivo
            return res.send(m3u8Content);
        }
        catch (error) {
            console.error('Erro ao obter canais:', error);
            return res.status(500).send('Erro ao obter canais.');
        }
    }
}
exports.default = new CanaisController();
