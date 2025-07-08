const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'tickethelp',
    description: 'Mostra ajuda sobre o sistema de tickets',
    execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Sistema de Tickets - Ajuda')
            .setDescription('Comandos disponíveis para o sistema de tickets:')
            .addFields(
                {
                    name: '📝 Criar Ticket',
                    value: '`!createticket <motivo>` - Cria um novo ticket\nExemplo: `!createticket Problema com pagamento`',
                    inline: false
                },
                {
                    name: '📋 Listar Tickets',
                    value: '`!listtickets` - Lista todos os tickets ativos\n`!listtickets user @usuario` - Lista tickets de um usuário específico',
                    inline: false
                },
                {
                    name: '🔒 Fechar Ticket',
                    value: '`!closeticket` - Fecha o ticket atual (apenas no canal do ticket)\n`!closeticket <ID>` - Fecha ticket específico (Admin)',
                    inline: false
                },
                {
                    name: '⚡ Fechamento Forçado',
                    value: '`!forceclose <ID>` - Força fechamento de ticket (Admin apenas)\n`!forceclose all` - Fecha todos os tickets (Admin)',
                    inline: false
                },
                {
                    name: '🧪 Teste de Ticket',
                    value: '`!testticket` - Testa o sistema de tickets (Admin apenas)',
                    inline: false
                },
                {
                    name: '❓ Ajuda',
                    value: '`!tickethelp` - Mostra esta mensagem de ajuda',
                    inline: false
                }
            )
            .addFields(
                {
                    name: '📌 Informações Importantes',
                    value: '• Tickets são criados em canais privados\n• Apenas você e os administradores podem ver seu ticket\n• Tickets inativos por muito tempo podem ser fechados automaticamente\n• Use descrições claras ao criar tickets',
                    inline: false
                },
                {
                    name: '🎯 Categorias de Tickets',
                    value: '• **Pagamento** - Problemas com compras e pagamentos\n• **Entrega** - Problemas com entrega de produtos\n• **Suporte** - Dúvidas gerais e suporte técnico\n• **Outros** - Outros assuntos',
                    inline: false
                }
            )
            .setColor('#00ff00')
            .setFooter({ text: 'Sistema de Tickets - Bot Vendas MC', iconURL: message.client.user.displayAvatarURL() })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
