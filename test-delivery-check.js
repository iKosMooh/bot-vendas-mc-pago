const { ProductDelivery } = require('./utils/productDelivery');

// Teste da verificação de entregas pendentes
async function testDeliveryCheck() {
    console.log('🧪 Testando verificação de entregas pendentes...');
    
    const productDelivery = new ProductDelivery();
    
    // Testar verificação de entregas pendentes
    await productDelivery.checkPendingDeliveries();
    
    console.log('✅ Teste concluído');
}

testDeliveryCheck().catch(console.error);
