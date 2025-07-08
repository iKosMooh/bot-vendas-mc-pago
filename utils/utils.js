const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Utilitários gerais para o bot
 */
class Utils {
    /**
     * Valida um Steam ID
     * @param {string} steamId - Steam ID para validar
     * @returns {boolean} - Se o Steam ID é válido
     */
    static isValidSteamId(steamId) {
        // Steam ID no formato STEAM_0:X:XXXXXXXX
        const steamIdRegex = /^STEAM_[0-5]:[01]:\d+$/;
        
        // Steam ID 64 bits
        const steamId64Regex = /^765611[0-9]{11}$/;
        
        return steamIdRegex.test(steamId) || steamId64Regex.test(steamId);
    }

    /**
     * Converte Steam ID para Steam ID 64
     * @param {string} steamId - Steam ID original
     * @returns {string} - Steam ID 64 bits
     */
    static steamIdTo64(steamId) {
        if (steamId.startsWith('STEAM_')) {
            const parts = steamId.split(':');
            const universe = parseInt(parts[0].split('_')[1]);
            const authServer = parseInt(parts[1]);
            const accountNumber = parseInt(parts[2]);
            
            const steamId64 = BigInt(76561197960265728) + BigInt(accountNumber * 2) + BigInt(authServer);
            return steamId64.toString();
        }
        
        return steamId; // Já é Steam ID 64
    }

    /**
     * Formata valor monetário
     * @param {number} value - Valor em reais
     * @returns {string} - Valor formatado
     */
    static formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Formata data
     * @param {Date|string} date - Data para formatar
     * @returns {string} - Data formatada
     */
    static formatDate(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Gera ID único
     * @param {string} prefix - Prefixo para o ID
     * @returns {string} - ID único
     */
    static generateUniqueId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 7);
        return `${prefix}${timestamp}${randomPart}`.toUpperCase();
    }

    /**
     * Gera hash MD5
     * @param {string} text - Texto para hash
     * @returns {string} - Hash MD5
     */
    static generateMD5(text) {
        return crypto.createHash('md5').update(text).digest('hex');
    }

    /**
     * Gera token aleatório
     * @param {number} length - Tamanho do token
     * @returns {string} - Token aleatório
     */
    static generateRandomToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Valida email
     * @param {string} email - Email para validar
     * @returns {boolean} - Se o email é válido
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida CPF
     * @param {string} cpf - CPF para validar
     * @returns {boolean} - Se o CPF é válido
     */
    static isValidCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }
        
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        
        let resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;
        
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        
        resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }

    /**
     * Sanitiza string para nome de arquivo
     * @param {string} filename - Nome do arquivo
     * @returns {string} - Nome sanitizado
     */
    static sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
    }

    /**
     * Calcula diferença entre datas
     * @param {Date|string} startDate - Data inicial
     * @param {Date|string} endDate - Data final
     * @returns {Object} - Diferença formatada
     */
    static calculateDateDiff(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffMs = end - start;
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return { days, hours, minutes, totalMs: diffMs };
    }

    /**
     * Formata bytes para formato legível
     * @param {number} bytes - Bytes para formatar
     * @returns {string} - Tamanho formatado
     */
    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Verifica se um arquivo existe
     * @param {string} filePath - Caminho do arquivo
     * @returns {boolean} - Se o arquivo existe
     */
    static fileExists(filePath) {
        return fs.existsSync(filePath);
    }

    /**
     * Cria backup de arquivo
     * @param {string} filePath - Caminho do arquivo
     * @returns {string} - Caminho do backup
     */
    static createBackup(filePath) {
        if (!this.fileExists(filePath)) {
            throw new Error('Arquivo não encontrado');
        }
        
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        return backupPath;
    }

    /**
     * Limpa backups antigos
     * @param {string} directory - Diretório para limpar
     * @param {number} days - Dias para manter
     */
    static cleanOldBackups(directory, days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const files = fs.readdirSync(directory);
        let deletedCount = 0;
        
        for (const file of files) {
            if (file.includes('.backup.')) {
                const filePath = path.join(directory, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }
        }
        
        return deletedCount;
    }

    /**
     * Trunca texto
     * @param {string} text - Texto para truncar
     * @param {number} length - Tamanho máximo
     * @returns {string} - Texto truncado
     */
    static truncateText(text, length = 100) {
        if (text.length <= length) return text;
        return text.substring(0, length - 3) + '...';
    }

    /**
     * Capitaliza primeira letra
     * @param {string} text - Texto para capitalizar
     * @returns {string} - Texto capitalizado
     */
    static capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    /**
     * Converte objeto para query string
     * @param {Object} obj - Objeto para converter
     * @returns {string} - Query string
     */
    static objectToQueryString(obj) {
        return Object.keys(obj)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
            .join('&');
    }

    /**
     * Faz sleep (delay)
     * @param {number} ms - Milissegundos para aguardar
     * @returns {Promise} - Promise que resolve após o delay
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry com backoff exponencial
     * @param {Function} fn - Função para executar
     * @param {number} maxRetries - Número máximo de tentativas
     * @param {number} delay - Delay inicial
     * @returns {Promise} - Resultado da função
     */
    static async retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await this.sleep(delay * Math.pow(2, i));
            }
        }
    }

    /**
     * Valida JSON
     * @param {string} jsonString - String JSON
     * @returns {boolean} - Se o JSON é válido
     */
    static isValidJSON(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtém informações do sistema
     * @returns {Object} - Informações do sistema
     */
    static getSystemInfo() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            pid: process.pid,
            cwd: process.cwd()
        };
    }

    /**
     * Valida URL
     * @param {string} url - URL para validar
     * @returns {boolean} - Se a URL é válida
     */
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Escapar caracteres especiais do regex
     * @param {string} string - String para escapar
     * @returns {string} - String escapada
     */
    static escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Carrega a configuração de channels do arquivo separado
     * @returns {Object} - Configuração de channels
     */
    static loadChannels() {
        const channelsPath = path.join(__dirname, '..', 'data', 'channels.json');
        
        if (!fs.existsSync(channelsPath)) {
            // Criar arquivo padrão se não existir
            const defaultChannels = {
                "logs": "ID_DO_CANAL_DE_LOGS",
                "tickets": "ID_DO_CANAL_DE_TICKETS", 
                "shop": "ID_DO_CANAL_DA_LOJA",
                "rcon": "ID_DO_CANAL_RCON"
            };
            
            fs.writeFileSync(channelsPath, JSON.stringify(defaultChannels, null, 2));
            console.log('✅ Arquivo channels.json criado em data/');
            return defaultChannels;
        }
        
        try {
            return JSON.parse(fs.readFileSync(channelsPath, 'utf8'));
        } catch (error) {
            console.error('❌ Erro ao carregar channels.json:', error);
            return {};
        }
    }

    /**
     * Salva a configuração de channels no arquivo separado
     * @param {Object} channels - Configuração de channels
     */
    static saveChannels(channels) {
        const channelsPath = path.join(__dirname, '..', 'data', 'channels.json');
        
        try {
            fs.writeFileSync(channelsPath, JSON.stringify(channels, null, 2));
            console.log('✅ Configuração de channels salva');
        } catch (error) {
            console.error('❌ Erro ao salvar channels.json:', error);
        }
    }
}

module.exports = Utils;
