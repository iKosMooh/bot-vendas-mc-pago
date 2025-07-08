const path = require('path');
const fs = require('fs');

// Teste manual de processamento de produto expirado
async function testExpiredProductProcessing() {
    console.log('🧪 Testando processamento de produto expirado...');
    
    // Importar ProductDelivery
    const ProductDelivery = require('./utils/productDelivery');
    const productDelivery = new ProductDelivery();
    
    // Carregar compras aprovadas
    const approvedPath = path.join(__dirname, 'data', 'approved_purchases.json');
    const approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
    
    // Encontrar produto expirado não removido
    const expiredProducts = Object.values(approved).filter(p => p.expired && !p.removed);
    
    console.log(`📋 Produtos expirados não removidos: ${expiredProducts.length}`);
    
    if (expiredProducts.length > 0) {
        for (const product of expiredProducts) {
            console.log(`🗑️ Processando remoção de: ${product.productName} (${product.id})`);
            await productDelivery.processExpiredProduct(product);
        }
    } else {
        console.log('✅ Nenhum produto expirado para processar');
    }
    
    console.log('✅ Teste concluído');
}

testExpiredProductProcessing().catch(console.error);
