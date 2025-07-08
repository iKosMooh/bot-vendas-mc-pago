// Teste de conexão RCON
const { Rcon } = require('rcon-client');

const rconConfig = {
    host: "177.137.148.133",
    port: 27017,
    password: "root:Mascara100@"
};

async function testRcon() {
    try {
        console.log('🔌 Testando conexão RCON...');
        console.log('Host:', rconConfig.host);
        console.log('Port:', rconConfig.port);
        console.log('Password format:', rconConfig.password.split(':')[0] + ':***');
        
        const rcon = new Rcon({
            host: rconConfig.host,
            port: rconConfig.port,
            password: rconConfig.password,
            timeout: 5000
        });
        
        await rcon.connect();
        console.log('✅ Conexão RCON estabelecida com sucesso');
        
        // Testar comando
        const result = await rcon.send('help');
        console.log('📋 Resultado do comando help:', result);
        
        // Se funcionou, testar comando específico
        if (!result.includes('Login required')) {
            const result2 = await rcon.send('p add 76561199017489130 nomade');
            console.log('📋 Resultado do comando p add:', result2);
        } else {
            console.log('❌ Login ainda é necessário - verificar configuração');
        }
        
        await rcon.end();
        console.log('🔌 Conexão RCON encerrada');
        
    } catch (error) {
        console.error('❌ Erro ao testar RCON:', error.message);
        console.error('Stack:', error.stack);
    }
}

testRcon();
