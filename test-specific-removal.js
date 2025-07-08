const ProductDelivery = require('./utils/productDelivery');

// Teste específico para o produto expirado
async function testSpecificProductRemoval() {
    console.log('🧪 Testando remoção do produto específico...');
    
    const productDelivery = new ProductDelivery();
    
    // Executar verificação de produtos expirados para remoção
    await productDelivery.checkExpiredProductsForRemoval();
    
    console.log('✅ Teste concluído');
}

testSpecificProductRemoval().catch(console.error);
