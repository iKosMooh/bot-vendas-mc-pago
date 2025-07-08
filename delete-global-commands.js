const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log('Buscando comandos globais existentes...');
        const commands = await rest.get(Routes.applicationCommands(clientId));
        if (!commands.length) {
            console.log('Nenhum comando global encontrado.');
            return;
        }
        for (const command of commands) {
            await rest.delete(Routes.applicationCommand(clientId, command.id));
            console.log(`Comando removido: ${command.name}`);
        }
        console.log('Todos os comandos globais foram removidos!');
    } catch (error) {
        console.error(error);
    }
})();
