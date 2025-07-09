const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');

// Carregar configurações
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const prefix = config.prefix;

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.commands = new Collection();
const commandsArray = [];

// Carregar comandos da pasta ./comandos
const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./comandos/${file}`);
    
    // Se tem 'data', é um slash command
    if (command.data) {
        client.commands.set(command.data.name, command);
        commandsArray.push(command.data);
    } 
    // Se tem 'name', é um comando de prefixo
    else if (command.name) {
        client.commands.set(command.name, command);
    }
}

// Registrar comandos de barra (slash) na API do Discord
client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        // Primeiro tenta registrar como comandos globais
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsArray }
        );
        console.log('✅ Comandos de barra registrados globalmente!');
        
        // Também registra para servidores específicos para atualizações instantâneas
        const guilds = client.guilds.cache.map(guild => guild.id);
        for (const guildId of guilds) {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guildId),
                    { body: commandsArray }
                );
                console.log(`✅ Comandos registrados no servidor: ${guildId}`);
            } catch (error) {
                console.error(`❌ Erro ao registrar comandos no servidor ${guildId}:`, error);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }

    // Inicializar verificações automáticas
    try {
        const productDelivery = require('./utils/productDelivery');
        
        // Verificações a cada 5 minutos
        setInterval(async () => {
            try {
                await productDelivery.checkExpiredProducts();
                await productDelivery.checkExpiredProductsForRemoval();
            } catch (error) {
                console.error('❌ Erro nas verificações automáticas:', error);
            }
        }, 5 * 60 * 1000);

        console.log('✅ Verificações automáticas iniciadas');
    } catch (error) {
        console.error('❌ Erro ao iniciar verificações automáticas:', error);
    }

    // Inicializar monitoramento de servidor
    try {
        const { startServerMonitoring } = require('./utils/serverMonitor');
        startServerMonitoring(client);
        console.log('✅ Sistema de monitoramento de servidor iniciado');
    } catch (error) {
        console.error('❌ Erro ao iniciar monitoramento de servidor:', error);
    }
    
    // Configurar status do bot
    try {
        // Tentar obter o nome do servidor configurado no monitoramento
        const Utils = require('./utils/utils');
        const channels = Utils.loadChannels();
        
        let serverName = 'Unturned';
        if (channels.serverMonitor && channels.serverMonitor.serverName) {
            serverName = `Unturned ${channels.serverMonitor.serverName}`;
        }
        
        client.user.setActivity(serverName, { type: ActivityType.Playing });
        console.log(`✅ Status do bot configurado: Jogando ${serverName}`);
    } catch (error) {
        console.error('❌ Erro ao configurar status do bot:', error);
        // Fallback para status padrão
        try {
            client.user.setActivity('Unturned Z-StarV', { type: ActivityType.Playing });
        } catch (fallbackError) {
            console.error('❌ Erro no fallback do status:', fallbackError);
        }
    }
    
    console.log(`🔥 ${client.user.displayName || client.user.tag} Iniciado`);
});

// Comandos de barra e outras interações
client.on('interactionCreate', async interaction => {
    // Slash Commands
    if (interaction.isChatInputCommand()) {
        console.log(`🔧 Executando slash command: ${interaction.commandName}`);
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.log(`❌ Comando não encontrado: ${interaction.commandName}`);
            return;
        }
        try {
            if (command.name === 'help') {
                await command.execute(interaction, Array.from(client.commands.values()));
            } else {
                await command.execute(interaction);
            }
        } catch (error) {
            console.error('Erro ao executar comando:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Houve um erro ao executar este comando!', flags: 64 });
            }
        }
        return;
    }

    // Button Interactions
    if (interaction.isButton()) {
        try {
            const ticketHandler = require('./utils/ticketHandler');
            await ticketHandler.handleButtonInteraction(interaction);
        } catch (error) {
            console.error('Erro ao processar botão:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Erro ao processar ação!', flags: 64 });
                } else {
                    await interaction.followUp({ content: 'Erro ao processar ação!', flags: 64 });
                }
            } catch (replyError) {
                console.error('Erro ao responder interação de botão:', replyError.message);
            }
        }
        return;
    }

    // Select Menu Interactions
    if (interaction.isStringSelectMenu()) {
        try {
            const ticketHandler = require('./utils/ticketHandler');
            await ticketHandler.handleSelectMenuInteraction(interaction);
        } catch (error) {
            console.error('Erro ao processar select menu:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Erro ao processar seleção!', flags: 64 });
                } else {
                    await interaction.followUp({ content: 'Erro ao processar seleção!', flags: 64 });
                }
            } catch (replyError) {
                console.error('Erro ao responder interação de select menu:', replyError.message);
            }
        }
        return;
    }
});

// Comandos por prefixo (mensagem) e integração RCON
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // RCON: se o comando setrconchannel estiver carregado, delega para ele
    const rconCmd = client.commands.get('setrconchannel');
    if (rconCmd && typeof rconCmd.handleMessage === 'function') {
        try {
            const handled = await rconCmd.handleMessage(message);
            if (handled) return; // Se foi processado pelo RCON, não processar como comando normal
        } catch (error) {
            console.error('❌ Erro ao processar mensagem RCON:', error);
        }
    }
    
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (!command) return;
    try {
        if (command.name === 'help') {
            // Simular interação para listar comandos
            await command.execute({
                reply: (msg) => message.channel.send(msg),
                user: message.author,
                channel: message.channel
            }, Array.from(client.commands.values()));
        } else {
            await command.execute({
                reply: (msg) => message.channel.send(msg),
                user: message.author,
                channel: message.channel
            }, args);
        }
    } catch (error) {
        console.error(error);
        message.channel.send('Houve um erro ao executar este comando!');
    }
});

client.login(config.token);
