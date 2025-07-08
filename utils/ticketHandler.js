const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Utils = require('./utils');

/**
 * Manipulador de tickets para suporte
 */
class TicketHandler {
    constructor() {
        this.ticketsPath = path.join(__dirname, '..', 'tickets.json');
        this.configPath = path.join(__dirname, '..', 'config.json');
        this.loadConfig();
    }

    /**
     * Carrega configurações do arquivo
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } else {
                this.config = {};
            }
            // Carregar channels do arquivo separado
            this.channels = Utils.loadChannels();
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
            this.config = {};
            this.channels = {};
        }
    }

    /**
     * Carrega tickets do arquivo
     */
    loadTickets() {
        try {
            if (fs.existsSync(this.ticketsPath)) {
                return JSON.parse(fs.readFileSync(this.ticketsPath, 'utf8'));
            }
            return {};
        } catch (error) {
            console.error('❌ Erro ao carregar tickets:', error);
            return {};
        }
    }

    /**
     * Salva tickets no arquivo
     */
    saveTickets(tickets) {
        try {
            fs.writeFileSync(this.ticketsPath, JSON.stringify(tickets, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar tickets:', error);
            return false;
        }
    }

    /**
     * Cria um novo ticket
     * @param {Object} guild - Guild do Discord
     * @param {Object} user - Usuário que criou o ticket
     * @param {string} reason - Motivo do ticket
     * @returns {Promise<Object>} - Dados do ticket criado
     */
    async createTicket(guild, user, reason) {
        try {
            const tickets = this.loadTickets();
            const ticketId = `ticket-${Date.now()}`;
            
            // Verificar se o usuário já tem um ticket aberto
            const existingTicket = Object.values(tickets).find(
                t => t.userId === user.id && t.status === 'open'
            );
            
            if (existingTicket) {
                return {
                    success: false,
                    error: 'Você já possui um ticket aberto!'
                };
            }

            // Criar categoria se não existir
            let category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({
                    name: 'Tickets',
                    type: ChannelType.GuildCategory,
                    position: 0
                });
            }

            // Criar canal do ticket
            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            // Adicionar permissões para administradores
            const adminRole = guild.roles.cache.find(r => r.name === 'Admin' || r.permissions.has(PermissionFlagsBits.Administrator));
            if (adminRole) {
                await ticketChannel.permissionOverwrites.create(adminRole, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageMessages: true
                });
            }

            // Salvar ticket
            tickets[ticketId] = {
                id: ticketId,
                channelId: ticketChannel.id,
                userId: user.id,
                username: user.username,
                reason: reason,
                status: 'open',
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                messages: []
            };

            if (this.saveTickets(tickets)) {
                // Enviar mensagem inicial no ticket
                const embed = new EmbedBuilder()
                    .setTitle('🎫 Novo Ticket de Suporte')
                    .setDescription(`Olá ${user}, seu ticket foi criado com sucesso!`)
                    .addFields(
                        { name: '📋 Motivo', value: reason, inline: false },
                        { name: '🆔 ID do Ticket', value: ticketId, inline: true },
                        { name: '📅 Criado em', value: new Date().toLocaleString('pt-BR'), inline: true },
                        { name: '📝 Instruções', value: 'Descreva seu problema detalhadamente. Um administrador irá responder em breve.', inline: false }
                    )
                    .setColor('#0099ff')
                    .setTimestamp();

                await ticketChannel.send({ 
                    content: `${user} | <@&${adminRole?.id || '@here'}>`,
                    embeds: [embed] 
                });

                return {
                    success: true,
                    ticket: tickets[ticketId],
                    channel: ticketChannel
                };
            } else {
                await ticketChannel.delete();
                return {
                    success: false,
                    error: 'Erro ao salvar ticket'
                };
            }
        } catch (error) {
            console.error('❌ Erro ao criar ticket:', error);
            return {
                success: false,
                error: 'Erro interno ao criar ticket'
            };
        }
    }

