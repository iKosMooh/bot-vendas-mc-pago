const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { Rcon } = require('rcon-client');
const fs = require('fs');
const path = require('path');
const Utils = require('../utils/utils');
const { requireAdmin } = require('../utils/permissions');

const config = require('../config.json');
const prefix = config.prefix; // carrega o prefix do config.json

module.exports = {
    name: 'setrconchannel',
    description: 'Define o canal para comandos RCON',
    data: new SlashCommandBuilder()
        .setName('setrconchannel')
        .setDescription('Define o canal para comandos RCON')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal para comandos RCON')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('acao')
                .setDescription('Ação a ser realizada')
                .addChoices(
                    { name: 'Remover', value: 'remove' }
                )
                .setRequired(false)),
    async execute(interaction, args) {
        if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
            return this.executeSlash(interaction);
        }
        return this.executePrefix(interaction, args);
    },
    
    async executeSlash(interaction) {
        // Verificar permissões usando o sistema de permissões
        if (!(await requireAdmin(interaction, 'setrconchannel'))) {
            return;
        }

        const canal = interaction.options.getChannel('canal');
        const acao = interaction.options.getString('acao');

        if (acao === 'remove') {
            const channels = Utils.loadChannels();
            delete channels.rcon;
            Utils.saveChannels(channels);
            const embed = new EmbedBuilder()
                .setTitle('✅ Canal RCON Removido')
                .setDescription('O canal RCON foi removido das configurações.')
                .setColor('#ff9900')
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        if (!canal) {
            return interaction.reply({ content: '❌ Especifique um canal ou use a ação "remover"!', flags: 64 });
        }
        if (canal.type !== 0) { // GUILD_TEXT
            return interaction.reply({ content: '❌ O canal deve ser de texto!', flags: 64 });
        }

        const botPerms = canal.permissionsFor(interaction.guild.members.me);
        if (!botPerms.has(['ViewChannel','SendMessages','ReadMessageHistory'])) {
            return interaction.reply({ content: '❌ Preciso de permissão para Ver Canal, Enviar Mensagens e Ler Histórico.', flags: 64 });
        }

        try {
            const channels = Utils.loadChannels();
            channels.rcon = canal.id;
            Utils.saveChannels(channels);

            console.log(`✅ Canal RCON configurado: #${canal.name} (${canal.id}) por ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setTitle('✅ Canal RCON Configurado')
                .setDescription(`O canal ${canal} foi definido para comandos RCON.`)
                .addFields(
                    { name: 'Canal', value: canal.toString(), inline: true },
                    { name: 'ID', value: canal.id, inline: true },
                    { name: 'Categoria', value: canal.parent?.name ?? 'Sem categoria', inline: true },
                    { name: 'Como usar', value: 'Envie comandos diretamente no canal (sem prefixos)', inline: false },
                    { name: 'Permissões', value: 'Apenas administradores podem usar', inline: false }
                )
                .setColor('#00ff00')
                .setTimestamp();

            const confirmationEmbed = new EmbedBuilder()
                .setTitle('🎮 Canal RCON Ativado')
                .setDescription('Este canal agora recebe comandos RCON.')
                .addFields(
                    { name: '📋 Como usar', value: 'Envie comandos diretamente (exemplo: `clear`, `save`, `players`)', inline: false },
                    { name: '🔧 Comandos de teste', value: '`/testrcon`, `/rconstatus`, `/rconreset`', inline: false },
                    { name: '⚙️ Configuração', value: '`config.json` ➔ rcon: host, port, password', inline: false },
                    { name: '🛡️ Permissões', value: 'Apenas administradores podem executar comandos', inline: false }
                )
                .setColor('#0099ff')
                .setTimestamp();

            await canal.send({ embeds: [confirmationEmbed] });
            return interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.error('❌ Erro ao configurar canal RCON:', err);
            return interaction.reply({ content: '❌ Erro ao configurar canal RCON.', flags: 64 });
        }
    },
    
    async executePrefix(message, args) {
        if (!message.guild) {
            return message.reply('❌ Este comando só pode ser usado em servidores!');
        }
        
        // Verificar permissões usando o sistema de permissões
        if (!(await requireAdmin(message, 'setrconchannel'))) {
            return;
        }
        
        if (!args.length) {
            return message.reply('❌ Use: `$setrconchannel <#canal>` ou `$setrconchannel remove`');
        }

        const action = args[0].toLowerCase();
        if (action === 'remove') {
            try {
                const channels = Utils.loadChannels();
                delete channels.rcon;
                Utils.saveChannels(channels);
                console.log(`✅ Canal RCON removido por ${message.author.tag}`);
                return message.reply({ embeds: [
                    new EmbedBuilder()
                        .setTitle('✅ Canal RCON Removido')
                        .setDescription('O canal RCON foi removido.')
                        .setColor('#ff9900')
                        .setTimestamp()
                ]});
            } catch (err) {
                console.error('❌ Erro ao remover canal RCON:', err);
                return message.reply('❌ Erro ao remover canal RCON.');
            }
        }

        const channel = message.mentions.channels.first();
        if (!channel || channel.type !== 0) {
            return message.reply('❌ Mencione um canal de texto válido. Ex: `$setrconchannel #rcon`');
        }
        const botPerms = channel.permissionsFor(message.guild.members.me);
        if (!botPerms.has(['ViewChannel','SendMessages','ReadMessageHistory'])) {
            return message.reply('❌ Preciso de Ver Canal, Enviar Mensagens e Ler Histórico!');
        }

        try {
            const channels = Utils.loadChannels();
            channels.rcon = channel.id;
            Utils.saveChannels(channels);

            console.log(`✅ Canal RCON configurado: #${channel.name} (${channel.id}) por ${message.author.tag}`);

            await channel.send({
                embeds: [ new EmbedBuilder()
                    .setTitle('🎮 Canal RCON Ativado')
                    .setDescription('Este canal agora recebe comandos RCON.')
                    .addFields(
                        { name: '📋 Como usar', value: 'Envie comandos diretamente (exemplo: `clear`, `save`, `players`)', inline: false },
                        { name: '🔧 Comandos de teste', value: '`$testrcon`, `$rconstatus`, `$rconreset`', inline: false },
                        { name: '⚙️ Configuração', value: '`config.json` ➔ rcon: host, port, password', inline: false },
                        { name: '🛡️ Permissões', value: 'Apenas administradores podem executar comandos', inline: false }
                    )
                    .setColor('#0099ff')
                    .setTimestamp()
                ]
            });

            return message.reply({ embeds: [
                new EmbedBuilder()
                    .setTitle('✅ Canal RCON Configurado')
                    .setDescription(`O canal ${channel} foi definido para RCON.`)
                    .addFields(
                        { name: 'Canal', value: channel.toString(), inline: true },
                        { name: 'ID', value: channel.id, inline: true },
                        { name: 'Categoria', value: channel.parent?.name ?? 'Sem categoria', inline: true },
                        { name: 'Como usar', value: 'Envie comandos diretamente no canal (sem prefixos)', inline: false }
                    )
                    .setColor('#00ff00')
                    .setTimestamp()
            ]});

        } catch (err) {
            console.error('❌ Erro ao configurar canal RCON:', err);
            return message.reply('❌ Erro ao configurar canal RCON.');
        }
    },

    async handleMessage(message) {
        const channels = Utils.loadChannels();
        if (!channels.rcon || message.channel.id !== channels.rcon) return false;
        if (message.author.bot) return false;

        const content = message.content.trim();
        // ignora mensagens que comecem com o prefix configurado
        if (content.startsWith(prefix)) return false;

        // Verificar se o usuário tem permissão de admin
        const { requireAdmin } = require("../utils/permissions");
        if (!(await requireAdmin(message, 'comando RCON'))) {
            return true;
        }

        try {
            const config = require('../config.json');
            if (!config.rcon?.host || !config.rcon?.password) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Configuração RCON Ausente')
                    .setDescription('Configure o RCON no arquivo `config.json`')
                    .addFields(
                        { name: 'Campos necessários', value: '`rcon.host`, `rcon.port`, `rcon.password`', inline: false }
                    )
                    .setColor('#ff0000')
                    .setTimestamp();
                await message.reply({ embeds: [embed] });
                return true;
            }

            // Mostrar que o comando está sendo processado
            const processingEmbed = new EmbedBuilder()
                .setTitle('🔄 Processando Comando RCON...')
                .addFields(
                    { name: '📝 Comando', value: `\`\`\`${content}\`\`\``, inline: false }
                )
                .setColor('#ffaa00')
                .setTimestamp()
                .setFooter({ text: `Executado por ${message.author.tag}` });

            const processingMsg = await message.reply({ embeds: [processingEmbed] });

            const rcon = new Rcon({
                host: config.rcon.host,
                port: config.rcon.port || 27015,
                password: config.rcon.password,
                timeout: 10000
            });

            await rcon.connect();
            const response = await rcon.send(content);
            await rcon.end();

            // Atualizar a mensagem com o resultado
            const successEmbed = new EmbedBuilder()
                .setTitle('🎮 Comando RCON Executado')
                .addFields(
                    { name: '📝 Comando', value: `\`\`\`${content}\`\`\``, inline: false },
                    { name: '📤 Resposta', value: response ? `\`\`\`${response}\`\`\`` : '`Comando executado.`', inline: false }
                )
                .setColor('#00ff00')
                .setTimestamp()
                .setFooter({ text: `Executado por ${message.author.tag}` });

            await processingMsg.edit({ embeds: [successEmbed] });
            return true;

        } catch (err) {
            console.error('❌ Erro RCON:', err);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erro no Comando RCON')
                .addFields(
                    { name: '📝 Comando', value: `\`\`\`${content}\`\`\``, inline: false },
                    { name: '⚠️ Erro', value: `\`\`\`${err.message || 'Erro desconhecido'}\`\`\``, inline: false }
                )
                .setColor('#ff0000')
                .setTimestamp()
                .setFooter({ text: `Executado por ${message.author.tag}` });

            // Verificar se há uma mensagem para editar
            try {
                await message.reply({ embeds: [errorEmbed] });
            } catch (replyError) {
                console.error('❌ Erro ao enviar resposta de erro:', replyError);
            }
            
            return true;
        }
    },

    async syncOnReady(client) {
        const channels = Utils.loadChannels();
        if (channels.rcon) {
            try {
                const channel = await client.channels.fetch(channels.rcon);
                if (channel) {
                    console.log(`Canal RCON sincronizado: #${channel.name}`);
                }
            } catch (err) {
                console.error('Erro ao sincronizar canal RCON:', err);
            }
        }
    }
};
