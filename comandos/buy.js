const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'buy',
    description: 'Compra um produto do catálogo',
    execute(message, args) {
        if (args.length === 0) {
            return message.reply('❌ Use: `!buy <ID do produto>`\nPara ver os produtos disponíveis, use: `!listproducts`');
        }

        const productId = args[0];
        
        // Verificar se o arquivo de produtos existe
        const produtosPath = path.join(__dirname, '..', 'produtos.json');
        if (!fs.existsSync(produtosPath)) {
            return message.reply('❌ Nenhum produto encontrado no sistema.');
        }

        let produtos;
        try {
            produtos = JSON.parse(fs.readFileSync(produtosPath, 'utf8'));
        } catch (error) {
            console.error('❌ Erro ao ler produtos:', error);
            return message.reply('❌ Erro interno ao carregar produtos.');
        }

        // Procurar o produto
        const produto = produtos.find(p => p.id === productId);
        if (!produto) {
            return message.reply('❌ Produto não encontrado! Use `!listproducts` para ver produtos disponíveis.');
        }

        // Verificar se o produto está disponível
        if (produto.stock !== undefined && produto.stock <= 0) {
            return message.reply('❌ Este produto está fora de estoque!');
        }

        // Criar embed do produto
        const embed = new EmbedBuilder()
            .setTitle(`🛒 Comprar: ${produto.name}`)
            .setDescription(produto.description || 'Sem descrição disponível')
            .addFields(
                {
                    name: '💰 Preço',
                    value: `R$ ${produto.price}`,
                    inline: true
                },
                {
                    name: '📦 Estoque',
                    value: produto.stock ? `${produto.stock} unidades` : 'Ilimitado',
                    inline: true
                },
                {
                    name: '🏷️ ID',
                    value: produto.id,
                    inline: true
                }
            )
            .setColor('#0099ff')
            .setFooter({ text: 'Clique no botão abaixo para confirmar a compra', iconURL: message.client.user.displayAvatarURL() })
            .setTimestamp();

        if (produto.image) {
            embed.setThumbnail(produto.image);
        }

        // Criar botão de compra
        const buyButton = new ButtonBuilder()
            .setCustomId(`buy_${produto.id}_${message.author.id}`)
            .setLabel('💳 Comprar Agora')
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel_buy_${message.author.id}`)
            .setLabel('❌ Cancelar')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(buyButton, cancelButton);

        message.reply({ embeds: [embed], components: [row] });
    }
};
