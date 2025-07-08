const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'profile',
    description: 'Mostra seu perfil e histórico de compras',
    execute(message, args) {
        const targetUser = message.mentions.users.first() || message.author;
        const isOwnProfile = targetUser.id === message.author.id;

        // Verificar permissões se estiver vendo perfil de outro usuário
        if (!isOwnProfile && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ Você não tem permissão para ver o perfil de outros usuários!');
        }

        // Carregar dados de pagamentos
        const paymentsPath = path.join(__dirname, '..', 'payments.json');
        const approvedPath = path.join(__dirname, '..', 'approved_purchases.json');
        const linksPath = path.join(__dirname, '..', 'links.json');

        let payments = [];
        let approvedPurchases = [];
        let links = [];

        try {
            if (fs.existsSync(paymentsPath)) {
                payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
            }
            if (fs.existsSync(approvedPath)) {
                approvedPurchases = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
            }
            if (fs.existsSync(linksPath)) {
                links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados do usuário:', error);
            return message.reply('❌ Erro interno ao carregar dados do perfil.');
        }

        // Filtrar dados do usuário
        const userPayments = payments.filter(p => p.userId === targetUser.id);
        const userApproved = approvedPurchases.filter(p => p.userId === targetUser.id);
        const userLink = links.find(l => l.userId === targetUser.id);

        // Calcular estatísticas
        const totalSpent = userApproved.reduce((sum, purchase) => sum + purchase.amount, 0);
        const totalPurchases = userApproved.length;
        const pendingPayments = userPayments.filter(p => p.status === 'pending').length;
        const approvedPayments = userApproved.length;
        const rejectedPayments = userPayments.filter(p => p.status === 'rejected').length;

        // Criar embed do perfil
        const embed = new EmbedBuilder()
            .setTitle(`👤 Perfil de ${targetUser.displayName}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setColor('#0099ff')
            .setTimestamp();

        // Informações básicas
        embed.addFields(
            {
                name: '📊 Estatísticas Gerais',
                value: `**Total Gasto:** R$ ${totalSpent.toFixed(2)}\n**Compras Realizadas:** ${totalPurchases}\n**Pagamentos Pendentes:** ${pendingPayments}`,
                inline: true
            },
            {
                name: '📈 Status dos Pagamentos',
                value: `**Aprovados:** ${approvedPayments}\n**Rejeitados:** ${rejectedPayments}\n**Pendentes:** ${pendingPayments}`,
                inline: true
            },
            {
                name: '🔗 Integração',
                value: userLink ? `**Steam:** Vinculado\n**Steam ID:** ${userLink.steamId}` : '**Steam:** Não vinculado',
                inline: true
            }
        );

        // Últimas compras
        if (userApproved.length > 0) {
            const recentPurchases = userApproved
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);

            const recentPurchasesText = recentPurchases.map(purchase => {
                const date = new Date(purchase.date).toLocaleDateString('pt-BR');
                return `• **${purchase.productName}** - R$ ${purchase.amount.toFixed(2)} (${date})`;
            }).join('\n');

            embed.addFields({
                name: '🛒 Últimas Compras',
                value: recentPurchasesText,
                inline: false
            });
        }

        // Pagamentos pendentes
        if (pendingPayments > 0) {
            const pendingList = userPayments
                .filter(p => p.status === 'pending')
                .slice(0, 3)
                .map(payment => {
                    const date = new Date(payment.date).toLocaleDateString('pt-BR');
                    return `• **${payment.productName}** - R$ ${payment.amount.toFixed(2)} (${date})`;
                }).join('\n');

            embed.addFields({
                name: '⏳ Pagamentos Pendentes',
                value: pendingList,
                inline: false
            });
        }

        // Botões de ação
        const components = [];
        if (isOwnProfile) {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('profile_purchases')
                        .setLabel('📋 Minhas Compras')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('profile_payments')
                        .setLabel('💳 Meus Pagamentos')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('profile_link')
                        .setLabel('🔗 Vincular Steam')
                        .setStyle(ButtonStyle.Secondary)
                );
            components.push(row);
        }

        embed.setFooter({ 
            text: isOwnProfile ? 'Seu perfil de compras' : `Perfil de ${targetUser.displayName}`,
            iconURL: message.client.user.displayAvatarURL()
        });

        message.reply({ embeds: [embed], components });
    }
};
