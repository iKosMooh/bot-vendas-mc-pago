const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'forceexpire',
    description: 'Força a expiração de pagamentos pendentes',
    async execute(message, args) {
        // Verificar permissões de administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Você precisa ter permissões de administrador para usar este comando!');
        }

        const paymentsPath = path.join(__dirname, '..', 'payments.json');
        
        if (!fs.existsSync(paymentsPath)) {
            return message.reply('❌ Nenhum pagamento encontrado no sistema.');
        }

        try {
            let payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
            
            if (args.length === 0) {
                // Mostrar pagamentos pendentes
                const pendingPayments = payments.filter(p => p.status === 'pending');
                
                if (pendingPayments.length === 0) {
                    return message.reply('❌ Nenhum pagamento pendente encontrado.');
                }

                const embed = new EmbedBuilder()
                    .setTitle('⏳ Pagamentos Pendentes')
                    .setDescription(`Encontrados ${pendingPayments.length} pagamentos pendentes:`)
                    .setColor('#ffff00')
                    .setTimestamp();

                pendingPayments.slice(0, 10).forEach((payment, index) => {
                    const date = new Date(payment.date).toLocaleString('pt-BR');
                    const timeDiff = Date.now() - new Date(payment.date).getTime();
                    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
                    
                    embed.addFields({
                        name: `💳 ID: ${payment.id || 'N/A'}`,
                        value: `**Usuário:** ${payment.username}\n**Produto:** ${payment.product}\n**Valor:** R$ ${payment.amount}\n**Criado:** ${date} (${hoursAgo}h atrás)`,
                        inline: true
                    });
                });

                embed.addFields({
                    name: '📋 Comandos Disponíveis',
                    value: '`!forceexpire <ID>` - Expira pagamento específico\n`!forceexpire all` - Expira todos os pendentes\n`!forceexpire old` - Expira pagamentos antigos (>24h)',
                    inline: false
                });

                return message.reply({ embeds: [embed] });
            }

            const action = args[0].toLowerCase();

            if (action === 'all') {
                // Expirar todos os pagamentos pendentes
                const pendingPayments = payments.filter(p => p.status === 'pending');
                
                if (pendingPayments.length === 0) {
                    return message.reply('❌ Nenhum pagamento pendente encontrado.');
                }

                // Confirmar expiração
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Confirmação de Expiração')
                    .setDescription(`Tem certeza que deseja expirar **TODOS** os ${pendingPayments.length} pagamentos pendentes?`)
                    .setColor('#ff9900')
                    .setTimestamp();

                const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
                await confirmMessage.react('✅');
                await confirmMessage.react('❌');

                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };

                const collector = confirmMessage.createReactionCollector({ filter, time: 30000 });

                collector.on('collect', async (reaction, user) => {
                    if (reaction.emoji.name === '✅') {
                        // Expirar todos os pagamentos pendentes
                        payments.forEach(payment => {
                            if (payment.status === 'pending') {
                                payment.status = 'expired';
                                payment.expiredAt = new Date().toISOString();
                                payment.expiredBy = message.author.id;
                            }
                        });
                        
                        fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));
                        
                        const successEmbed = new EmbedBuilder()
                            .setTitle('⏰ Pagamentos Expirados')
                            .setDescription(`${pendingPayments.length} pagamentos foram expirados com sucesso!`)
                            .setColor('#ff0000')
                            .setTimestamp();

                        await confirmMessage.edit({ embeds: [successEmbed], components: [] });
                        collector.stop();
                    } else if (reaction.emoji.name === '❌') {
                        const cancelEmbed = new EmbedBuilder()
                            .setTitle('❌ Operação Cancelada')
                            .setDescription('Expiração de pagamentos cancelada.')
                            .setColor('#ff9900')
                            .setTimestamp();

                        await confirmMessage.edit({ embeds: [cancelEmbed], components: [] });
                        collector.stop();
                    }
                });

                return;
            }

            if (action === 'old') {
                // Expirar pagamentos antigos (mais de 24 horas)
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                const oldPayments = payments.filter(p => 
                    p.status === 'pending' && new Date(p.date).getTime() < oneDayAgo
                );

                if (oldPayments.length === 0) {
                    return message.reply('❌ Nenhum pagamento antigo (>24h) encontrado.');
                }

                // Expirar pagamentos antigos
                payments.forEach(payment => {
                    if (payment.status === 'pending' && new Date(payment.date).getTime() < oneDayAgo) {
                        payment.status = 'expired';
                        payment.expiredAt = new Date().toISOString();
                        payment.expiredBy = message.author.id;
                        payment.expiredReason = 'Automatic expiration (>24h)';
                    }
                });

                fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));

                const embed = new EmbedBuilder()
                    .setTitle('⏰ Pagamentos Antigos Expirados')
                    .setDescription(`${oldPayments.length} pagamentos antigos (>24h) foram expirados automaticamente.`)
                    .setColor('#ff0000')
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Expirar pagamento específico
            const paymentId = args[0];
            const paymentIndex = payments.findIndex(p => p.id === paymentId);
            
            if (paymentIndex === -1) {
                return message.reply('❌ Pagamento não encontrado!');
            }

            const payment = payments[paymentIndex];
            
            if (payment.status !== 'pending') {
                return message.reply(`❌ Este pagamento já está com status: **${payment.status}**`);
            }

            // Expirar pagamento
            payment.status = 'expired';
            payment.expiredAt = new Date().toISOString();
            payment.expiredBy = message.author.id;
            payment.expiredReason = 'Manual expiration by admin';

            fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('⏰ Pagamento Expirado')
                .setDescription(`O pagamento foi expirado com sucesso.`)
                .addFields(
                    { name: '🆔 ID', value: payment.id || 'N/A', inline: true },
                    { name: '👤 Usuário', value: payment.username, inline: true },
                    { name: '💰 Valor', value: `R$ ${payment.amount}`, inline: true },
                    { name: '📦 Produto', value: payment.product, inline: true },
                    { name: '📅 Criado em', value: new Date(payment.date).toLocaleString('pt-BR'), inline: true },
                    { name: '⏰ Expirado em', value: new Date(payment.expiredAt).toLocaleString('pt-BR'), inline: true }
                )
                .setColor('#ff0000')
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // Log da expiração
            console.log(`⏰ Pagamento expirado: ${payment.id} (${payment.username}) por ${message.author.username}`);

        } catch (error) {
            console.error('❌ Erro ao expirar pagamento:', error);
            message.reply('❌ Erro interno ao expirar pagamento.');
        }
    }
};