    /**
     * Fecha um ticket
     * @param {string} ticketId - ID do ticket
     * @param {Object} user - Usuário que fechou
     * @param {Object} guild - Guild do Discord
     * @returns {Promise<Object>} - Resultado da operação
     */
    async closeTicket(ticketId, user, guild) {
        try {
            const tickets = this.loadTickets();
            const ticket = tickets[ticketId];

            if (!ticket) {
                return {
                    success: false,
                    error: 'Ticket não encontrado'
                };
            }

            if (ticket.status === 'closed') {
                return {
                    success: false,
                    error: 'Ticket já está fechado'
                };
            }

            // Atualizar ticket
            tickets[ticketId].status = 'closed';
            tickets[ticketId].closedAt = new Date().toISOString();
            tickets[ticketId].closedBy = user.id;
            tickets[ticketId].closedByUsername = user.username;

            if (this.saveTickets(tickets)) {
                // Tentar deletar canal
                const channel = guild.channels.cache.get(ticket.channelId);
                if (channel) {
                    await channel.delete();
                }

                return {
                    success: true,
                    ticket: tickets[ticketId]
                };
            } else {
                return {
                    success: false,
                    error: 'Erro ao salvar ticket'
                };
            }
        } catch (error) {
            console.error('❌ Erro ao fechar ticket:', error);
            return {
                success: false,
                error: 'Erro interno ao fechar ticket'
            };
        }
    }

    /**
     * Lista tickets de um usuário
     * @param {string} userId - ID do usuário
     * @returns {Array} - Lista de tickets
     */
    getUserTickets(userId) {
        try {
            const tickets = this.loadTickets();
            return Object.values(tickets).filter(ticket => ticket.userId === userId);
        } catch (error) {
            console.error('❌ Erro ao buscar tickets do usuário:', error);
            return [];
        }
    }

    /**
     * Lista todos os tickets
     * @param {string} status - Status dos tickets (opcional)
     * @returns {Array} - Lista de tickets
     */
    getAllTickets(status = null) {
        try {
            const tickets = this.loadTickets();
            const allTickets = Object.values(tickets);
            
            if (status) {
                return allTickets.filter(ticket => ticket.status === status);
            }
            
            return allTickets;
        } catch (error) {
            console.error('❌ Erro ao buscar tickets:', error);
            return [];
        }
    }

    /**
     * Obtém estatísticas dos tickets
     * @returns {Object} - Estatísticas
     */
    getTicketStats() {
        try {
            const tickets = this.loadTickets();
            const allTickets = Object.values(tickets);
            
            const stats = {
                total: allTickets.length,
                open: allTickets.filter(t => t.status === 'open').length,
                closed: allTickets.filter(t => t.status === 'closed').length,
                today: allTickets.filter(t => {
                    const today = new Date();
                    const ticketDate = new Date(t.createdAt);
                    return ticketDate.toDateString() === today.toDateString();
                }).length,
                thisWeek: allTickets.filter(t => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    const ticketDate = new Date(t.createdAt);
                    return ticketDate >= weekAgo;
                }).length
            };
            
            return stats;
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return {
                total: 0,
                open: 0,
                closed: 0,
                today: 0,
                thisWeek: 0
            };
        }
    }

    /**
     * Força fechamento de tickets
     * @param {Object} guild - Guild do Discord
     * @param {string} filter - Filtro (all, user, old)
     * @param {string} userId - ID do usuário (opcional)
     * @returns {Promise<Object>} - Resultado da operação
     */
    async forceCloseTickets(guild, filter, userId = null) {
        try {
            const tickets = this.loadTickets();
            let ticketsToClose = [];

            switch (filter) {
                case 'all':
                    ticketsToClose = Object.values(tickets).filter(t => t.status === 'open');
                    break;
                case 'user':
                    if (!userId) throw new Error('ID do usuário é obrigatório');
                    ticketsToClose = Object.values(tickets).filter(t => t.status === 'open' && t.userId === userId);
                    break;
                case 'old':
                    const twoDaysAgo = new Date();
                    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                    ticketsToClose = Object.values(tickets).filter(t => {
                        return t.status === 'open' && new Date(t.lastActivity) < twoDaysAgo;
                    });
                    break;
                default:
                    throw new Error('Filtro inválido');
            }

            let closedCount = 0;
            for (const ticket of ticketsToClose) {
                const result = await this.closeTicket(ticket.id, { id: 'system', username: 'System' }, guild);
                if (result.success) {
                    closedCount++;
                }
            }

            return {
                success: true,
                closedCount: closedCount,
                totalFound: ticketsToClose.length
            };
        } catch (error) {
            console.error('❌ Erro ao forçar fechamento:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new TicketHandler();