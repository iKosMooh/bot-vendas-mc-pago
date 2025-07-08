// Teste simples do sistema de verificação
const path = require('path');
const fs = require('fs');

console.log('🔍 Verificando sistema de entregas e expirações...');

// Carregar arquivo de compras aprovadas
const approvedPath = path.join(__dirname, 'data', 'approved_purchases.json');

if (fs.existsSync(approvedPath)) {
    const approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
    
    console.log(`📊 Total de compras: ${Object.keys(approved).length}`);
    
    for (const [id, purchase] of Object.entries(approved)) {
        console.log(`\n📦 ${purchase.productName} (${id}):`);
        console.log(`  👤 Usuário: ${purchase.username}`);
        console.log(`  🚚 Entregue: ${purchase.delivered ? '✅' : '❌'}`);
        console.log(`  ⏰ Expirado: ${purchase.expired ? '✅' : '❌'}`);
        console.log(`  🗑️ Removido: ${purchase.removed ? '✅' : '❌'}`);
        
        if (purchase.delivered && purchase.deliveredAt) {
            console.log(`  📅 Entregue em: ${new Date(purchase.deliveredAt).toLocaleString('pt-BR')}`);
        }
        
        if (purchase.expiresAtTimestamp) {
            const now = Date.now();
            const isExpired = purchase.expiresAtTimestamp < now;
            const timeLeft = purchase.expiresAtTimestamp - now;
            
            if (isExpired) {
                console.log(`  ⏰ Expirou em: ${new Date(purchase.expiresAtTimestamp).toLocaleString('pt-BR')}`);
            } else {
                const minutesLeft = Math.floor(timeLeft / (1000 * 60));
                console.log(`  ⏳ Expira em: ${minutesLeft} minutos`);
            }
        }
        
        // Verificar se precisa de ação
        if (purchase.delivered && purchase.expired && !purchase.removed) {
            console.log(`  🚨 AÇÃO NECESSÁRIA: Produto expirado precisa ser removido!`);
        } else if (!purchase.delivered && !purchase.expired) {
            console.log(`  🚨 AÇÃO NECESSÁRIA: Produto precisa ser entregue!`);
        }
    }
} else {
    console.log('❌ Arquivo de compras aprovadas não encontrado');
}

console.log('\n✅ Verificação concluída');
