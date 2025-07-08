const path = require('path');
const fs = require('fs');

// Teste manual para forçar verificação de produtos expirados
async function testExpiredProductRemoval() {
    console.log('🧪 Testando remoção automática de produtos expirados...');
    
    // Simular a função de verificação de produtos expirados
    const approvedPath = path.join(__dirname, 'data', 'approved_purchases.json');
    
    if (!fs.existsSync(approvedPath)) {
        console.log('❌ Arquivo de compras aprovadas não encontrado');
        return;
    }
    
    const approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
    const now = Date.now();
    
    console.log(`📋 Verificando ${Object.keys(approved).length} compras...`);
    
    for (const [id, purchase] of Object.entries(approved)) {
        console.log(`\n🔍 Produto: ${purchase.productName}`);
        console.log(`  🚚 Entregue: ${purchase.delivered}`);
        console.log(`  ⏰ Expirado: ${purchase.expired}`);
        console.log(`  🗑️ Removido: ${purchase.removed}`);
        
        if (purchase.expiresAtTimestamp) {
            const isExpired = purchase.expiresAtTimestamp < now;
            console.log(`  📅 Expira em: ${new Date(purchase.expiresAtTimestamp).toLocaleString('pt-BR')}`);
            console.log(`  ⏰ Está expirado: ${isExpired}`);
            
            if (purchase.delivered && isExpired && !purchase.removed) {
                console.log(`  🚨 PRODUTO PRECISA SER REMOVIDO!`);
                console.log(`  🔧 Comando de remoção: ${purchase.removalCommand}`);
                
                // Simular execução do comando
                if (purchase.removalCommand) {
                    const finalCommand = purchase.removalCommand
                        .replace('{steamid}', purchase.steamId)
                        .replace('{username}', purchase.username || 'Unknown')
                        .replace('{product}', purchase.productName)
                        .replace('{quantity}', 1);
                    
                    console.log(`  ▶️ Executaria: ${finalCommand}`);
                } else {
                    console.log(`  ⚠️ Comando de remoção não definido`);
                }
            }
        }
    }
    
    console.log('\n✅ Verificação concluída');
}

testExpiredProductRemoval().catch(console.error);
