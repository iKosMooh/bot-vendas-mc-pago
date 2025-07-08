const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'comandos');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        // Se for um builder, converte para JSON
        commands.push(command.data.toJSON ? command.data.toJSON() : command.data);
    } else {
        console.log(`[AVISO] O comando em ${filePath} está sem a propriedade "data" ou "execute".`);
    }
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Atualizando ${commands.length} comandos de barra (/) globalmente...`);
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );
        console.log(`Comandos globais atualizados com sucesso: ${data.length}`);
    } catch (error) {
        console.error(error);
    }
})();
