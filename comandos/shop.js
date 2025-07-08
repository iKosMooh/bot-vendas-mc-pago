const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
    name: 'shop',
    description: 'Exibe o catálogo de produtos disponíveis',
    execute(message, args) {
        const produtosPath = path.join(__dirname, '..', 'data', 'produtos.json');
        
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

        if (produtos.length === 0) {
            return message.reply('❌ Nenhum produto disponível no momento.');
        }

        // Paginação
        const page = parseInt(args[0]) || 1;
        const itemsPerPage = 5;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentProducts = produtos.slice(startIndex, endIndex);
        const totalPages = Math.ceil(produtos.length / itemsPerPage);

        if (page > totalPages) {
            return message.reply(`❌ Página não encontrada! Há apenas ${totalPages} páginas disponíveis.`);
        }

        // Criar embed principal
        const embed = new EmbedBuilder()
            .setTitle('🛍️ Catálogo de Produtos')
            .setDescription(`Confira nossos produtos disponíveis:\n\n**Página ${page} de ${totalPages}**`)
            .setColor('#00ff00')
            .setFooter({ text: `Total de produtos: ${produtos.length} | Use ${config.prefix || '!'}buy <ID> para comprar`, iconURL: message.client.user.displayAvatarURL() })
            .setTimestamp();

        // Adicionar produtos
        currentProducts.forEach((produto, index) => {
            const stockText = produto.stock ? `${produto.stock} unid.` : 'Ilimitado';
            const statusEmoji = produto.stock === 0 ? '❌' : '✅';
            
            embed.addFields({
                name: `${statusEmoji} ${produto.name} - R$ ${produto.price}`,
                value: `**ID:** \`${produto.id}\`\n**Estoque:** ${stockText}\n**Descrição:** ${produto.description || 'Sem descrição'}\n\`${config.prefix || '!'}buy ${produto.id}\` para comprar`,
                inline: false
            });
        });

        // Adicionar imagem do primeiro produto se disponível
        if (currentProducts.length > 0 && currentProducts[0].image) {
            embed.setThumbnail(currentProducts[0].image);
        }

        // Botões de navegação
        const components = [];
        if (totalPages > 1) {
            const row = new ActionRowBuilder();
            
            if (page > 1) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`shop_page_${page - 1}`)
                        .setLabel('⬅️ Anterior')
                        .setStyle(ButtonStyle.Primary)
                );
            }

            if (page < totalPages) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`shop_page_${page + 1}`)
                        .setLabel('Próxima ➡️')
                        .setStyle(ButtonStyle.Primary)
                );
            }

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('shop_refresh')
                    .setLabel('🔄 Atualizar')
                    .setStyle(ButtonStyle.Secondary)
            );

            components.push(row);
        }

        // Botão de ajuda
        const helpRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('shop_help')
                    .setLabel('❓ Como Comprar')
                    .setStyle(ButtonStyle.Secondary)
            );

        components.push(helpRow);

        message.reply({ embeds: [embed], components });
    }
};
