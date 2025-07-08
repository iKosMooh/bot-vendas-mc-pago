const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { requireAdmin } = require('../utils/permissions');

module.exports = {
    name: 'status',
    description: 'Mostra o status geral do bot e sistemas',
    execute(message, args) {
        // Verificar permissões de administrador
        if (!requireAdmin(message, 'o comando status')) {
            return;
        }
        
        const config = require('../config.json');
        
        // Verificar arquivos do sistema
        const files = {
            'produtos.json': path.join(__dirname, '..', 'data', 'produtos.json'),
            'payments.json': path.join(__dirname, '..', 'data', 'payments.json'),
            'approved_purchases.json': path.join(__dirname, '..', 'data', 'approved_purchases.json'),
            'links.json': path.join(__dirname, '..', 'data', 'links.json')
        };

        const systemStatus = {};
        let totalProducts = 0;
        let totalPayments = 0;
        let approvedPurchases = 0;
        let linkedUsers = 0;

        // Verificar cada arquivo
        Object.keys(files).forEach(fileName => {
            const filePath = files[fileName];
            systemStatus[fileName] = {
                exists: fs.existsSync(filePath),
                size: 0,
                count: 0
            };

            if (systemStatus[fileName].exists) {
                try {
                    const stats = fs.statSync(filePath);
                    systemStatus[fileName].size = stats.size;
                    
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    systemStatus[fileName].count = Array.isArray(data) ? data.length : Object.keys(data).length;

                    // Contadores específicos
                    if (fileName === 'produtos.json') totalProducts = data.length;
                    if (fileName === 'payments.json') totalPayments = data.length;
                    if (fileName === 'approved_purchases.json') approvedPurchases = data.length;
                    if (fileName === 'links.json') linkedUsers = data.length;
                } catch (error) {
                    console.error(`Erro ao ler ${fileName}:`, error);
                }
            }
        });

        // Tempo de atividade
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        // Uso de memória
        const memUsage = process.memoryUsage();
        const memoryUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memoryTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);

        // Criar embed
        const embed = new EmbedBuilder()
            .setTitle('📊 Status do Sistema')
            .setDescription('Status geral do bot e sistemas integrados')
            .setColor('#00ff00')
            .setTimestamp();

        // Informações do bot
        embed.addFields(
            {
                name: '🤖 Bot Status',
                value: `**Status:** ✅ Online\n**Uptime:** ${hours}h ${minutes}m ${seconds}s\n**Ping:** ${message.client.ws.ping}ms`,
                inline: true
            },
            {
                name: '💾 Uso de Memória',
                value: `**Usado:** ${memoryUsed} MB\n**Total:** ${memoryTotal} MB\n**Uso:** ${((memoryUsed / memoryTotal) * 100).toFixed(1)}%`,
                inline: true
            },
            {
                name: '📈 Dados do Sistema',
                value: `**Produtos:** ${totalProducts}\n**Pagamentos:** ${totalPayments}\n**Compras Aprovadas:** ${approvedPurchases}\n**Usuários Vinculados:** ${linkedUsers}`,
                inline: true
            }
        );

        // Status dos arquivos
        const filesStatus = Object.keys(systemStatus).map(fileName => {
            const status = systemStatus[fileName];
            const statusIcon = status.exists ? '✅' : '❌';
            const sizeKB = status.exists ? (status.size / 1024).toFixed(2) : '0';
            return `${statusIcon} **${fileName}**: ${status.count} itens (${sizeKB} KB)`;
        }).join('\n');

        embed.addFields({
            name: '📁 Arquivos do Sistema',
            value: filesStatus,
            inline: false
        });

        // Status das integrações
        const integrationStatus = [
            `${config.mercadoPago?.accessToken ? '✅' : '❌'} **Mercado Pago**: ${config.mercadoPago?.accessToken ? 'Configurado' : 'Não configurado'}`,
            `${config.rcon?.host ? '✅' : '❌'} **RCON**: ${config.rcon?.host ? 'Configurado' : 'Não configurado'}`,
            `${config.steam?.apiKey ? '✅' : '❌'} **Steam API**: ${config.steam?.apiKey ? 'Configurado' : 'Não configurado'}`
        ].join('\n');

        embed.addFields({
            name: '🔧 Integrações',
            value: integrationStatus,
            inline: false
        });

        // Estatísticas do Discord
        embed.addFields({
            name: '📊 Estatísticas do Discord',
            value: `**Servidores:** ${message.client.guilds.cache.size}\n**Usuários:** ${message.client.users.cache.size}\n**Canais:** ${message.client.channels.cache.size}`,
            inline: true
        });

        // Versão do Node.js
        embed.addFields({
            name: '⚙️ Ambiente',
            value: `**Node.js:** ${process.version}\n**Plataforma:** ${process.platform}\n**Arquitetura:** ${process.arch}`,
            inline: true
        });

        // Botões de ação
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('status_refresh')
                    .setLabel('🔄 Atualizar')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('status_detailed')
                    .setLabel('📋 Detalhado')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('status_test')
                    .setLabel('🧪 Testar Sistemas')
                    .setStyle(ButtonStyle.Secondary)
            );

        embed.setFooter({ 
            text: 'Status do Bot Vendas MC', 
            iconURL: message.client.user.displayAvatarURL() 
        });

        message.reply({ embeds: [embed], components: [row] });
    }
};
