const fs = require('fs');
const path = require('path');
const Utils = require('./utils');

/**
 * Sistema de logging para o bot
 */
class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, '..', 'logs');
        this.ensureLogsDirectory();
        this.channels = Utils.loadChannels();
    }

    /**
     * Garante que o diretório de logs existe
     */
    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    /**
     * Obtém o nome do arquivo de log baseado na data
     * @param {string} type - Tipo de log
     * @returns {string} - Caminho do arquivo
     */
    getLogFileName(type) {
        const today = new Date().toISOString().split('T')[0];
        return path.join(this.logsDir, `${type}_${today}.log`);
    }

    /**
     * Escreve log em arquivo
     * @param {string} type - Tipo de log
     * @param {string} level - Nível do log
     * @param {string} message - Mensagem
     * @param {Object} data - Dados adicionais
     */
    writeLog(type, level, message, data = null) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                data
            };

            const logLine = JSON.stringify(logEntry) + '\n';
            const logFile = this.getLogFileName(type);

            fs.appendFileSync(logFile, logLine);
        } catch (error) {
            console.error('❌ Erro ao escrever log:', error);
        }
    }

    /**
     * Log de pagamento
     * @param {string} level - Nível do log
     * @param {string} message - Mensagem
     * @param {Object} data - Dados do pagamento
     */
    payment(level, message, data) {
        this.writeLog('payment', level, message, data);
        console.log(`💳 [${level.toUpperCase()}] ${message}`);
    }

    /**
     * Log de compra
     * @param {string} level - Nível do log
     * @param {string} message - Mensagem
     * @param {Object} data - Dados da compra
     */
    purchase(level, message, data) {
        this.writeLog('purchase', level, message, data);
        console.log(`🛒 [${level.toUpperCase()}] ${message}`);
    }

    /**
     * Log de ticket
     * @param {string} level - Nível do log
     * @param {string} message - Mensagem
     * @param {Object} data - Dados do ticket
     */
    ticket(level, message, data) {
        this.writeLog('ticket', level, message, data);
        console.log(`🎫 [${level.toUpperCase()}] ${message}`);
    }

    /**
     * Log de erro
     * @param {string} message - Mensagem
     * @param {Error} error - Erro
     * @param {Object} context - Contexto adicional
     */
    error(message, error, context = null) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            context
        };
        
        this.writeLog('error', 'ERROR', message, errorData);
        console.error(`❌ [ERROR] ${message}:`, error);
    }

    /**
     * Log de sistema
     * @param {string} level - Nível do log
     * @param {string} message - Mensagem
     * @param {Object} data - Dados adicionais
     */
    system(level, message, data) {
        this.writeLog('system', level, message, data);
        console.log(`⚙️ [${level.toUpperCase()}] ${message}`);
    }

    /**
     * Log de RCON
     * @param {string} level - Nível do log
     * @param {string} message - Mensagem
     * @param {Object} data - Dados do RCON
     */
    rcon(level, message, data) {
        this.writeLog('rcon', level, message, data);
        console.log(`🎮 [${level.toUpperCase()}] ${message}`);
    }

    /**
     * Lê logs de um tipo específico
     * @param {string} type - Tipo de log
     * @param {number} lines - Número de linhas para ler
     * @returns {Array} - Array de logs
     */
    readLogs(type, lines = 100) {
        try {
            const logFile = this.getLogFileName(type);
            
            if (!fs.existsSync(logFile)) {
                return [];
            }

            const content = fs.readFileSync(logFile, 'utf8');
            const logLines = content.trim().split('\n').filter(line => line.length > 0);
            
            return logLines
                .slice(-lines)
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (error) {
                        return { message: line, timestamp: new Date().toISOString() };
                    }
                });
        } catch (error) {
            console.error('❌ Erro ao ler logs:', error);
            return [];
        }
    }

    /**
     * Limpa logs antigos
     * @param {number} days - Dias para manter
     */
    cleanOldLogs(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const files = fs.readdirSync(this.logsDir);
            let deletedCount = 0;

            for (const file of files) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logsDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    }
                }
            }

            this.system('INFO', `Limpeza de logs concluída. ${deletedCount} arquivos removidos.`);
        } catch (error) {
            this.error('Erro na limpeza de logs', error);
        }
    }

    /**
     * Obtém estatísticas de logs
     * @returns {Object} - Estatísticas
     */
    getLogStats() {
        try {
            const files = fs.readdirSync(this.logsDir);
            const stats = {
                totalFiles: 0,
                totalSize: 0,
                byType: {}
            };

            for (const file of files) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logsDir, file);
                    const fileStats = fs.statSync(filePath);
                    const type = file.split('_')[0];

                    stats.totalFiles++;
                    stats.totalSize += fileStats.size;

                    if (!stats.byType[type]) {
                        stats.byType[type] = {
                            files: 0,
                            size: 0
                        };
                    }

                    stats.byType[type].files++;
                    stats.byType[type].size += fileStats.size;
                }
            }

            return stats;
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return {
                totalFiles: 0,
                totalSize: 0,
                byType: {}
            };
        }
    }
}

module.exports = new Logger();
