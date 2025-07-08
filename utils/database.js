const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Gerenciador de banco de dados JSON
 * Sistema simples para gerenciar dados em arquivos JSON
 */
class JSONDatabase {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.ensureDataDirectory();
        this.cache = new Map();
    }

    /**
     * Garante que o diretório de dados existe
     */
    ensureDataDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Obtém o caminho do arquivo de dados
     * @param {string} collection - Nome da coleção
     * @returns {string} - Caminho do arquivo
     */
    getFilePath(collection) {
        return path.join(this.dataDir, `${collection}.json`);
    }

    /**
     * Carrega dados de uma coleção
     * @param {string} collection - Nome da coleção
     * @returns {Object} - Dados da coleção
     */
    load(collection) {
        try {
            const filePath = this.getFilePath(collection);
            
            if (!fs.existsSync(filePath)) {
                return {};
            }

            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            this.cache.set(collection, data);
            return data;
        } catch (error) {
            logger.error(`Erro ao carregar coleção ${collection}`, error);
            return {};
        }
    }

    /**
     * Salva dados de uma coleção
     * @param {string} collection - Nome da coleção
     * @param {Object} data - Dados para salvar
     * @returns {boolean} - Sucesso da operação
     */
    save(collection, data) {
        try {
            const filePath = this.getFilePath(collection);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            this.cache.set(collection, data);
            return true;
        } catch (error) {
            logger.error(`Erro ao salvar coleção ${collection}`, error);
            return false;
        }
    }

    /**
     * Obtém dados de uma coleção (com cache)
     * @param {string} collection - Nome da coleção
     * @returns {Object} - Dados da coleção
     */
    get(collection) {
        if (this.cache.has(collection)) {
            return this.cache.get(collection);
        }
        return this.load(collection);
    }

    /**
     * Adiciona item a uma coleção
     * @param {string} collection - Nome da coleção
     * @param {string} id - ID do item
     * @param {Object} item - Item para adicionar
     * @returns {boolean} - Sucesso da operação
     */
    add(collection, id, item) {
        try {
            const data = this.get(collection);
            data[id] = { ...item, id, createdAt: new Date().toISOString() };
            return this.save(collection, data);
        } catch (error) {
            logger.error(`Erro ao adicionar item em ${collection}`, error);
            return false;
        }
    }

    /**
     * Atualiza item em uma coleção
     * @param {string} collection - Nome da coleção
     * @param {string} id - ID do item
     * @param {Object} updates - Atualizações
     * @returns {boolean} - Sucesso da operação
     */
    update(collection, id, updates) {
        try {
            const data = this.get(collection);
            
            if (!data[id]) {
                return false;
            }

            data[id] = { ...data[id], ...updates, updatedAt: new Date().toISOString() };
            return this.save(collection, data);
        } catch (error) {
            logger.error(`Erro ao atualizar item em ${collection}`, error);
            return false;
        }
    }

    /**
     * Remove item de uma coleção
     * @param {string} collection - Nome da coleção
     * @param {string} id - ID do item
     * @returns {boolean} - Sucesso da operação
     */
    remove(collection, id) {
        try {
            const data = this.get(collection);
            
            if (!data[id]) {
                return false;
            }

            delete data[id];
            return this.save(collection, data);
        } catch (error) {
            logger.error(`Erro ao remover item em ${collection}`, error);
            return false;
        }
    }

    /**
     * Busca itens em uma coleção
     * @param {string} collection - Nome da coleção
     * @param {Function} predicate - Função de filtro
     * @returns {Array} - Itens encontrados
     */
    find(collection, predicate) {
        try {
            const data = this.get(collection);
            return Object.values(data).filter(predicate);
        } catch (error) {
            logger.error(`Erro ao buscar itens em ${collection}`, error);
            return [];
        }
    }

    /**
     * Busca um item em uma coleção
     * @param {string} collection - Nome da coleção
     * @param {Function} predicate - Função de filtro
     * @returns {Object|null} - Item encontrado
     */
    findOne(collection, predicate) {
        try {
            const data = this.get(collection);
            return Object.values(data).find(predicate) || null;
        } catch (error) {
            logger.error(`Erro ao buscar item em ${collection}`, error);
            return null;
        }
    }

    /**
     * Conta itens em uma coleção
     * @param {string} collection - Nome da coleção
     * @param {Function} predicate - Função de filtro (opcional)
     * @returns {number} - Número de itens
     */
    count(collection, predicate = null) {
        try {
            const data = this.get(collection);
            const items = Object.values(data);
            
            if (predicate) {
                return items.filter(predicate).length;
            }
            
            return items.length;
        } catch (error) {
            logger.error(`Erro ao contar itens em ${collection}`, error);
            return 0;
        }
    }

    /**
     * Limpa uma coleção
     * @param {string} collection - Nome da coleção
     * @returns {boolean} - Sucesso da operação
     */
    clear(collection) {
        try {
            return this.save(collection, {});
        } catch (error) {
            logger.error(`Erro ao limpar coleção ${collection}`, error);
            return false;
        }
    }

    /**
     * Cria backup de uma coleção
     * @param {string} collection - Nome da coleção
     * @returns {string} - Caminho do backup
     */
    backup(collection) {
        try {
            const filePath = this.getFilePath(collection);
            
            if (!fs.existsSync(filePath)) {
                throw new Error('Coleção não encontrada');
            }

            const backupPath = `${filePath}.backup.${Date.now()}`;
            fs.copyFileSync(filePath, backupPath);
            
            logger.system('INFO', `Backup criado para ${collection}: ${backupPath}`);
            return backupPath;
        } catch (error) {
            logger.error(`Erro ao criar backup de ${collection}`, error);
            throw error;
        }
    }

    /**
     * Restaura backup de uma coleção
     * @param {string} collection - Nome da coleção
     * @param {string} backupPath - Caminho do backup
     * @returns {boolean} - Sucesso da operação
     */
    restore(collection, backupPath) {
        try {
            if (!fs.existsSync(backupPath)) {
                throw new Error('Arquivo de backup não encontrado');
            }

            const filePath = this.getFilePath(collection);
            fs.copyFileSync(backupPath, filePath);
            
            // Limpar cache
            this.cache.delete(collection);
            
            logger.system('INFO', `Backup restaurado para ${collection}`);
            return true;
        } catch (error) {
            logger.error(`Erro ao restaurar backup de ${collection}`, error);
            return false;
        }
    }

    /**
     * Obtém estatísticas de uma coleção
     * @param {string} collection - Nome da coleção
     * @returns {Object} - Estatísticas
     */
    getStats(collection) {
        try {
            const data = this.get(collection);
            const items = Object.values(data);
            
            const stats = {
                total: items.length,
                size: JSON.stringify(data).length,
                oldest: null,
                newest: null
            };

            if (items.length > 0) {
                const sorted = items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                stats.oldest = sorted[0].createdAt;
                stats.newest = sorted[sorted.length - 1].createdAt;
            }

            return stats;
        } catch (error) {
            logger.error(`Erro ao obter estatísticas de ${collection}`, error);
            return {
                total: 0,
                size: 0,
                oldest: null,
                newest: null
            };
        }
    }

    /**
     * Lista todas as coleções
     * @returns {Array} - Nomes das coleções
     */
    listCollections() {
        try {
            const files = fs.readdirSync(this.dataDir);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));
        } catch (error) {
            logger.error('Erro ao listar coleções', error);
            return [];
        }
    }

    /**
     * Remove uma coleção
     * @param {string} collection - Nome da coleção
     * @returns {boolean} - Sucesso da operação
     */
    dropCollection(collection) {
        try {
            const filePath = this.getFilePath(collection);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            this.cache.delete(collection);
            logger.system('INFO', `Coleção ${collection} removida`);
            return true;
        } catch (error) {
            logger.error(`Erro ao remover coleção ${collection}`, error);
            return false;
        }
    }

    /**
     * Limpa cache
     */
    clearCache() {
        this.cache.clear();
        logger.system('INFO', 'Cache do banco de dados limpo');
    }

    /**
     * Executa operação em lote
     * @param {string} collection - Nome da coleção
     * @param {Array} operations - Operações para executar
     * @returns {boolean} - Sucesso da operação
     */
    batch(collection, operations) {
        try {
            const data = this.get(collection);
            
            for (const operation of operations) {
                const { type, id, item, updates } = operation;
                
                switch (type) {
                    case 'add':
                        data[id] = { ...item, id, createdAt: new Date().toISOString() };
                        break;
                    case 'update':
                        if (data[id]) {
                            data[id] = { ...data[id], ...updates, updatedAt: new Date().toISOString() };
                        }
                        break;
                    case 'remove':
                        delete data[id];
                        break;
                }
            }
            
            return this.save(collection, data);
        } catch (error) {
            logger.error(`Erro na operação em lote em ${collection}`, error);
            return false;
        }
    }
}

module.exports = new JSONDatabase();
