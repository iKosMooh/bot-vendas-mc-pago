const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
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
    client.commands.set(command.name, command);
    if (command.data) commandsArray.push(command.data);
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
            } catch (guildError) {
                console.log(`⚠️ Não foi possível registrar comandos no servidor ${guildId}:`, guildError.message);
            }
        }
    } catch (error) {
        console.error('Erro ao registrar comandos de barra:', error);
    }
    // Sincronizar canal RCON automaticamente se configurado
    const rconCmd = client.commands.get('setrconchannel');
    if (rconCmd && typeof rconCmd.syncOnReady === 'function') {
        await rconCmd.syncOnReady(client);
    }
    
    // Iniciar verificações automáticas de pagamentos e produtos
    try {
        const { startExpiryChecker } = require('./utils/productDelivery');
        startExpiryChecker();
        console.log('✅ Verificações automáticas iniciadas');
    } catch (error) {
        console.error('❌ Erro ao iniciar verificações automáticas:', error);
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
            const { ticketHandler } = require('./utils/ticketHandler');
            await ticketHandler.handleButtonInteraction(interaction);
        } catch (error) {
            console.error('Erro ao processar botão:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Erro ao processar ação!', flags: 64 });
            }
        }
        return;
    }

    // Select Menu Interactions
    if (interaction.isStringSelectMenu()) {
        try {
            const { ticketHandler } = require('./utils/ticketHandler');
            await ticketHandler.handleSelectMenuInteraction(interaction);
        } catch (error) {
            console.error('Erro ao processar select menu:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Erro ao processar seleção!', flags: 64 });
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
        await rconCmd.handleMessage(message);
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
