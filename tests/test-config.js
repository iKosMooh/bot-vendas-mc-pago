// Teste de inicialização do bot sem fazer login
const fs = require('fs');
const path = require('path');

console.log('🔍 Testando configuração...');

// Verificar se config.json existe e é válido
try {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    console.log('✅ config.json carregado com sucesso');
    
    // Verificar se as credenciais do Mercado Pago estão configuradas
    if (config.mercadoPago && config.mercadoPago.accessToken && config.mercadoPago.accessToken !== 'SEU_ACCESS_TOKEN_AQUI') {
        console.log('✅ Credenciais do Mercado Pago configuradas');
        
        // Testar inicialização do Mercado Pago
        if (config.features.mercadoPagoEnabled) {
            const mercadopago = require('mercadopago');
            mercadopago.configure({
                access_token: config.mercadoPago.accessToken,
                sandbox: config.mercadoPago.sandbox || false
            });
            console.log('✅ Mercado Pago configurado com sucesso');
        } else {
            console.log('⚠️ Mercado Pago desabilitado nas features');
        }
    } else {
        console.log('⚠️ Credenciais do Mercado Pago não configuradas');
    }
    
    // Verificar se o token do bot está configurado
    if (config.token && config.token !== 'SEU_TOKEN_DO_BOT_AQUI') {
        console.log('✅ Token do bot configurado');
    } else {
        console.log('❌ Token do bot não configurado');
    }
} catch (error) {
    console.error('❌ Erro ao carregar config.json:', error);
}

// Verificar se os arquivos essenciais existem
const essentialFiles = [
    'data/produtos.json',
    'data/payments.json',
    'data/links.json',
    'data/approved_purchases.json',
    'data/channels.json'
];

console.log('\n🔍 Verificando arquivos essenciais...');
essentialFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} existe`);
    } else {
        console.log(`❌ ${file} não encontrado`);
    }
});

// Verificar se as dependências estão instaladas
console.log('\n🔍 Verificando dependências...');
try {
    require('discord.js');
    console.log('✅ discord.js instalado');
} catch (error) {
    console.log('❌ discord.js não instalado');
}

try {
    require('mercadopago');
    console.log('✅ mercadopago instalado');
} catch (error) {
    console.log('❌ mercadopago não instalado');
}

try {
    require('rcon-client');
    console.log('✅ rcon-client instalado');
} catch (error) {
    console.log('❌ rcon-client não instalado');
}

// Verificar se os comandos existem
console.log('\n🔍 Verificando comandos...');
const comandosDir = './comandos';
if (fs.existsSync(comandosDir)) {
    const comandos = fs.readdirSync(comandosDir).filter(file => file.endsWith('.js'));
    console.log(`✅ ${comandos.length} comandos encontrados`);
    comandos.forEach(cmd => console.log(`  - ${cmd}`));
} else {
    console.log('❌ Diretório de comandos não encontrado');
}

// Verificar se os utilitários existem
console.log('\n🔍 Verificando utilitários...');
const utilsDir = './utils';
if (fs.existsSync(utilsDir)) {
    const utils = fs.readdirSync(utilsDir).filter(file => file.endsWith('.js'));
    console.log(`✅ ${utils.length} utilitários encontrados`);
    utils.forEach(util => console.log(`  - ${util}`));
} else {
    console.log('❌ Diretório de utilitários não encontrado');
}

console.log('\n🎉 Teste de configuração concluído!');
