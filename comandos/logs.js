const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'logs',
    description: 'Gerencia e visualiza logs do sistema',
    execute(message, args) {
        // Verificar permissões de administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Você precisa ter permissões de administrador para usar este comando!');
        }

        if (args.length === 0) {
            // Mostrar menu de logs
            const embed = new EmbedBuilder()
                .setTitle('📜 Sistema de Logs')
                .setDescription('Selecione o tipo de log que deseja visualizar:')
                .setColor('#0099ff')
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('logs_payments')
                        .setLabel('💳 Pagamentos')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('logs_purchases')
                        .setLabel('🛒 Compras')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('logs_tickets')
                        .setLabel('🎫 Tickets')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('logs_errors')
                        .setLabel('❌ Erros')
                        .setStyle(ButtonStyle.Danger)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('logs_clear')
                        .setLabel('🗑️ Limpar Logs')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('logs_export')
                        .setLabel('📤 Exportar')
                        .setStyle(ButtonStyle.Secondary)
                );

            return message.reply({ embeds: [embed], components: [row, row2] });
        }

        const subcommand = args[0].toLowerCase();

        switch (subcommand) {
            case 'payments':
                showPaymentLogs(message);
                break;

            case 'purchases':
                showPurchaseLogs(message);
                break;

            case 'tickets':
                showTicketLogs(message);
                break;

            case 'errors':
                showErrorLogs(message);
                break;

            case 'clear':
                if (args.length < 2) {
                    return message.reply('❌ Use: `!logs clear <tipo>`\nTipos: payments, purchases, tickets, errors, all');
                }
                clearLogs(message, args[1]);
                break;

            case 'export':
                exportLogs(message);
                break;

            default:
                message.reply('❌ Subcomando inválido. Use: `!logs` para ver o menu.');
        }
    }
};

function showPaymentLogs(message) {
    const paymentsPath = path.join(__dirname, '..', 'payments.json');
    
    if (!fs.existsSync(paymentsPath)) {
        return message.reply('❌ Nenhum log de pagamentos encontrado.');
    }

    try {
        const payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
        const paymentArray = Object.keys(payments).map(id => ({ id, ...payments[id] }));
        
        if (paymentArray.length === 0) {
            return message.reply('❌ Nenhum pagamento registrado.');
        }

        // Estatísticas
        const totalPayments = paymentArray.length;
        const pendingPayments = paymentArray.filter(p => p.status === 'pending').length;
        const approvedPayments = paymentArray.filter(p => p.status === 'approved').length;
        const rejectedPayments = paymentArray.filter(p => p.status === 'rejected').length;

        const embed = new EmbedBuilder()
            .setTitle('💳 Logs de Pagamentos')
            .setDescription(`Resumo dos pagamentos registrados:`)
            .addFields(
                { name: '📊 Estatísticas', value: `**Total:** ${totalPayments}\n**Pendentes:** ${pendingPayments}\n**Aprovados:** ${approvedPayments}\n**Rejeitados:** ${rejectedPayments}`, inline: true }
            )
            .setColor('#0099ff')
            .setTimestamp();

        // Mostrar últimos 5 pagamentos
        const recentPayments = paymentArray
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        recentPayments.forEach((payment, index) => {
            const statusEmoji = payment.status === 'approved' ? '✅' : payment.status === 'pending' ? '⏳' : '❌';
            const date = new Date(payment.date).toLocaleDateString('pt-BR');
            
            embed.addFields({
                name: `${statusEmoji} ${payment.id}`,
                value: `**Usuário:** ${payment.username}\n**Produto:** ${payment.product}\n**Valor:** R$ ${payment.amount}\n**Data:** ${date}`,
                inline: true
            });
        });

        message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Erro ao ler logs de pagamentos:', error);
        message.reply('❌ Erro ao carregar logs de pagamentos.');
    }
}

function showPurchaseLogs(message) {
    const purchasesPath = path.join(__dirname, '..', 'approved_purchases.json');
    
    if (!fs.existsSync(purchasesPath)) {
        return message.reply('❌ Nenhum log de compras encontrado.');
    }

    try {
        const purchases = JSON.parse(fs.readFileSync(purchasesPath, 'utf8'));
        const purchaseArray = Object.keys(purchases).map(id => ({ id, ...purchases[id] }));
        
        if (purchaseArray.length === 0) {
            return message.reply('❌ Nenhuma compra registrada.');
        }

        // Estatísticas
        const totalPurchases = purchaseArray.length;
        const totalRevenue = purchaseArray.reduce((sum, p) => sum + p.amount, 0);
        const avgPurchase = totalRevenue / totalPurchases;

        const embed = new EmbedBuilder()
            .setTitle('🛒 Logs de Compras Aprovadas')
            .setDescription(`Resumo das compras aprovadas:`)
            .addFields(
                { name: '📊 Estatísticas', value: `**Total:** ${totalPurchases}\n**Receita:** R$ ${totalRevenue.toFixed(2)}\n**Média:** R$ ${avgPurchase.toFixed(2)}`, inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();

        // Mostrar últimas 5 compras
        const recentPurchases = purchaseArray
            .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt))
            .slice(0, 5);

        recentPurchases.forEach((purchase, index) => {
            const date = new Date(purchase.approvedAt).toLocaleDateString('pt-BR');
            
            embed.addFields({
                name: `✅ ${purchase.id}`,
                value: `**Usuário:** ${purchase.username}\n**Produto:** ${purchase.product}\n**Valor:** R$ ${purchase.amount}\n**Data:** ${date}`,
                inline: true
            });
        });

        message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Erro ao ler logs de compras:', error);
        message.reply('❌ Erro ao carregar logs de compras.');
    }
}

function showTicketLogs(message) {
    const embed = new EmbedBuilder()
        .setTitle('🎫 Logs de Tickets')
        .setDescription('Funcionalidade de logs de tickets em desenvolvimento.')
        .setColor('#ffff00')
        .setTimestamp();

    message.reply({ embeds: [embed] });
}

function showErrorLogs(message) {
    const embed = new EmbedBuilder()
        .setTitle('❌ Logs de Erros')
        .setDescription('Funcionalidade de logs de erros em desenvolvimento.')
        .setColor('#ff0000')
        .setTimestamp();

    message.reply({ embeds: [embed] });
}

function clearLogs(message, type) {
    const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirmar Limpeza de Logs')
        .setDescription(`Tem certeza que deseja limpar os logs de **${type}**?`)
        .setColor('#ff9900')
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_clear_${type}`)
                .setLabel('✅ Confirmar')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_clear')
                .setLabel('❌ Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

    message.reply({ embeds: [confirmEmbed], components: [row] });
}

function exportLogs(message) {
    const embed = new EmbedBuilder()
        .setTitle('📤 Exportar Logs')
        .setDescription('Funcionalidade de exportação de logs em desenvolvimento.')
        .setColor('#0099ff')
        .setTimestamp();

    message.reply({ embeds: [embed] });
}
