// Inicializa arquivos JSON necessários para o sistema
const fs = require('fs');

// Cria produtos.json se não existir
if (!fs.existsSync('produtos.json')) {
  fs.writeFileSync('produtos.json', JSON.stringify({}, null, 2));
  console.log('✅ Arquivo produtos.json criado.');
}

// Cria payments.json se não existir
if (!fs.existsSync('payments.json')) {
  fs.writeFileSync('payments.json', JSON.stringify({}, null, 2));
  console.log('✅ Arquivo payments.json criado.');
}

// Cria links.json se não existir
if (!fs.existsSync('links.json')) {
  fs.writeFileSync('links.json', JSON.stringify({}, null, 2));
  console.log('✅ Arquivo links.json criado.');
}

// Cria approved_purchases.json se não existir
if (!fs.existsSync('approved_purchases.json')) {
  fs.writeFileSync('approved_purchases.json', JSON.stringify({}, null, 2));
  console.log('✅ Arquivo approved_purchases.json criado.');
}

console.log('🎉 Todos os arquivos JSON foram inicializados!');
