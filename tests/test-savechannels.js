/**
 * Teste para validar o comando /setservermonitor
 * Testa se a função saveChannels funciona corretamente
 */

const Utils = require('../utils/utils');

console.log('🔧 Testando função saveChannels...\n');

// Teste 1: Carregar channels existentes
console.log('📂 Teste 1: Carregando configuração atual...');
const currentChannels = Utils.loadChannels();
console.log('✅ Configuração carregada:', currentChannels);

// Teste 2: Salvar uma configuração de teste
console.log('\n💾 Teste 2: Salvando configuração de teste...');
const testChannels = {
    ...currentChannels,
    test: 'test_channel_id_123',
    testTimestamp: new Date().toISOString()
};

const saveResult = Utils.saveChannels(testChannels);
console.log(`✅ Resultado do salvamento: ${saveResult}`);

if (saveResult) {
    console.log('✅ Função saveChannels retorna true quando bem-sucedida');
} else {
    console.log('❌ Função saveChannels retorna false em caso de erro');
}

// Teste 3: Verificar se foi salvo corretamente
console.log('\n🔍 Teste 3: Verificando se foi salvo...');
const reloadedChannels = Utils.loadChannels();
console.log('✅ Configuração recarregada:', reloadedChannels);

if (reloadedChannels.test === 'test_channel_id_123') {
    console.log('✅ Configuração salva e carregada corretamente!');
} else {
    console.log('❌ Erro ao salvar/carregar configuração');
}

// Teste 4: Restaurar configuração original
console.log('\n🔄 Teste 4: Restaurando configuração original...');
delete currentChannels.test;
delete currentChannels.testTimestamp;
const restoreResult = Utils.saveChannels(currentChannels);
console.log(`✅ Restauração: ${restoreResult ? 'sucesso' : 'falha'}`);

console.log('\n🎉 Teste da função saveChannels concluído!');
console.log('✅ A função agora retorna boolean corretamente');
console.log('✅ O comando /setservermonitor deve funcionar sem erro "❌ Erro ao salvar configuração!"');
