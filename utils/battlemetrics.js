const https = require('https');
const { EmbedBuilder } = require('discord.js');

/**
 * Utilitário para interagir com a API do Battlemetrics
 */
class BattlemetricsAPI {
    constructor() {
        this.baseURL = 'https://api.battlemetrics.com';
        this.userAgent = 'Discord Bot/1.0';
    }

    /**
     * Faz uma requisição para a API do Battlemetrics
     * @param {string} endpoint - Endpoint da API
     * @returns {Promise<Object>} - Dados da resposta
     */
    async makeRequest(endpoint) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseURL}${endpoint}`;
            
            const options = {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/json'
                }
            };

            const req = https.get(url, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const jsonData = JSON.parse(data);
                            resolve(jsonData);
                        } else {
                            reject(new Error(`API returned status ${res.statusCode}: ${data}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse JSON: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    /**
     * Obtém dados do servidor pelo ID
     * @param {string} serverId - ID do servidor no Battlemetrics
     * @returns {Promise<Object>} - Dados do servidor
     */
    async getServerData(serverId) {
        try {
            console.log(`🔍 Buscando dados do servidor ${serverId}...`);
            
            const data = await this.makeRequest(`/servers/${serverId}`);
            
            if (!data.data) {
                throw new Error('Dados do servidor não encontrados');
            }

            const server = data.data;
            const attributes = server.attributes;

            const serverData = {
                id: server.id,
                name: attributes.name,
                status: attributes.status,
                players: attributes.players,
                maxPlayers: attributes.maxPlayers,
                rank: attributes.rank,
                address: attributes.address,
                port: attributes.port,
                location: attributes.location || {},
                details: attributes.details || {},
                lastSeen: attributes.lastSeen,
                createdAt: attributes.createdAt,
                updatedAt: attributes.updatedAt
            };

            console.log(`✅ Dados do servidor obtidos: ${serverData.name} (${serverData.players}/${serverData.maxPlayers})`);
            return serverData;

        } catch (error) {
            console.error('❌ Erro ao obter dados do servidor:', error.message);
            throw error;
        }
    }

    /**
     * Extrai ID do servidor a partir da URL do Battlemetrics
     * @param {string} url - URL do servidor
     * @returns {string|null} - ID do servidor
     */
    extractServerIdFromURL(url) {
        try {
            // https://www.battlemetrics.com/servers/unturned/34456987
            const match = url.match(/battlemetrics\.com\/servers\/[^\/]+\/(\d+)/);
            return match ? match[1] : null;
        } catch (error) {
            console.error('❌ Erro ao extrair ID da URL:', error);
            return null;
        }
    }

    /**
     * Cria embed com dados do servidor
     * @param {Object} serverData - Dados do servidor
     * @returns {EmbedBuilder} - Embed formatado
     */
    createServerEmbed(serverData) {
        const embed = new EmbedBuilder()
            .setTitle(`🎮 ${serverData.name}`)
            .setColor(serverData.status === 'online' ? '#00ff00' : '#ff0000')
            .setTimestamp()
            .setFooter({ text: 'Atualizado em' });

        // Status do servidor
        const statusIcon = serverData.status === 'online' ? '🟢' : '🔴';
        const statusText = serverData.status === 'online' ? 'Online' : 'Offline';
        
        embed.addFields(
            { 
                name: '📊 Status', 
                value: `${statusIcon} ${statusText}`, 
                inline: true 
            }
        );

        if (serverData.status === 'online') {
            // Jogadores online
            const playersText = `👥 ${serverData.players}/${serverData.maxPlayers}`;
            const playersPercentage = Math.round((serverData.players / serverData.maxPlayers) * 100);
            
            embed.addFields(
                { 
                    name: '👥 Jogadores', 
                    value: `${playersText}\n📈 ${playersPercentage}%`, 
                    inline: true 
                }
            );

            // Ranking
            if (serverData.rank) {
                embed.addFields(
                    { 
                        name: '🏆 Ranking', 
                        value: `#${serverData.rank}`, 
                        inline: true 
                    }
                );
            }

            // Endereço do servidor
            embed.addFields(
                { 
                    name: '🌐 Endereço IP', 
                    value: `StarVs.online:${serverData.port}`, 
                    inline: false 
                }
            );

            // Localização
            if (serverData.location && serverData.location.country) {
                const locationText = `${serverData.location.country}${serverData.location.city ? `, ${serverData.location.city}` : ''}`;
                embed.addFields(
                    { 
                        name: '📍 Localização', 
                        value: locationText, 
                        inline: true 
                    }
                );
            }

            // Detalhes do jogo (se disponível)
            if (serverData.details) {
                const gameDetails = [];
                
                if (serverData.details.map) {
                    gameDetails.push(`🗺️ Mapa: ${serverData.details.map}`);
                }
                
                if (serverData.details.gameMode) {
                    gameDetails.push(`🎯 Modo: ${serverData.details.gameMode}`);
                }
                
                if (serverData.details.version) {
                    gameDetails.push(`📦 Versão: ${serverData.details.version}`);
                }

                if (gameDetails.length > 0) {
                    embed.addFields(
                        { 
                            name: '🎮 Detalhes', 
                            value: gameDetails.join('\n'), 
                            inline: false 
                        }
                    );
                }
            }

            // Barra de progresso visual para jogadores
            const progressBarLength = 20;
            const filledLength = Math.round((serverData.players / serverData.maxPlayers) * progressBarLength);
            const emptyLength = progressBarLength - filledLength;
            const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
            
            embed.setDescription(`\`${progressBar}\` ${serverData.players}/${serverData.maxPlayers} jogadores`);

        } else {
            embed.setDescription('❌ Servidor offline');
        }


        return embed;
    }

    /**
     * Formata tempo de atividade
     * @param {string} lastSeen - Data da última vez visto
     * @returns {string} - Tempo formatado
     */
    formatUptime(lastSeen) {
        try {
            const now = new Date();
            const lastSeenDate = new Date(lastSeen);
            const diffMs = now - lastSeenDate;
            
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
                return `${diffDays}d ${diffHours % 24}h`;
            } else if (diffHours > 0) {
                return `${diffHours}h ${diffMinutes % 60}m`;
            } else {
                return `${diffMinutes}m`;
            }
        } catch (error) {
            return 'N/A';
        }
    }
}

module.exports = new BattlemetricsAPI();
