const mercadoPago = require('./utils/mercadoPago');

async function testPayment() {
    try {
        console.log('🧪 Testando criação de pagamento...');
        
        const productData = {
            id: 'test-product',
            name: 'Produto de Teste',
            description: 'Teste de pagamento',
            price: 1.50
        };
        
        const userInfo = {
            email: 'testuser@discord.user',
            firstName: 'TestUser',
            lastName: 'Discord',
            username: 'testuser'
        };
        
        const result = await mercadoPago.createPayment(productData, '123456789', userInfo);
        
        console.log('✅ Pagamento criado com sucesso!');
        console.log('🔗 Link de pagamento:', result.init_point);
        console.log('💳 ID do pagamento:', result.id);
        console.log('💰 Valor:', result.amount);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testPayment();
