const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const Utils = require('../utils/utils');

module.exports = {
    name: 'setrconchannel',
    description: 'Define o canal para comandos RCON',
    async execute(message, args) {
        // Verificar permissões de administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Você precisa ter permissões de administrador para usar este comando!');
        }

        if (args.length === 0) {
            return message.reply('❌ Use: `!setrconchannel <#canal>` ou `!setrconchannel remove` para remover');
        }

        const action = args[0].toLowerCase();

        if (action === 'remove') {
            try {
                const channels = Utils.loadChannels();
                channels.rcon = "ID_DO_CANAL_RCON";
                Utils.saveChannels(channels);
                
                const embed = new EmbedBuilder()
                    .setTitle('✅ Canal RCON Removido')
                    .setDescription('O canal RCON foi removido das configurações.')
                    .setColor('#ff9900')
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('❌ Erro ao remover canal RCON:', error);
                return message.reply('❌ Erro ao remover canal RCON.');
            }
        }

        // Verificar se é um canal válido
        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply('❌ Por favor, mencione um canal válido! Exemplo: `!setrconchannel #rcon-commands`');
        }

        // Verificar se o canal é de texto
        if (channel.type !== 0) { // 0 = GUILD_TEXT
            return message.reply('❌ O canal deve ser um canal de texto!');
        }

        // Verificar se o bot tem permissões no canal
        const botPermissions = channel.permissionsFor(message.client.user);
        if (!botPermissions.has(['ViewChannel', 'SendMessages', 'ReadMessageHistory'])) {
            return message.reply('❌ Eu não tenho permissões suficientes neste canal! Preciso de: Ver Canal, Enviar Mensagens e Ler Histórico de Mensagens.');
        }

        try {
            const channels = Utils.loadChannels();
            channels.rcon = channel.id;
            Utils.saveChannels(channels);

            const embed = new EmbedBuilder()
                .setTitle('✅ Canal RCON Configurado')
                .setDescription(`O canal ${channel} foi definido como canal para comandos RCON.`)
                .addFields(
                    { name: '📋 Canal', value: channel.toString(), inline: true },
                    { name: '🆔 ID', value: channel.id, inline: true },
                    { name: '📍 Categoria', value: channel.parent ? channel.parent.name : 'Sem categoria', inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            // Enviar mensagem de confirmação no canal configurado
            const confirmationEmbed = new EmbedBuilder()
                .setTitle('🎮 Canal RCON Ativado')
                .setDescription('Este canal foi configurado para receber comandos RCON.')
                .addFields(
                    { name: '📝 Comandos Disponíveis', value: '`!testrcon` - Testa conexão RCON\n`!rconstatus` - Status da conexão\n`!rconreset` - Reseta conexão', inline: false },
                    { name: '⚙️ Configuração', value: 'Configure o RCON em `config.json` com host, porta e senha.', inline: false }
                )
                .setColor('#0099ff')
                .setTimestamp();

            await channel.send({ embeds: [confirmationEmbed] });
            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro ao configurar canal RCON:', error);
            message.reply('❌ Erro ao configurar canal RCON.');
        }
    }
};