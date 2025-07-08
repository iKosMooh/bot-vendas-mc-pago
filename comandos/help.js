const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'help',
    description: 'Mostra todos os comandos disponíveis',
    execute(message, args) {
        const prefix = config.prefix || '!';
        
        // Verificar se o usuário é administrador
        const isAdmin = message.member.permissions.has('Administrator') || 
                       message.member.permissions.has('ManageGuild') ||
                       message.member.permissions.has('ManageChannels');
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 Comandos do Bot Vendas MC')
            .setDescription(isAdmin ? 
                'Lista completa de todos os comandos disponíveis (Modo Administrador):' :
                'Lista de comandos disponíveis para usuários:')
            .setColor(isAdmin ? '#ff0000' : '#00ff00')
            .setTimestamp();

        // Comandos de usuário (sempre visíveis)
        embed.addFields(
            {
                name: '👥 Comandos de Usuário',
                value: [
                    `\`${prefix}ping\` - Verifica a latência do bot`,
                    `\`${prefix}shop [página]\` - Catálogo visual de produtos`,
                    `\`${prefix}listproducts\` - Lista produtos disponíveis`,
                    `\`${prefix}buy <ID>\` - Compra um produto`,
                    `\`${prefix}profile [@usuário]\` - Mostra perfil e histórico`,
                    `\`${prefix}checkpayment <ID>\` - Verifica status de pagamento`,
                    `\`${prefix}mypayments\` - Mostra seus pagamentos`,
                    `\`${prefix}mypurchases\` - Mostra suas compras aprovadas`,
                    `\`${prefix}purchasedetails <ID>\` - Detalhes de uma compra`,
                    `\`${prefix}link <steamid>\` - Vincula sua conta Steam`,
                    `\`${prefix}help\` - Mostra esta mensagem`
                ].join('\n'),
                inline: false
            }
        );

        // Comandos de tickets (sempre visíveis)
        embed.addFields(
            {
                name: '🎫 Sistema de Tickets',
                value: [
                    `\`${prefix}createticket <motivo>\` - Cria um ticket de suporte`,
                    `\`${prefix}closeticket\` - Fecha ticket (no canal do ticket)`,
                    `\`${prefix}tickethelp\` - Ajuda sobre tickets`,
                    ...(isAdmin ? [
                        `\`${prefix}listtickets\` - Lista tickets ativos`,
                        `\`${prefix}forceclose <ID>\` - Força fechamento de ticket`,
                        `\`${prefix}testticket\` - Testa sistema de tickets`
                    ] : [])
                ].join('\n'),
                inline: false
            }
        );

        // Comandos administrativos (só para admins)
        if (isAdmin) {
            embed.addFields(
                {
                    name: '👑 Comandos Administrativos',
                    value: [
                        `\`${prefix}addproduct\` - Adiciona um produto`,
                        `\`${prefix}listpayments\` - Lista todos os pagamentos`,
                        `\`${prefix}listapproved\` - Lista compras aprovadas`,
                        `\`${prefix}purchasestats\` - Estatísticas de vendas`,
                        `\`${prefix}clearpayments\` - Limpa todos os pagamentos`,
                        `\`${prefix}forcedelivery <ID>\` - Força entrega manual`,
                        `\`${prefix}forceexpire <ID>\` - Força expiração de produto`,
                        `\`${prefix}forceremoval <ID>\` - Força remoção de produto`,
                        `\`${prefix}syncpayments\` - Sincroniza pagamentos`,
                        `\`${prefix}clear <quantidade>\` - Limpa mensagens`,
                        `\`${prefix}status\` - Status geral do bot`,
                        `\`${prefix}config\` - Gerencia configurações`,
                        `\`${prefix}logs\` - Visualiza logs do sistema`,
                        `\`${prefix}setchannels\` - Configura canais`,
                        `\`${prefix}setrconchannel\` - Configura canal RCON`
                    ].join('\n'),
                    inline: false
                }
            );

            // Comandos técnicos (só para admins)
            embed.addFields(
                {
                    name: '🔧 Comandos Técnicos',
                    value: [
                        `\`${prefix}testmp\` - Testa Mercado Pago`,
                        `\`${prefix}mpstatus\` - Status do Mercado Pago`,
                        `\`${prefix}testrcon\` - Testa conexão RCON`,
                        `\`${prefix}rconstatus\` - Status do RCON`,
                        `\`${prefix}rconreset\` - Reseta conexão RCON`,
                        `\`${prefix}webcommand <cmd>\` - Executa comando web`,
                        `\`${prefix}setwebcommand <cmd>\` - Define comando web`
                    ].join('\n'),
                    inline: false
                }
            );

            // Comandos Slash (só para admins)
            embed.addFields(
                {
                    name: '⚡ Comandos Slash (Admin)',
                    value: [
                        '`/venda` - Anuncia um produto',
                        '`/delproduct` - Remove um produto',
                        '`/vendas` - Estatísticas de vendas',
                        '`/linksteam` - Vincula conta Steam de usuário'
                    ].join('\n'),
                    inline: false
                }
            );
        }

        // Informações adicionais
        embed.addFields(
            {
                name: '📝 Informações Importantes',
                value: [
                    `• Use \`${prefix}shop\` para ver o catálogo visual`,
                    '• Clique nos botões dos produtos para comprar',
                    '• Tickets são criados em canais privados',
                    ...(isAdmin ? [
                        '• Comandos admin requerem permissão de Administrador',
                        `• Use \`${prefix}status\` para monitorar o sistema`,
                        '• Comandos técnicos só funcionam com as devidas configurações'
                    ] : [
                        '• Para acessar comandos administrativos, contate um admin',
                        `• Use \`${prefix}profile\` para ver seu histórico de compras`
                    ])
                ].join('\n'),
                inline: false
            }
        );

        // Botões de ação
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_shop')
                    .setLabel('🛍️ Ver Catálogo')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('help_profile')
                    .setLabel('👤 Meu Perfil')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_ticket')
                    .setLabel('🎫 Criar Ticket')
                    .setStyle(ButtonStyle.Success)
            );

        embed.setFooter({ 
            text: `Bot Vendas MC - ${isAdmin ? 'Modo Administrador' : 'Modo Usuário'}`, 
            iconURL: message.client.user.displayAvatarURL() 
        });

        message.reply({ embeds: [embed], components: [row] });
    }
};
