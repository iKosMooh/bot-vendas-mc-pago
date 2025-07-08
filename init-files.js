// Inicializa arquivos JSON necessários para o sistema
const fs = require('fs');
const path = require('path');

// Cria a pasta data se não existir
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
  console.log('✅ Pasta data criada.');
}

// Cria produtos.json se não existir
if (!fs.existsSync('data/produtos.json')) {
  fs.writeFileSync('data/produtos.json', JSON.stringify({}, null, 2));
  console.log('✅ Arquivo data/produtos.json criado.');
}

// Cria payments.json se não existir
if (!fs.existsSync('data/payments.json')) {
  fs.writeFileSync('data/payments.json', JSON.stringify({}, null, 2));
  console.log('✅ Arquivo data/payments.json criado.');
}

// Cria links.json se não existir
if (!fs.existsSync('data/links.json')) {
  fs.writeFileSync('data/links.json', JSON.stringify({}, null, 2));
  console.log('✅ Arquivo data/links.json criado.');
}

// Cria approved_purchases.json se não existir
if (!fs.existsSync('data/approved_purchases.json')) {
  fs.writeFileSync('data/approved_purchases.json', JSON.stringify({}, null, 2));
  console.log('✅ Arquivo data/approved_purchases.json criado.');
}

console.log('🎉 Todos os arquivos JSON foram inicializados!');
