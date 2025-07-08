const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const Utils = require('../utils/utils');

module.exports = {
    name: 'setchannels',
    description: 'Configura os canais do sistema',
    async execute(message, args) {
        // Verificar permissões de administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Você precisa ter permissões de administrador para usar este comando!');
        }

        if (args.length === 0) {
            // Mostrar configuração atual
            const channels = Utils.loadChannels();
            const embed = new EmbedBuilder()
                .setTitle('🔧 Configuração de Canais')
                .setDescription('Configuração atual dos canais do sistema:')
                .addFields(
                    { name: '📋 Logs', value: channels.logs === 'ID_DO_CANAL_DE_LOGS' ? '❌ Não configurado' : `<#${channels.logs}>`, inline: true },
                    { name: '🎫 Tickets', value: channels.tickets === 'ID_DO_CANAL_DE_TICKETS' ? '❌ Não configurado' : `<#${channels.tickets}>`, inline: true },
                    { name: '🛍️ Shop', value: channels.shop === 'ID_DO_CANAL_DA_LOJA' ? '❌ Não configurado' : `<#${channels.shop}>`, inline: true },
                    { name: '🎮 RCON', value: channels.rcon === 'ID_DO_CANAL_RCON' ? '❌ Não configurado' : `<#${channels.rcon}>`, inline: true }
                )
                .addFields({ 
                    name: '📖 Como usar', 
                    value: '`!setchannels logs <#canal>` - Configurar canal de logs\n`!setchannels tickets <#canal>` - Configurar canal de tickets\n`!setchannels shop <#canal>` - Configurar canal da loja\n`!setchannels rcon <#canal>` - Configurar canal RCON',
                    inline: false
                })
                .setColor('#0099ff')
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        const type = args[0].toLowerCase();
        const validTypes = ['logs', 'tickets', 'shop', 'rcon'];

        if (!validTypes.includes(type)) {
            return message.reply('❌ Tipo de canal inválido! Use: `logs`, `tickets`, `shop` ou `rcon`');
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply('❌ Você precisa mencionar um canal válido!');
        }

        // Verificar se o bot tem permissões no canal
        const botPermissions = channel.permissionsFor(message.guild.members.me);
        if (!botPermissions.has(['ViewChannel', 'SendMessages'])) {
            return message.reply('❌ Eu não tenho permissões suficientes neste canal! Preciso de: Ver Canal e Enviar Mensagens.');
        }

        try {
            const channels = Utils.loadChannels();
            channels[type] = channel.id;
            Utils.saveChannels(channels);

            const embed = new EmbedBuilder()
                .setTitle('✅ Canal Configurado')
                .setDescription(`O canal ${channel} foi configurado como canal de **${type}**.`)
                .addFields(
                    { name: '📋 Tipo', value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
                    { name: '🆔 ID', value: channel.id, inline: true },
                    { name: '📍 Categoria', value: channel.parent ? channel.parent.name : 'Sem categoria', inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // Enviar confirmação no canal configurado
            const confirmationEmbed = new EmbedBuilder()
                .setTitle(`✅ Canal ${type.charAt(0).toUpperCase() + type.slice(1)} Configurado`)
                .setDescription(`Este canal foi configurado para receber mensagens de **${type}**.`)
                .setColor('#00ff00')
                .setTimestamp();

            await channel.send({ embeds: [confirmationEmbed] });

        } catch (error) {
            console.error('❌ Erro ao configurar canal:', error);
            message.reply('❌ Erro ao configurar canal.');
        }
    }
};
