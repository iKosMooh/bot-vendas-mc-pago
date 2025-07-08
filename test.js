const fs = require('fs');
const path = require('path');

console.log('🧪 Teste de Integridade do Bot Vendas MC');
console.log('=====================================');

// Verificar arquivos essenciais
const requiredFiles = [
    'index.js',
    'config.json',
    'produtos.json',
    'base.js',
    'init-files.js',
    'package.json',
    'README.md'
];

console.log('\n📁 Verificando arquivos essenciais...');
requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Verificar pastas
const requiredDirs = [
    'ComandosSlash',
    'ComandosSlash/admin',
    'comandos',
    'handler'
];

console.log('\n📂 Verificando pastas...');
requiredDirs.forEach(dir => {
    const exists = fs.existsSync(path.join(__dirname, dir));
    console.log(`${exists ? '✅' : '❌'} ${dir}`);
});

// Verificar comandos Slash
console.log('\n⚡ Verificando comandos Slash...');
const slashPath = path.join(__dirname, 'ComandosSlash', 'admin');
if (fs.existsSync(slashPath)) {
    const slashFiles = fs.readdirSync(slashPath).filter(file => file.endsWith('.js'));
    console.log(`✅ ${slashFiles.length} comandos Slash encontrados:`);
    slashFiles.forEach(file => console.log(`   - ${file}`));
} else {
    console.log('❌ Pasta de comandos Slash não encontrada');
}

// Verificar comandos prefixados
console.log('\n🔧 Verificando comandos prefixados...');
const prefixPath = path.join(__dirname, 'comandos');
if (fs.existsSync(prefixPath)) {
    const prefixFiles = fs.readdirSync(prefixPath).filter(file => file.endsWith('.js'));
    console.log(`✅ ${prefixFiles.length} comandos prefixados encontrados:`);
    prefixFiles.forEach(file => console.log(`   - ${file}`));
} else {
    console.log('❌ Pasta de comandos prefixados não encontrada');
}

// Verificar configuração
console.log('\n⚙️ Verificando configuração...');
try {
    const config = require('./config.json');
    console.log(`${config.token ? '✅' : '❌'} Token configurado`);
    console.log(`${config.mercadoPago?.accessToken ? '✅' : '❌'} Mercado Pago configurado`);
    console.log(`${config.rcon?.host ? '✅' : '❌'} RCON configurado`);
    console.log(`${config.prefix ? '✅' : '❌'} Prefixo configurado: ${config.prefix}`);
} catch (error) {
    console.log('❌ Erro ao ler configuração:', error.message);
}

// Verificar produtos
console.log('\n🛍️ Verificando produtos...');
try {
    const produtos = require('./produtos.json');
    console.log(`✅ ${produtos.length} produtos encontrados`);
    produtos.forEach(produto => {
        console.log(`   - ${produto.name} (${produto.id}) - R$ ${produto.price}`);
    });
} catch (error) {
    console.log('❌ Erro ao ler produtos:', error.message);
}

// Verificar dependências
console.log('\n📦 Verificando dependências...');
try {
    const pkg = require('./package.json');
    const deps = Object.keys(pkg.dependencies || {});
    console.log(`✅ ${deps.length} dependências listadas:`);
    
    // Mapeamento de dependências para verificação
    const depCheck = {
        'discord.js': () => require('discord.js'),
        'mercadopago': () => require('mercadopago'),
        'qrcode': () => require('qrcode'),
        'rcon-client': () => require('rcon-client'),
        'axios': () => require('axios'),
        'express': () => require('express'),
        'fs': () => require('fs'),
        'path': () => require('path')
    };
    
    deps.forEach(dep => {
        try {
            if (depCheck[dep]) {
                depCheck[dep]();
                console.log(`   ✅ ${dep}`);
            } else if (dep === 'rcon') {
                // Skip verificação do rcon antigo
                console.log(`   ⚠️ ${dep} - Usando rcon-client no lugar`);
            } else {
                require(dep);
                console.log(`   ✅ ${dep}`);
            }
        } catch (error) {
            console.log(`   ❌ ${dep} - ${error.message}`);
        }
    });
} catch (error) {
    console.log('❌ Erro ao ler package.json:', error.message);
}

console.log('\n🎯 Teste concluído!');
console.log('=====================================');
console.log('Se todos os itens estão marcados com ✅, o bot está pronto para uso!');
console.log('Caso contrário, verifique os itens marcados com ❌ antes de executar o bot.');
