// Teste do sistema RCON
const path = require('path');

async function testRconSystem() {
    console.log('🧪 Testando sistema RCON...');
    
    try {
        // Verificar se o comando setrconchannel existe
        const rconCommand = require('../comandos/setrconchannel');
        console.log('✅ Comando setrconchannel carregado');
        
        // Verificar se tem a função handleMessage
        if (typeof rconCommand.handleMessage === 'function') {
            console.log('✅ Função handleMessage encontrada');
        } else {
            console.log('❌ Função handleMessage não encontrada');
            return;
        }
        
        // Verificar configuração RCON
        const config = require('../config.json');
        if (config.rcon && config.rcon.host && config.rcon.password) {
            console.log('✅ Configuração RCON encontrada:');
            console.log(`   - Host: ${config.rcon.host}`);
            console.log(`   - Port: ${config.rcon.port || 27015}`);
            console.log(`   - Password: ${'*'.repeat(config.rcon.password.length)}`);
        } else {
            console.log('❌ Configuração RCON incompleta');
            return;
        }
        
        // Verificar sistema de permissões
        const permissions = require('../utils/permissions');
        console.log('✅ Sistema de permissões carregado');
        
        // Verificar canais salvos
        const Utils = require('../utils/utils');
        const channels = Utils.loadChannels();
        
        if (channels.rcon) {
            console.log(`✅ Canal RCON configurado: ${channels.rcon}`);
        } else {
            console.log('⚠️ Canal RCON não configurado');
        }
        
        console.log('\n🎯 Sistema RCON verificado com sucesso!');
        console.log('\n📋 Para configurar:');
        console.log('   1. Use /setrconchannel #canal-desejado');
        console.log('   2. Envie mensagens no canal para executar comandos RCON');
        console.log('   3. Apenas administradores podem usar');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Executar teste se este arquivo for executado diretamente
if (require.main === module) {
    testRconSystem();
}

module.exports = { testRconSystem };
