const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Utils = require('./utils');

/**
 * Manipulador de tickets para suporte
 */
class TicketHandler {
    constructor() {
        this.ticketsPath = path.join(__dirname, '..', 'data', 'tickets.json');
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
                const fileContent = fs.readFileSync(this.ticketsPath, 'utf8').trim();
                if (fileContent) {
                    return JSON.parse(fileContent);
                }
            }
            return {};
        } catch (error) {
            console.error('❌ Erro ao carregar tickets:', error);
            // Se o arquivo estiver corrompido, fazer backup e criar novo
            if (fs.existsSync(this.ticketsPath)) {
                fs.renameSync(this.ticketsPath, `tickets_backup_${Date.now()}.json`);
            }
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
     * Obtém vínculo Steam do usuário
     * @param {string} userId - ID do usuário
     * @returns {Object|null} - Dados do vínculo Steam
     */
    getUserSteamLink(userId) {
        try {
            const steamLinksPath = path.join(__dirname, '..', 'data', 'steam_links.json');
            if (!fs.existsSync(steamLinksPath)) {
                return null;
            }

            const links = JSON.parse(fs.readFileSync(steamLinksPath, 'utf8'));
            return links[userId] || null;
        } catch (error) {
            console.error('❌ Erro ao obter vínculo Steam:', error);
            return null;
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
    async closeTicket(ticketId, user, guild, deleteChannel = false) {
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
                // Deletar canal apenas se solicitado
                if (deleteChannel) {
                    try {
                        const channel = guild.channels.cache.get(ticket.channelId);
                        if (channel) {
                            await channel.delete();
                        }
                    } catch (error) {
                        console.error('❌ Erro ao deletar canal:', error);
                        // Não falhar o fechamento do ticket se não conseguir deletar o canal
                    }
                }

                return {
                    success: true,
                    ticket: tickets[ticketId],
                    channelId: ticket.channelId
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
                const result = await this.closeTicket(ticket.id, { id: 'system', username: 'System' }, guild, true);
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

    /**
     * Manipula interações de botões
     * @param {Object} interaction - Interação do botão
     */
    async handleButtonInteraction(interaction) {
        console.log(`🔍 Processando interação de botão: ${interaction.customId}`);
        
        try {
            // Verificar se a interação já foi respondida antes de processar
            if (interaction.replied || interaction.deferred) {
                console.log('⚠️ Interação já foi processada, ignorando...');
                return;
            }

            if (interaction.customId === 'create_ticket_report') {
                console.log('🎫 Criando ticket de reportar problema...');
                await this.createTicketFromButton(interaction, 'report', 'Reportar Problema');
            } else if (interaction.customId === 'create_ticket_buy') {
                console.log('🛒 Criando ticket de compra...');
                await this.createTicketFromButton(interaction, 'buy', 'Compra');
            } else if (interaction.customId.startsWith('close_ticket_')) {
                console.log('🔒 Fechando ticket...');
                await this.closeTicketFromButton(interaction);
            } else if (interaction.customId.startsWith('buy_product_')) {
                console.log('💳 Processando compra...');
                await this.handleProductPurchase(interaction);
            } else if (interaction.customId.startsWith('pay_pix_')) {
                console.log('🔄 Processando pagamento PIX...');
                await this.handlePixPayment(interaction);
            } else if (interaction.customId.startsWith('pay_multiple_')) {
                console.log('💳 Processando pagamento múltiplo...');
                await this.handleMultiplePayment(interaction);
            } else if (interaction.customId.startsWith('check_payment_')) {
                console.log('🔍 Verificando status de pagamento...');
                await this.handlePaymentStatusCheck(interaction);
            } else {
                console.log(`❓ Botão não reconhecido: ${interaction.customId}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Botão não reconhecido!', flags: 64 });
                }
            }
        } catch (error) {
            console.error('❌ Erro ao processar botão:', error);
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Erro ao processar ação!', flags: 64 });
                } else {
                    console.log('⚠️ Interação já foi respondida, não é possível enviar erro');
                }
            } catch (replyError) {
                console.error('❌ Erro ao responder com mensagem de erro:', replyError.message);
            }
        }
    }

    /**
     * Manipula interações de select menu
     * @param {Object} interaction - Interação do select menu
     */
    async handleSelectMenuInteraction(interaction) {
        console.log(`🔍 Processando select menu: ${interaction.customId}`);
        
        try {
            // Verificar se a interação já foi respondida
            if (interaction.replied || interaction.deferred) {
                console.log('⚠️ Interação de select menu já foi processada, ignorando...');
                return;
            }

            if (interaction.customId === 'ticket_shop_select') {
                console.log('🛍️ Processando seleção de produto...');
                await this.handleShopSelection(interaction);
            } else {
                console.log(`❓ Select menu não reconhecido: ${interaction.customId}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Seleção não reconhecida!', flags: 64 });
                }
            }
        } catch (error) {
            console.error('❌ Erro ao processar select menu:', error);
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Erro ao processar seleção!', flags: 64 });
                } else {
                    console.log('⚠️ Interação de select menu já foi respondida, não é possível enviar erro');
                }
            } catch (replyError) {
                console.error('❌ Erro ao responder com mensagem de erro do select menu:', replyError.message);
            }
        }
    }

    /**
     * Cria ticket a partir de botão
     * @param {Object} interaction - Interação do botão
     * @param {string} type - Tipo do ticket
     * @param {string} reason - Motivo do ticket
     */
    async createTicketFromButton(interaction, type, reason) {
        console.log(`🔍 Criando ticket tipo: ${type}`);
        
        // Verificar Steam ID para tickets de compra
        if (type === 'buy') {
            const steamLink = this.getUserSteamLink(interaction.user.id);
            if (!steamLink) {
                console.log('❌ Usuário não tem Steam ID vinculado');
                return interaction.reply({ 
                    content: `❌ Você precisa vincular sua conta Steam antes de fazer compras!\n\nUse o comando \`/link\` para vincular sua conta Steam.`, 
                    flags: 64 
                });
            }
        }
        
        const tickets = this.loadTickets();
        const userId = interaction.user.id;
        const userName = interaction.user.tag;

        // Verificar se usuário já tem ticket aberto
        const existingTicket = Object.values(tickets).find(ticket => 
            ticket.userId === userId && ticket.status === 'open'
        );

        if (existingTicket) {
            console.log('❌ Usuário já tem ticket aberto');
            return interaction.reply({ 
                content: `❌ Você já tem um ticket aberto: <#${existingTicket.channelId}>`, 
                flags: 64 
            });
        }

        try {
            console.log('🔍 Criando canal do ticket...');
            const ticketChannel = await interaction.guild.channels.create({
                name: `${type}-${interaction.user.username}`.toLowerCase(),
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                        ],
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels,
                        ],
                    },
                ],
            });

            console.log(`✅ Canal criado: #${ticketChannel.name} (${ticketChannel.id})`);

            // Criar ticket no banco de dados
            const ticketId = Date.now().toString();
            const ticketData = {
                id: ticketId,
                userId: userId,
                userName: userName,
                channelId: ticketChannel.id,
                type: type,
                reason: reason,
                status: 'open',
                createdAt: new Date().toISOString(),
                messages: []
            };

            tickets[ticketId] = ticketData;
            this.saveTickets(tickets);

            console.log(`✅ Ticket criado: ${ticketId}`);

            // Enviar mensagem de boas-vindas
            await this.sendWelcomeMessage(ticketChannel, ticketData, interaction);

            await interaction.reply({ 
                content: `✅ Ticket criado! Acesse: <#${ticketChannel.id}>`, 
                flags: 64 
            });

        } catch (error) {
            console.error('❌ Erro ao criar ticket:', error);
            await interaction.reply({ 
                content: '❌ Erro ao criar ticket. Tente novamente.', 
                flags: 64 
            });
        }
    }

    /**
     * Envia mensagem de boas-vindas no ticket
     * @param {Object} channel - Canal do ticket
     * @param {Object} ticketData - Dados do ticket
     * @param {Object} interaction - Interação original
     */
    async sendWelcomeMessage(channel, ticketData, interaction) {
        console.log('🔍 Enviando mensagem de boas-vindas...');
        
        const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

        let embed = new EmbedBuilder()
            .setTitle(`🎫 Ticket #${ticketData.id}`)
            .setDescription(`Olá ${interaction.user}! Seu ticket foi criado com sucesso.`)
            .addFields(
                { name: '📋 Tipo', value: ticketData.type === 'report' ? '🐛 Reportar Problema' : '🛒 Compra', inline: true },
                { name: '👤 Criado por', value: ticketData.userName, inline: true },
                { name: '📅 Data', value: new Date().toLocaleString('pt-BR'), inline: true }
            )
            .setColor(ticketData.type === 'report' ? '#ff9900' : '#00ff00')
            .setTimestamp();

        const components = [];

        // Botão de fechar ticket sempre presente
        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`close_ticket_${ticketData.id}`)
                    .setLabel('🔒 Fechar Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

        if (ticketData.type === 'buy') {
            // Se for ticket de compra, adicionar select menu de produtos
            console.log('🔍 Adicionando select menu de produtos...');
            embed.addFields({
                name: '🛍️ Próximo Passo',
                value: 'Selecione o produto que deseja comprar no menu abaixo:',
                inline: false
            });

            try {
                const products = await this.getAvailableProducts();
                if (products.length > 0) {
                    // Filtrar apenas produtos com estoque disponível
                    const availableProducts = products.filter(product => 
                        !product.stock || product.stock > 0
                    );
                    
                    if (availableProducts.length > 0) {
                        const selectMenu = new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId('ticket_shop_select')
                                    .setPlaceholder('Selecione um produto para comprar')
                                    .addOptions(availableProducts.slice(0, 25).map(product => ({
                                        label: `${product.name} - R$ ${product.price}`,
                                        description: product.description ? product.description.substring(0, 100) : 'Sem descrição',
                                        value: product.id,
                                        emoji: '🛒'  // Emoji consistente para todos os produtos
                                    })))
                            );
                        components.push(selectMenu);
                    } else {
                        embed.addFields({
                            name: '❌ Sem Produtos Disponíveis',
                            value: 'Todos os produtos estão sem estoque no momento.',
                            inline: false
                        });
                    }
                } else {
                    embed.addFields({
                        name: '❌ Sem Produtos',
                        value: 'Não há produtos disponíveis no momento.',
                        inline: false
                    });
                }
            } catch (error) {
                console.error('❌ Erro ao carregar produtos:', error);
            }
        } else if (ticketData.type === 'report') {
            // Se for ticket de report, adicionar instruções
            embed.addFields({
                name: '📝 Como proceder',
                value: 'Descreva detalhadamente o problema que você está enfrentando. Nossa equipe responderá em breve.',
                inline: false
            });
        }

        components.push(closeButton);

        await channel.send({ 
            content: `${interaction.user}`, 
            embeds: [embed], 
            components: components 
        });

        console.log('✅ Mensagem de boas-vindas enviada');
    }

    /**
     * Obtém produtos disponíveis
     * @returns {Array} - Lista de produtos
     */
    async getAvailableProducts() {
        try {
            console.log('🔍 Carregando produtos disponíveis...');
            const productsPath = path.join(__dirname, '..', 'data', 'produtos.json');
            
            if (!fs.existsSync(productsPath)) {
                console.log('❌ Arquivo de produtos não encontrado');
                return [];
            }

            const productsObj = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
            
            // Converter objeto de produtos em array
            const products = Object.keys(productsObj).map(key => ({
                id: key,
                name: productsObj[key].name || key,
                description: productsObj[key].description || 'Sem descrição',
                price: productsObj[key].value || productsObj[key].price || 0,
                stock: productsObj[key].stock,
                image: productsObj[key].image,
                ...productsObj[key]
            }));
            
            console.log(`✅ ${products.length} produtos carregados`);
            return products;
        } catch (error) {
            console.error('❌ Erro ao carregar produtos:', error);
            return [];
        }
    }

    /**
     * Manipula seleção de produto no shop
     * @param {Object} interaction - Interação do select menu
     */
    async handleShopSelection(interaction) {
        console.log(`🔍 Produto selecionado: ${interaction.values[0]}`);
        
        try {
            const productId = interaction.values[0];
            const products = await this.getAvailableProducts();
            const product = products.find(p => p.id === productId);

            if (!product) {
                return interaction.reply({ 
                    content: '❌ Produto não encontrado!', 
                    flags: 64 
                });
            }

            const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

            const embed = new EmbedBuilder()
                .setTitle(`🛒 ${product.name}`)
                .setDescription(product.description || 'Sem descrição disponível')
                .addFields(
                    { name: '💰 Preço', value: `R$ ${product.price}`, inline: true },
                    { name: '📦 Estoque', value: product.stock ? `${product.stock} unidades` : 'Ilimitado', inline: true },
                    { name: '🆔 ID', value: product.id, inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            // Adicionar imagem se disponível
            if (product.image) {
                embed.setThumbnail(product.image);
            }

            const buyButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`buy_product_${product.id}`)
                        .setLabel(`💳 Comprar por R$ ${product.price}`)
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(product.stock === 0)
                );

            await interaction.reply({
                embeds: [embed],
                components: [buyButton]
            });

        } catch (error) {
            console.error('❌ Erro ao processar seleção:', error);
            await interaction.reply({ 
                content: '❌ Erro ao processar seleção!', 
                flags: 64 
            });
        }
    }

    /**
     * Fecha ticket a partir de botão
     * @param {Object} interaction - Interação do botão
     */
    async closeTicketFromButton(interaction) {
        console.log('🔍 Fechando ticket via botão...');
        
        try {
            // Verificar se a interação já foi respondida
            if (interaction.replied || interaction.deferred) {
                console.log('⚠️ Interação já foi respondida, ignorando...');
                return;
            }

            const ticketId = interaction.customId.replace('close_ticket_', '');
            
            // Responder imediatamente para evitar timeout
            await interaction.reply({ 
                content: '✅ Fechando ticket...', 
                flags: 64 
            });

            // Fechar ticket sem deletar canal ainda
            const result = await this.closeTicket(ticketId, interaction.user, interaction.guild, false);

            if (result.success) {
                // Editar a resposta para informar que será deletado
                try {
                    await interaction.editReply({ 
                        content: '✅ Ticket fechado! O canal será deletado em 3 segundos...'
                    });
                } catch (editError) {
                    console.log('⚠️ Não foi possível editar a resposta:', editError.message);
                }

                // Deletar canal após um pequeno delay
                setTimeout(async () => {
                    try {
                        // Verificar se o canal ainda existe antes de tentar deletar
                        const channel = interaction.guild.channels.cache.get(result.channelId);
                        if (channel) {
                            await channel.delete();
                            console.log('✅ Canal do ticket deletado com sucesso');
                        } else {
                            console.log('ℹ️ Canal já foi deletado ou não existe mais');
                        }
                    } catch (deleteError) {
                        console.error('❌ Erro ao deletar canal:', deleteError.message);
                        // Se não conseguir deletar, não é crítico - ticket já foi fechado
                    }
                }, 3000);
            } else {
                try {
                    await interaction.editReply({ 
                        content: `❌ Erro ao fechar ticket: ${result.error}`
                    });
                } catch (editError) {
                    console.log('⚠️ Não foi possível editar a resposta de erro:', editError.message);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao fechar ticket:', error);
            
            // Tentar responder apenas se ainda não respondeu
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ Erro ao fechar ticket!', 
                        flags: 64 
                    });
                } else {
                    await interaction.editReply({ 
                        content: '❌ Erro ao fechar ticket!' 
                    });
                }
            } catch (replyError) {
                console.error('❌ Erro ao responder interação:', replyError.message);
            }
        }
    }

    /**
     * Processa compra de produto
     * @param {Object} interaction - Interação do botão de compra
     */
    async handleProductPurchase(interaction) {
        console.log('🔍 Iniciando processo de compra...');
        
        try {
            // Extrair ID do produto do customId
            const productId = interaction.customId.replace('buy_product_', '');
            console.log(`🔍 ID do produto: ${productId}`);
            
            // Verificar se o usuário tem Steam ID vinculado
            const steamLink = this.getUserSteamLink(interaction.user.id);
            if (!steamLink) {
                return interaction.reply({
                    content: '❌ Você precisa vincular sua conta Steam antes de fazer compras!\n\nUse o comando `/link` para vincular sua conta Steam.',
                    flags: 64
                });
            }
            
            // Carregar dados do produto
            const productsPath = path.join(__dirname, '..', 'data', 'produtos.json');
            if (!fs.existsSync(productsPath)) {
                return interaction.reply({
                    content: '❌ Sistema de produtos não disponível no momento.',
                    flags: 64
                });
            }
            
            const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
            const product = products[productId];
            
            if (!product) {
                return interaction.reply({
                    content: '❌ Produto não encontrado!',
                    flags: 64
                });
            }
            
            // Verificar estoque
            if (product.stock !== null && product.stock <= 0) {
                return interaction.reply({
                    content: '❌ Produto fora de estoque!',
                    flags: 64
                });
            }
            
            // Oferecer opções de pagamento
            console.log('🔍 Oferecendo opções de pagamento...');
            const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setTitle('💳 Escolha a Forma de Pagamento')
                .setDescription(`Escolha como deseja pagar pelo produto **${product.name}**`)
                .addFields(
                    { name: '🏷️ Produto', value: product.name, inline: true },
                    { name: '💰 Valor', value: `R$ ${product.value}`, inline: true },
                    { name: '🎮 Steam ID', value: steamLink.steamId, inline: true }
                )
                .setColor('#0099ff')
                .setTimestamp();
            
            const paymentButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pay_pix_${productId}`)
                        .setLabel('🔄 PIX (Instantâneo)')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`pay_multiple_${productId}`)
                        .setLabel('� Cartão/Boleto/Outros')
                        .setStyle(ButtonStyle.Primary)
                );
            
            await interaction.reply({
                embeds: [embed],
                components: [paymentButtons],
                flags: 64
            });
            
        } catch (error) {
            console.error('❌ Erro ao processar compra:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erro ao processar compra. Tente novamente.',
                    flags: 64
                });
            } else {
                await interaction.followUp({
                    content: '❌ Erro ao processar compra. Tente novamente.',
                    flags: 64
                });
            }
        }
    }

    /**
     * Processa pagamento PIX
     * @param {Object} interaction - Interação do botão de PIX
     */
    async handlePixPayment(interaction) {
        try {
            const productId = interaction.customId.replace('pay_pix_', '');
            await this.processPayment(interaction, productId, 'pix');
        } catch (error) {
            console.error('❌ Erro ao processar PIX:', error);
            await this.handlePaymentError(interaction, error);
        }
    }

    /**
     * Processa pagamento múltiplo
     * @param {Object} interaction - Interação do botão de múltiplo
     */
    async handleMultiplePayment(interaction) {
        try {
            const productId = interaction.customId.replace('pay_multiple_', '');
            await this.processPayment(interaction, productId, 'multiple');
        } catch (error) {
            console.error('❌ Erro ao processar pagamento múltiplo:', error);
            await this.handlePaymentError(interaction, error);
        }
    }

    /**
     * Processa o pagamento com método específico
     * @param {Object} interaction - Interação
     * @param {string} productId - ID do produto
     * @param {string} paymentMethod - Método de pagamento
     */
    async processPayment(interaction, productId, paymentMethod) {
        // Verificar se o usuário tem Steam ID vinculado
        const steamLink = this.getUserSteamLink(interaction.user.id);
        if (!steamLink) {
            return interaction.reply({
                content: '❌ Você precisa vincular sua conta Steam antes de fazer compras!\n\nUse o comando `/link` para vincular sua conta Steam.',
                flags: 64
            });
        }
        
        // Carregar dados do produto
        const productsPath = path.join(__dirname, '..', 'produtos.json');
        if (!fs.existsSync(productsPath)) {
            return interaction.reply({
                content: '❌ Sistema de produtos não disponível no momento.',
                flags: 64
            });
        }
        
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        const product = products[productId];
        
        if (!product) {
            return interaction.reply({
                content: '❌ Produto não encontrado!',
                flags: 64
            });
        }
        
        // Verificar estoque
        if (product.stock !== null && product.stock <= 0) {
            return interaction.reply({
                content: '❌ Produto fora de estoque!',
                flags: 64
            });
        }
        
        // Gerar link de pagamento
        const mercadoPago = require('./mercadoPago');
        
        const productData = {
            id: productId,
            name: product.name,
            description: product.description || `Compra do produto: ${product.name}`,
            price: product.value
        };
        
        let paymentResult;
        if (paymentMethod === 'pix') {
            paymentResult = await mercadoPago.createPixPayment(productData, interaction.user.id);
        } else {
            paymentResult = await mercadoPago.createPaymentPreference(productData, interaction.user.id);
        }
        
        if (paymentResult) {
            const methodName = paymentMethod === 'pix' ? 'PIX' : 'Múltiplas Formas';
            const methodIcon = paymentMethod === 'pix' ? '🔄' : '💳';
            const linkText = paymentMethod === 'pix' ? 'Pagar com PIX' : 'Escolher Forma de Pagamento';
            
            const embed = new EmbedBuilder()
                .setTitle(`${methodIcon} Link de Pagamento Gerado`)
                .setDescription(`Clique no link abaixo para realizar o pagamento do produto **${product.name}** via **${methodName}**`)
                .addFields(
                    { name: '🏷️ Produto', value: product.name, inline: true },
                    { name: '💰 Valor', value: `R$ ${product.value}`, inline: true },
                    { name: '🎮 Steam ID', value: steamLink.steamId, inline: true },
                    { name: '🆔 ID do Pagamento', value: paymentResult.id.toString(), inline: false },
                    { name: '💳 Método', value: methodName, inline: true },
                    { name: '⏰ Validade', value: paymentMethod === 'pix' ? '30 minutos' : '24 horas', inline: true }
                )
                .setColor(paymentMethod === 'pix' ? '#00ff00' : '#0099ff')
                .setTimestamp();
            
            const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
            
            const paymentButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(`${methodIcon} ${linkText}`)
                        .setStyle(ButtonStyle.Link)
                        .setURL(paymentResult.init_point),
                    new ButtonBuilder()
                        .setCustomId(`check_payment_${paymentResult.id}`)
                        .setLabel('🔍 Verificar Status')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.reply({
                embeds: [embed],
                components: [paymentButton],
                flags: 64
            });
            
            console.log(`✅ Link de pagamento ${paymentMethod} gerado: ${paymentResult.id}`);
            
            // Notificar no canal sobre a compra iniciada
            const notificationEmbed = new EmbedBuilder()
                .setTitle('🛒 Compra Iniciada')
                .setDescription(`${interaction.user} iniciou o processo de compra`)
                .addFields(
                    { name: '🏷️ Produto', value: product.name, inline: true },
                    { name: '💰 Valor', value: `R$ ${product.value}`, inline: true },
                    { name: '💳 Método', value: methodName, inline: true },
                    { name: '🆔 ID', value: paymentResult.id.toString(), inline: true }
                )
                .setColor('#ffaa00')
                .setTimestamp();
            
            await interaction.followUp({
                embeds: [notificationEmbed]
            });
        } else {
            throw new Error('Erro ao gerar pagamento');
        }
    }

    /**
     * Manipula erros de pagamento
     * @param {Object} interaction - Interação
     * @param {Error} error - Erro ocorrido
     */
    async handlePaymentError(interaction, error) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Erro ao processar pagamento. Tente novamente.',
                flags: 64
            });
        } else {
            await interaction.followUp({
                content: '❌ Erro ao processar pagamento. Tente novamente.',
                flags: 64
            });
        }
    }

    /**
     * Verifica status de pagamento
     * @param {Object} interaction - Interação do botão de verificação
     */
    async handlePaymentStatusCheck(interaction) {
        try {
            const paymentId = interaction.customId.replace('check_payment_', '');
            console.log(`🔍 Verificando status do pagamento: ${paymentId}`);
            
            await interaction.deferReply({ flags: 64 });
            
            const mercadoPago = require('./mercadoPago');
            
            // Verificar status do pagamento
            const paymentStatus = await mercadoPago.checkPaymentStatus(paymentId);
            
            let statusIcon = '⏳';
            let statusText = 'Pendente';
            let statusColor = '#ffaa00';
            let statusDescription = 'Aguardando pagamento...';
            
            switch (paymentStatus.status) {
                case 'approved':
                    statusIcon = '✅';
                    statusText = 'Aprovado';
                    statusColor = '#00ff00';
                    statusDescription = 'Pagamento aprovado! Processando entrega...';
                    break;
                case 'pending':
                    statusIcon = '⏳';
                    statusText = 'Pendente';
                    statusColor = '#ffaa00';
                    statusDescription = 'Aguardando confirmação do pagamento...';
                    break;
                case 'in_process':
                    statusIcon = '🔄';
                    statusText = 'Processando';
                    statusColor = '#0099ff';
                    statusDescription = 'Pagamento sendo processado...';
                    break;
                case 'rejected':
                    statusIcon = '❌';
                    statusText = 'Rejeitado';
                    statusColor = '#ff0000';
                    statusDescription = 'Pagamento rejeitado. Tente novamente.';
                    break;
                case 'cancelled':
                    statusIcon = '🚫';
                    statusText = 'Cancelado';
                    statusColor = '#666666';
                    statusDescription = 'Pagamento cancelado.';
                    break;
                default:
                    statusDescription = `Status: ${paymentStatus.status}`;
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`${statusIcon} Status do Pagamento`)
                .setDescription(statusDescription)
                .addFields(
                    { name: '🆔 ID do Pagamento', value: paymentId, inline: true },
                    { name: '📊 Status', value: statusText, inline: true },
                    { name: '💰 Valor', value: `R$ ${paymentStatus.amount}`, inline: true }
                )
                .setColor(statusColor)
                .setTimestamp();
            
            // Se o pagamento foi aprovado, processar entrega
            if (paymentStatus.status === 'approved') {
                console.log(`✅ Pagamento ${paymentId} aprovado! Processando entrega...`);
                
                // Obter dados do pagamento
                const paymentsPath = path.join(__dirname, '..', 'payments.json');
                let payments = {};
                
                if (fs.existsSync(paymentsPath)) {
                    payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
                }
                
                const payment = payments[paymentId];
                
                if (payment && !payment.delivered) {
                    try {
                        // Processar entrega
                        const productDelivery = require('./productDelivery');
                        const deliveryResult = await productDelivery.deliverProduct(paymentId, interaction.client);
                        
                        if (deliveryResult.success) {
                            embed.addFields({
                                name: '🎁 Entrega',
                                value: 'Produto entregue com sucesso!',
                                inline: false
                            });
                            
                            // Atualizar dados do pagamento
                            payment.delivered = true;
                            payment.deliveredAt = new Date().toISOString();
                            payment.deliveryMethod = deliveryResult.deliveryData?.method || 'auto';
                            
                            // Calcular data de expiração se necessário
                            const productsPath = path.join(__dirname, '..', 'produtos.json');
                            if (fs.existsSync(productsPath)) {
                                const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
                                const product = products[payment.productId];
                                
                                if (product && product.time_amount && product.time_unit && !product.infinito) {
                                    const now = new Date();
                                    let expirationTime;
                                    
                                    switch (product.time_unit) {
                                        case 'min':
                                            expirationTime = now.getTime() + (product.time_amount * 60 * 1000);
                                            break;
                                        case 'h':
                                            expirationTime = now.getTime() + (product.time_amount * 60 * 60 * 1000);
                                            break;
                                        case 'd':
                                            expirationTime = now.getTime() + (product.time_amount * 24 * 60 * 60 * 1000);
                                            break;
                                    }
                                    
                                    if (expirationTime) {
                                        payment.expiresAt = expirationTime;
                                        embed.addFields({
                                            name: '⏰ Expira em',
                                            value: new Date(expirationTime).toLocaleString('pt-BR'),
                                            inline: true
                                        });
                                    }
                                }
                            }
                            
                            // Salvar alterações
                            payments[paymentId] = payment;
                            fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));
                            
                            console.log(`✅ Entrega processada com sucesso para pagamento ${paymentId}`);
                            
                        } else {
                            embed.addFields({
                                name: '⚠️ Entrega',
                                value: 'Erro na entrega automática. Contate um administrador.',
                                inline: false
                            });
                            console.error(`❌ Erro na entrega para pagamento ${paymentId}:`, deliveryResult.error);
                        }
                        
                    } catch (deliveryError) {
                        console.error(`❌ Erro ao processar entrega para pagamento ${paymentId}:`, deliveryError);
                        embed.addFields({
                            name: '⚠️ Entrega',
                            value: 'Erro ao processar entrega. Contate um administrador.',
                            inline: false
                        });
                    }
                } else if (payment && payment.delivered) {
                    embed.addFields({
                        name: '✅ Entrega',
                        value: `Produto já foi entregue em ${new Date(payment.deliveredAt).toLocaleString('pt-BR')}`,
                        inline: false
                    });
                }
            }
            
            const components = [];
            
            // Adicionar botão para verificar novamente se não foi aprovado
            if (paymentStatus.status !== 'approved' && paymentStatus.status !== 'rejected' && paymentStatus.status !== 'cancelled') {
                const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
                
                const refreshButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`check_payment_${paymentId}`)
                            .setLabel('🔄 Verificar Novamente')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                components.push(refreshButton);
            }
            
            await interaction.editReply({
                embeds: [embed],
                components: components
            });
            
        } catch (error) {
            console.error('❌ Erro ao verificar status de pagamento:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erro na Verificação')
                .setDescription('Não foi possível verificar o status do pagamento. Tente novamente.')
                .setColor('#ff0000')
                .setTimestamp();
            
            if (interaction.deferred) {
                await interaction.editReply({
                    embeds: [errorEmbed]
                });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed],
                    flags: 64
                });
            }
        }
    }
}

module.exports = new TicketHandler();