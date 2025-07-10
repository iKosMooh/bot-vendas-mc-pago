/**
 * Teste para validar o comando /link com RCON
 */

const linkCommand = require('../comandos/link');

// Mock da interação
const mockInteraction = {
    user: { id: '123456789' },
    member: {
        user: {
            username: 'TestUser',
            discriminator: '1234'
        }
    },
    options: {
        getString: (name) => {
            if (name === 'steamid') {
                return '76561198123456789'; // Steam ID de teste
            }
            return null;
        }
    },
    reply: async (options) => {
        console.log('📨 Bot resposta:', options);
        return { id: 'mock-message-id' };
    }
};

async function testLinkCommand() {
    console.log('🔧 Testando comando /link com RCON...\n');
    
    try {
        console.log('🔗 Executando comando de vínculo...');
        await linkCommand.execute(mockInteraction);
        
        console.log('\n✅ Teste do comando /link concluído!');
        console.log('📋 Verifique se:');
        console.log('  1. Steam ID foi vinculada ao usuário');
        console.log('  2. Comando RCON foi executado no servidor');
        console.log('  3. Resposta do servidor foi exibida');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testLinkCommand();
