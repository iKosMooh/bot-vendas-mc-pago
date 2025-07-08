const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { requireAdmin } = require("../utils/permissions");

module.exports = {
    name: 'config',
    description: 'Gerencia as configurações do bot',
    execute(message, args) {
        // Verificar permissões de administrador
        if (!requireAdmin(message, 'o comando config')) {
            return;
        }
        
        // Verificar permissões de administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Você precisa ter permissões de administrador para usar este comando!');
        }

        if (args.length === 0) {
            // Mostrar configurações atuais
            const configPath = path.join(__dirname, '..', 'config.json');
            let config = {};
            
            if (fs.existsSync(configPath)) {
                try {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                } catch (error) {
                    console.error('❌ Erro ao ler config.json:', error);
                    return message.reply('❌ Erro ao carregar configurações.');
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('⚙️ Configurações do Bot')
                .setDescription('Configurações atuais do sistema:')
                .setColor('#0099ff')
                .setTimestamp();

            // Configurações do bot
            embed.addFields(
                {
                    name: '🤖 Bot',
                    value: `**Token:** ${config.token ? '✅ Configurado' : '❌ Não configurado'}\n**Prefixo:** ${config.prefix || '!'}`,
                    inline: true
                },
                {
                    name: '💳 Mercado Pago',
                    value: `**Access Token:** ${config.mercadoPago?.accessToken ? '✅ Configurado' : '❌ Não configurado'}\n**Webhook:** ${config.mercadoPago?.webhook ? '✅ Configurado' : '❌ Não configurado'}`,
                    inline: true
                },
                {
                    name: '🎮 RCON',
                    value: `**Host:** ${config.rcon?.host || 'Não configurado'}\n**Porta:** ${config.rcon?.port || 'Não configurado'}\n**Senha:** ${config.rcon?.password ? '✅ Configurado' : '❌ Não configurado'}`,
                    inline: true
                },
                {
                    name: '🔧 Steam API',
                    value: `**API Key:** ${config.steam?.apiKey ? '✅ Configurado' : '❌ Não configurado'}`,
                    inline: true
                },
                {
                    name: '📊 Logs',
                    value: `**Canal de Logs:** ${config.channels?.logs || 'Não configurado'}\n**Canal de Vendas:** ${config.channels?.sales || 'Não configurado'}`,
                    inline: true
                },
                {
                    name: '🛡️ Segurança',
                    value: `**Auto-deletar QR:** ${config.security?.autoDeleteQR !== false ? '✅ Habilitado' : '❌ Desabilitado'}\n**Timeout Pagamento:** ${config.security?.paymentTimeout || '120'} segundos`,
                    inline: true
                }
            );

            // Botões de ação
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('config_edit')
                        .setLabel('✏️ Editar')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('config_backup')
                        .setLabel('💾 Backup')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('config_reset')
                        .setLabel('🔄 Reset')
                        .setStyle(ButtonStyle.Danger)
                );

            embed.setFooter({ 
                text: 'Use !config set <chave> <valor> para alterar configurações',
                iconURL: message.client.user.displayAvatarURL()
            });

            return message.reply({ embeds: [embed], components: [row] });
        }

        const subcommand = args[0].toLowerCase();

        switch (subcommand) {
            case 'set':
                if (args.length < 3) {
                    return message.reply('❌ Use: `!config set <chave> <valor>`\n\nExemplos:\n`!config set prefix $`\n`!config set mercadoPago.accessToken SEU_TOKEN`');
                }

                const key = args[1];
                const value = args.slice(2).join(' ');

                try {
                    const configPath = path.join(__dirname, '..', 'config.json');
                    let config = {};
                    
                    if (fs.existsSync(configPath)) {
                        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    }

                    // Settar configuração usando notação de ponto
                    const keys = key.split('.');
                    let current = config;
                    
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (!current[keys[i]]) current[keys[i]] = {};
                        current = current[keys[i]];
                    }
                    
                    current[keys[keys.length - 1]] = value;

                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

                    const embed = new EmbedBuilder()
                        .setTitle('✅ Configuração Atualizada')
                        .setDescription(`Configuração \`${key}\` foi definida para \`${value}\``)
                        .setColor('#00ff00')
                        .setTimestamp();

                    message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('❌ Erro ao salvar configuração:', error);
                    message.reply('❌ Erro ao salvar configuração.');
                }
                break;

            case 'get':
                if (args.length < 2) {
                    return message.reply('❌ Use: `!config get <chave>`\n\nExemplos:\n`!config get prefix`\n`!config get mercadoPago.accessToken`');
                }

                const getKey = args[1];

                try {
                    const configPath = path.join(__dirname, '..', 'config.json');
                    let config = {};
                    
                    if (fs.existsSync(configPath)) {
                        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    }

                    // Obter configuração usando notação de ponto
                    const keys = getKey.split('.');
                    let current = config;
                    
                    for (const key of keys) {
                        if (current[key] === undefined) {
                            return message.reply(`❌ Configuração \`${getKey}\` não encontrada.`);
                        }
                        current = current[key];
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('📋 Configuração')
                        .setDescription(`**${getKey}:** \`${current}\``)
                        .setColor('#0099ff')
                        .setTimestamp();

                    message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('❌ Erro ao obter configuração:', error);
                    message.reply('❌ Erro ao obter configuração.');
                }
                break;

            case 'remove':
                if (args.length < 2) {
                    return message.reply('❌ Use: `!config remove <chave>`');
                }

                const removeKey = args[1];

                try {
                    const configPath = path.join(__dirname, '..', 'config.json');
                    let config = {};
                    
                    if (fs.existsSync(configPath)) {
                        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    }

                    // Remover configuração usando notação de ponto
                    const keys = removeKey.split('.');
                    let current = config;
                    
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (!current[keys[i]]) {
                            return message.reply(`❌ Configuração \`${removeKey}\` não encontrada.`);
                        }
                        current = current[keys[i]];
                    }

                    if (current[keys[keys.length - 1]] === undefined) {
                        return message.reply(`❌ Configuração \`${removeKey}\` não encontrada.`);
                    }

                    delete current[keys[keys.length - 1]];

                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

                    const embed = new EmbedBuilder()
                        .setTitle('✅ Configuração Removida')
                        .setDescription(`Configuração \`${removeKey}\` foi removida.`)
                        .setColor('#ff9900')
                        .setTimestamp();

                    message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('❌ Erro ao remover configuração:', error);
                    message.reply('❌ Erro ao remover configuração.');
                }
                break;

            case 'backup':
                try {
                    const configPath = path.join(__dirname, '..', 'config.json');
                    const backupPath = path.join(__dirname, '..', `config_backup_${Date.now()}.json`);
                    
                    if (fs.existsSync(configPath)) {
                        fs.copyFileSync(configPath, backupPath);
                        
                        const embed = new EmbedBuilder()
                            .setTitle('✅ Backup Criado')
                            .setDescription(`Backup das configurações salvo em \`${path.basename(backupPath)}\``)
                            .setColor('#00ff00')
                            .setTimestamp();

                        message.reply({ embeds: [embed] });
                    } else {
                        message.reply('❌ Arquivo de configuração não encontrado.');
                    }
                } catch (error) {
                    console.error('❌ Erro ao criar backup:', error);
                    message.reply('❌ Erro ao criar backup.');
                }
                break;

            default:
                const embed = new EmbedBuilder()
                    .setTitle('❓ Ajuda - Configurações')
                    .setDescription('Comandos disponíveis:')
                    .addFields(
                        { name: '`!config`', value: 'Mostra todas as configurações', inline: false },
                        { name: '`!config set <chave> <valor>`', value: 'Define uma configuração', inline: false },
                        { name: '`!config get <chave>`', value: 'Obtém uma configuração', inline: false },
                        { name: '`!config remove <chave>`', value: 'Remove uma configuração', inline: false },
                        { name: '`!config backup`', value: 'Cria backup das configurações', inline: false }
                    )
                    .setColor('#0099ff')
                    .setTimestamp();

                message.reply({ embeds: [embed] });
        }
    }
};
