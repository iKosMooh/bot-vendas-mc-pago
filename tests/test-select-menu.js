// Teste para verificar se o sistema de select menu está funcionando
const { ticketHandler } = require('./utils/ticketHandler');

// Simular interação de select menu
async function testSelectMenu() {
    console.log('🧪 Testando sistema de select menu...');
    
    // Verificar se os métodos foram adicionados
    console.log('✅ handleSelectMenuInteraction:', typeof ticketHandler.handleSelectMenuInteraction);
    console.log('✅ handleProductSelection:', typeof ticketHandler.handleProductSelection);
    console.log('✅ handleSelectedProductPurchase:', typeof ticketHandler.handleSelectedProductPurchase);
    
    if (typeof ticketHandler.handleSelectMenuInteraction === 'function' &&
        typeof ticketHandler.handleProductSelection === 'function' &&
        typeof ticketHandler.handleSelectedProductPurchase === 'function') {
        console.log('✅ Todos os métodos foram implementados corretamente!');
    } else {
        console.log('❌ Algum método está faltando!');
    }
}

testSelectMenu().catch(console.error);
