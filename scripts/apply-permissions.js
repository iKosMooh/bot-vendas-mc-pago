/**
 * Script para aplicar verificações de permissão em comandos administrativos
 * Execute este script para atualizar automaticamente os comandos
 */

const fs = require('fs');
const path = require('path');

// Lista de comandos que precisam de verificação de admin
const adminCommands = [
    'addproduct',
    'listpayments', 
    'listapproved',
    'purchasestats',
    'clearpayments',
    'forcedelivery',
    'forceexpire',
    'forceremoval',
    'syncpayments',
    'clear',
    'config',
    'logs',
    'setchannels',
    'setrconchannel',
    'testmp',
    'mpstatus',
    'testrcon',
    'rconstatus', 
    'rconreset',
    'webcommand',
    'setwebcommand',
    'listtickets',
    'forceclose',
    'testticket'
];

// Função para adicionar verificação de permissão a um arquivo
function addPermissionCheck(filePath, commandName) {
    if (!fs.existsSync(filePath)) {
        console.log(`❌ Arquivo não encontrado: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar se já tem a importação do permissions
    if (!content.includes('require("../utils/permissions")') && !content.includes('require("../../utils/permissions")')) {
        // Determinar o caminho correto baseado na localização do arquivo
        const isInSubfolder = filePath.includes('ComandosSlash');
        const requirePath = isInSubfolder ? '../../utils/permissions' : '../utils/permissions';
        
        // Adicionar import
        const lines = content.split('\n');
        let insertIndex = -1;
        
        // Encontrar onde inserir o require
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('require(') && !lines[i].includes('discord.js')) {
                insertIndex = i + 1;
            }
        }
        
        if (insertIndex === -1) {
            // Se não encontrou, inserir após discord.js
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('require("discord.js")') || lines[i].includes("require('discord.js')")) {
                    insertIndex = i + 1;
                    break;
                }
            }
        }
        
        if (insertIndex !== -1) {
            lines.splice(insertIndex, 0, `const { requireAdmin } = require("${requirePath}");`);
            content = lines.join('\n');
        }
    }
    
    // Verificar se já tem a verificação de permissão
    if (!content.includes('requireAdmin(')) {
        // Adicionar verificação no início da função execute ou run
        if (content.includes('execute(message')) {
            // Comando de mensagem
            content = content.replace(
                /execute\(message[^{]*\{/,
                `execute(message, args) {
        // Verificar permissões de administrador
        if (!requireAdmin(message, 'o comando ${commandName}')) {
            return;
        }
        `
            );
        } else if (content.includes('async execute(interaction)') || content.includes('async run(client, interaction)')) {
            // Comando slash
            const pattern = /(async (?:execute|run)\([^{]*\{)/;
            content = content.replace(
                pattern,
                `$1
        // Verificar permissões de administrador
        if (!requireAdmin({ member: interaction.member, reply: interaction.reply.bind(interaction) }, 'o comando ${commandName}')) {
            return;
        }
        `
            );
        }
    }
    
    // Salvar o arquivo atualizado
    fs.writeFileSync(filePath, content);
    console.log(`✅ Atualizado: ${commandName}`);
}

// Aplicar para comandos normais
console.log('🔄 Aplicando verificações de permissão...\n');

adminCommands.forEach(commandName => {
    const filePath = path.join(__dirname, '..', 'comandos', `${commandName}.js`);
    addPermissionCheck(filePath, commandName);
});

// Aplicar para comandos slash admin
const slashAdminCommands = ['delproduct', 'vendas', 'linksteam'];
slashAdminCommands.forEach(commandName => {
    const filePath = path.join(__dirname, '..', 'ComandosSlash', 'admin', `${commandName}.js`);
    addPermissionCheck(filePath, commandName);
});

console.log('\n🎉 Script de permissões concluído!');
console.log('\n📋 Resumo das alterações:');
console.log(`• ${adminCommands.length} comandos normais atualizados`);
console.log(`• ${slashAdminCommands.length} comandos slash atualizados`);
console.log('• Verificação de permissão de administrador adicionada');
console.log('• Importação do módulo permissions adicionada');

console.log('\n⚠️  IMPORTANTE:');
console.log('• Teste todos os comandos após essa alteração');
console.log('• Usuários sem permissão de admin não poderão mais usar comandos administrativos');
console.log('• Comandos públicos (shop, buy, profile, etc.) continuam funcionando normalmente');
