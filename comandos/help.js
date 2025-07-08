const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Mostra todos os comandos disponíveis',
    execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Comandos do Bot Vendas MC')
            .setDescription('Lista completa de todos os comandos disponíveis:')
            .setColor('#00ff00')
            .setTimestamp();

        // Comandos de usuário
        embed.addFields(
            {
                name: '👥 Comandos de Usuário',
                value: [
                    '`!ping` - Verifica a latência do bot',
                    '`!shop [página]` - Catálogo visual de produtos',
                    '`!listproducts` - Lista produtos disponíveis',
                    '`!buy <ID>` - Compra um produto',
                    '`!profile [@usuário]` - Mostra perfil e histórico',
                    '`!checkpayment <ID>` - Verifica status de pagamento',
                    '`!mypayments` - Mostra seus pagamentos',
                    '`!mypurchases` - Mostra suas compras aprovadas',
                    '`!purchasedetails <ID>` - Detalhes de uma compra',
                    '`!link <steamid>` - Vincula sua conta Steam',
                    '`!help` - Mostra esta mensagem'
                ].join('\n'),
                inline: false
            }
        );

        // Comandos de tickets
        embed.addFields(
            {
                name: '🎫 Sistema de Tickets',
                value: [
                    '`!createticket <motivo>` - Cria um ticket de suporte',
                    '`!closeticket` - Fecha ticket (no canal do ticket)',
                    '`!tickethelp` - Ajuda sobre tickets',
                    '`!listtickets` - Lista tickets ativos (Admin)',
                    '`!forceclose <ID>` - Força fechamento (Admin)',
                    '`!testticket` - Testa sistema de tickets (Admin)'
                ].join('\n'),
                inline: false
            }
        );

        // Comandos administrativos
        embed.addFields(
            {
                name: '👑 Comandos Administrativos',
                value: [
                    '`!addproduct` - Adiciona um produto',
                    '`!listpayments` - Lista todos os pagamentos',
                    '`!listapproved` - Lista compras aprovadas',
                    '`!purchasestats` - Estatísticas de vendas',
                    '`!clearpayments` - Limpa todos os pagamentos',
                    '`!forcedelivery <ID>` - Força entrega manual',
                    '`!syncpayments` - Sincroniza pagamentos',
                    '`!clear <quantidade>` - Limpa mensagens',
                    '`!status` - Status geral do bot',
                    '`!config` - Gerencia configurações',
                    '`!logs` - Visualiza logs do sistema'
                ].join('\n'),
                inline: false
            }
        );

        // Comandos técnicos
        embed.addFields(
            {
                name: '🔧 Comandos Técnicos',
                value: [
                    '`!testmp` - Testa Mercado Pago',
                    '`!mpstatus` - Status do Mercado Pago',
                    '`!testrcon` - Testa conexão RCON',
                    '`!rconstatus` - Status do RCON',
                    '`!rconreset` - Reseta conexão RCON',
                    '`!webcommand <cmd>` - Executa comando web',
                    '`!setwebcommand <cmd>` - Define comando web'
                ].join('\n'),
                inline: false
            }
        );

        // Comandos Slash
        embed.addFields(
            {
                name: '⚡ Comandos Slash',
                value: [
                    '`/venda` - Anuncia um produto',
                    '`/delproduct` - Remove um produto',
                    '`/vendas` - Estatísticas de vendas',
                    '`/linksteam` - Vincula conta Steam'
                ].join('\n'),
                inline: false
            }
        );

        // Informações adicionais
        embed.addFields(
            {
                name: '📝 Informações Importantes',
                value: [
                    '• Use `!shop` para ver o catálogo visual',
                    '• Clique nos botões dos produtos para comprar',
                    '• Tickets são criados em canais privados',
                    '• Comandos admin requerem permissão',
                    '• Use `!status` para ver o status geral'
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
            text: 'Bot Vendas MC - Mercado Pago Integration', 
            iconURL: message.client.user.displayAvatarURL() 
        });

        message.reply({ embeds: [embed], components: [row] });
    }
};
