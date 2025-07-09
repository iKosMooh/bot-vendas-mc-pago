const battlemetrics = require('./battlemetrics');
const Utils = require('./utils');

/**
 * Sistema de monitoramento de servidor
 */
class ServerMonitor {
    constructor() {
        this.isRunning = false;
        this.interval = null;
        this.client = null;
        this.lastUpdateTime = null;
        this.errorCount = 0;
        this.maxErrors = 5;
    }

    /**
     * Inicia o monitoramento do servidor
     * @param {Client} client - Cliente do Discord
     */
    startMonitoring(client) {
        if (this.isRunning) {
            console.log('⚠️ Monitoramento de servidor já está ativo');
            return;
        }

        this.client = client;
        
        const channels = Utils.loadChannels();
        if (!channels.serverMonitor || !channels.serverMonitor.enabled) {
            console.log('ℹ️ Monitoramento de servidor não configurado ou desabilitado');
            return;
        }

        const config = channels.serverMonitor;
        const intervalMs = (config.interval || 10) * 60 * 1000; // Converter para milissegundos

        console.log(`🎮 Iniciando monitoramento do servidor ${config.serverName}`);
        console.log(`⏱️ Intervalo: ${config.interval} minutos`);
        console.log(`📍 Canal: ${config.channelId}`);

        this.isRunning = true;
        this.errorCount = 0;

        // Fazer primeira atualização imediatamente
        this.updateServerStatus();

        // Configurar intervalo de atualização
        this.interval = setInterval(() => {
            this.updateServerStatus();
        }, intervalMs);

        console.log('✅ Monitoramento de servidor iniciado');
    }

    /**
     * Para o monitoramento do servidor
     */
    stopMonitoring() {
        if (!this.isRunning) {
            console.log('⚠️ Monitoramento de servidor não está ativo');
            return;
        }

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.isRunning = false;
        this.client = null;

        console.log('🛑 Monitoramento de servidor parado');
    }

    /**
     * Atualiza o status do servidor
     */
    async updateServerStatus() {
        try {
            console.log('🔄 Atualizando status do servidor...');

            const channels = Utils.loadChannels();
            if (!channels.serverMonitor || !channels.serverMonitor.enabled) {
                console.log('⚠️ Monitoramento desabilitado, parando...');
                this.stopMonitoring();
                return;
            }

            const config = channels.serverMonitor;
            
            // Obter dados do servidor
            const serverData = await battlemetrics.getServerData(config.serverId);
            
            // Buscar canal
            const channel = this.client.channels.cache.get(config.channelId);
            if (!channel) {
                console.error(`❌ Canal ${config.channelId} não encontrado`);
                this.errorCount++;
                this.handleError('Canal não encontrado');
                return;
            }

            // Criar novo embed
            const embed = battlemetrics.createServerEmbed(serverData);
            
            // Adicionar informações de monitoramento
            embed.setFooter({ 
                text: `Próxima atualização em ${config.interval}min • Atualizado ` 
            });

            // Tentar editar mensagem existente ou criar nova
            let message = null;
            
            if (config.lastMessageId) {
                try {
                    message = await channel.messages.fetch(config.lastMessageId);
                    await message.edit({ embeds: [embed] });
                    console.log('✅ Mensagem de status atualizada');
                } catch (error) {
                    console.log('⚠️ Não foi possível editar mensagem existente, criando nova...');
                    message = null;
                }
            }

            // Se não conseguiu editar, criar nova mensagem
            if (!message) {
                try {
                    message = await channel.send({ embeds: [embed] });
                    
                    // Atualizar ID da mensagem
                    config.lastMessageId = message.id;
                    channels.serverMonitor = config;
                    Utils.saveChannels(channels);
                    
                    console.log(`✅ Nova mensagem de status enviada: ${message.id}`);
                } catch (error) {
                    console.error('❌ Erro ao enviar nova mensagem:', error);
                    this.errorCount++;
                    this.handleError(`Erro ao enviar mensagem: ${error.message}`);
                    return;
                }
            }

            // Atualizar tempo da última atualização
            this.lastUpdateTime = new Date();
            this.errorCount = 0; // Reset contador de erros

            console.log(`✅ Status atualizado: ${serverData.name} (${serverData.players}/${serverData.maxPlayers})`);

        } catch (error) {
            console.error('❌ Erro ao atualizar status do servidor:', error);
            this.errorCount++;
            this.handleError(error.message);
        }
    }

    /**
     * Trata erros de monitoramento
     * @param {string} errorMessage - Mensagem de erro
     */
    handleError(errorMessage) {
        console.error(`❌ Erro no monitoramento (${this.errorCount}/${this.maxErrors}): ${errorMessage}`);

        if (this.errorCount >= this.maxErrors) {
            console.error('❌ Muitos erros consecutivos, parando monitoramento');
            this.stopMonitoring();
            
            // Tentar notificar sobre o erro
            this.notifyError('Monitoramento parado devido a muitos erros consecutivos');
        }
    }

    /**
     * Notifica sobre erros críticos
     * @param {string} message - Mensagem de erro
     */
    async notifyError(message) {
        try {
            const channels = Utils.loadChannels();
            if (!channels.serverMonitor) return;

            const channel = this.client.channels.cache.get(channels.serverMonitor.channelId);
            if (!channel) return;

            const { EmbedBuilder } = require('discord.js');
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('⚠️ Erro no Monitoramento')
                .setDescription(message)
                .addFields(
                    { name: '🕐 Horário', value: new Date().toLocaleString('pt-BR'), inline: true },
                    { name: '🔄 Ação', value: 'Use `/setservermonitor` para reconfigurar', inline: true }
                )
                .setColor('#ff9900')
                .setTimestamp();

            await channel.send({ embeds: [errorEmbed] });
        } catch (error) {
            console.error('❌ Erro ao notificar erro:', error);
        }
    }

    /**
     * Obtém status do monitoramento
     * @returns {Object} - Status atual
     */
    getStatus() {
        const channels = Utils.loadChannels();
        const config = channels.serverMonitor;

        return {
            isRunning: this.isRunning,
            lastUpdate: this.lastUpdateTime,
            errorCount: this.errorCount,
            config: config || null,
            interval: config ? config.interval : null,
            serverId: config ? config.serverId : null,
            serverName: config ? config.serverName : null
        };
    }

    /**
     * Reinicia o monitoramento
     */
    restart() {
        console.log('🔄 Reiniciando monitoramento...');
        this.stopMonitoring();
        
        setTimeout(() => {
            if (this.client) {
                this.startMonitoring(this.client);
            }
        }, 1000);
    }
}

const serverMonitor = new ServerMonitor();

/**
 * Inicia o monitoramento de servidor
 * @param {Client} client - Cliente do Discord
 */
function startServerMonitoring(client) {
    serverMonitor.startMonitoring(client);
}

/**
 * Para o monitoramento de servidor
 */
function stopServerMonitoring() {
    serverMonitor.stopMonitoring();
}

/**
 * Obtém status do monitoramento
 * @returns {Object} - Status atual
 */
function getMonitoringStatus() {
    return serverMonitor.getStatus();
}

/**
 * Reinicia o monitoramento
 */
function restartServerMonitoring() {
    serverMonitor.restart();
}

module.exports = {
    startServerMonitoring,
    stopServerMonitoring,
    getMonitoringStatus,
    restartServerMonitoring
};
