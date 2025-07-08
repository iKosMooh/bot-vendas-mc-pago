const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createticket')
        .setDescription('Sistema de tickets - Escolha entre reportar problema ou fazer compra'),

    async execute(interaction) {
        console.log(`🎫 Comando createticket executado por: ${interaction.user.tag}`);
        
        try {
            const embed = new EmbedBuilder()
                .setTitle('🎫 Sistema de Tickets')
                .setDescription('Escolha o tipo de ticket que deseja criar:')
                .addFields(
                    {
                        name: '🐛 Reportar Problema',
                        value: 'Para reportar bugs, problemas técnicos ou solicitar suporte geral',
                        inline: true
                    },
                    {
                        name: '🛒 Fazer Compra',
                        value: 'Para comprar produtos, ver catálogo ou esclarecer dúvidas sobre compras',
                        inline: true
                    },
                    {
                        name: 'ℹ️ Informação',
                        value: 'Você só pode ter um ticket aberto por vez. Se já possui um ticket ativo, feche-o antes de criar outro.',
                        inline: false
                    }
                )
                .setColor('#0099ff')
                .setFooter({ 
                    text: 'Sistema de Tickets - Bot Vendas MC'
                })
                .setTimestamp();

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket_report')
                        .setLabel('🐛 Reportar Problema')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('create_ticket_buy')
                        .setLabel('🛒 Fazer Compra')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.reply({
                embeds: [embed],
                components: [buttons]
            });

            console.log('✅ Menu de criação de tickets enviado');

        } catch (error) {
            console.error('❌ Erro ao executar createticket:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erro ao criar sistema de tickets. Tente novamente.'
                });
            }
        }
    }
};
