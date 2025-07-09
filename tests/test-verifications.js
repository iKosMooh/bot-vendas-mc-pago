// Script para testar verificações automáticas manualmente
const { startExpiryChecker } = require('../utils/productDelivery');

console.log('🔍 Iniciando teste das verificações automáticas...');

// Executar verificações uma vez para teste
const productDelivery = require('../utils/productDelivery');

async function runTests() {
    console.log('\n📋 === TESTE DE VERIFICAÇÕES AUTOMÁTICAS ===\n');
    
    console.log('1. 🔍 Testando verificação de produtos expirados...');
    await productDelivery.checkExpiredProducts();
    
    console.log('\n2. 🔍 Testando verificação de pagamentos pendentes...');
    await productDelivery.checkPendingPayments();
    
    console.log('\n3. 🔍 Testando verificação de entregas pendentes...');
    await productDelivery.checkPendingDeliveries();
    
    console.log('\n4. 🔍 Testando verificação de estoque baixo...');
    await productDelivery.checkLowStock();
    
    console.log('\n✅ Todos os testes de verificação concluídos!');
}

runTests().catch(console.error);
