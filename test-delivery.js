const { checkPendingDeliveries } = require('./utils/productDelivery');

// Teste de verificação de entregas pendentes
console.log('🚀 Testando verificação de entregas pendentes...');

const ProductDelivery = require('./utils/productDelivery');
const productDelivery = new ProductDelivery();

// Verificar entregas pendentes
productDelivery.checkPendingDeliveries().then(() => {
    console.log('✅ Teste concluído');
}).catch(error => {
    console.error('❌ Erro no teste:', error);
});
