const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'forceremoval',
    description: 'Remove forçadamente um produto do sistema',
    async execute(message, args) {
        // Verificar permissões de administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Você precisa ter permissões de administrador para usar este comando!');
        }

        if (args.length === 0) {
            return message.reply('❌ Use: `!forceremoval <ID do produto>` ou `!forceremoval all` para remover todos');
        }

        const productId = args[0].toLowerCase();

        // Verificar se o arquivo de produtos existe
        const produtosPath = path.join(__dirname, '..', 'produtos.json');
        if (!fs.existsSync(produtosPath)) {
            return message.reply('❌ Nenhum produto encontrado no sistema.');
        }

        try {
            let produtos = JSON.parse(fs.readFileSync(produtosPath, 'utf8'));

            if (productId === 'all') {
                // Remover todos os produtos
                const totalProducts = produtos.length;
                
                if (totalProducts === 0) {
                    return message.reply('❌ Não há produtos para remover.');
                }

                // Confirmar remoção
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Confirmação de Remoção')
                    .setDescription(`Tem certeza que deseja remover **TODOS** os ${totalProducts} produtos?`)
                    .setColor('#ff0000')
                    .setTimestamp();

                const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
                await confirmMessage.react('✅');
                await confirmMessage.react('❌');

                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };

                const collector = confirmMessage.createReactionCollector({ filter, time: 30000 });

                collector.on('collect', async (reaction, user) => {
                    if (reaction.emoji.name === '✅') {
                        // Remover todos os produtos
                        fs.writeFileSync(produtosPath, JSON.stringify([], null, 2));
                        
                        const successEmbed = new EmbedBuilder()
                            .setTitle('🗑️ Produtos Removidos')
                            .setDescription(`Todos os ${totalProducts} produtos foram removidos com sucesso!`)
                            .setColor('#00ff00')
                            .setTimestamp();

                        await confirmMessage.edit({ embeds: [successEmbed], components: [] });
                        collector.stop();
                    } else if (reaction.emoji.name === '❌') {
                        const cancelEmbed = new EmbedBuilder()
                            .setTitle('❌ Operação Cancelada')
                            .setDescription('Remoção de produtos cancelada.')
                            .setColor('#ff9900')
                            .setTimestamp();

                        await confirmMessage.edit({ embeds: [cancelEmbed], components: [] });
                        collector.stop();
                    }
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        const timeoutEmbed = new EmbedBuilder()
                            .setTitle('⏰ Tempo Esgotado')
                            .setDescription('Operação cancelada por timeout.')
                            .setColor('#ff0000')
                            .setTimestamp();

                        confirmMessage.edit({ embeds: [timeoutEmbed], components: [] });
                    }
                });

                return;
            }

            // Remover produto específico
            const produtoIndex = produtos.findIndex(p => p.id === productId);
            if (produtoIndex === -1) {
                return message.reply('❌ Produto não encontrado! Use `!listproducts` para ver produtos disponíveis.');
            }

            const produto = produtos[produtoIndex];
            
            // Remover produto do array
            produtos.splice(produtoIndex, 1);
            
            // Salvar arquivo atualizado
            fs.writeFileSync(produtosPath, JSON.stringify(produtos, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Produto Removido')
                .setDescription(`O produto foi removido com sucesso do sistema.`)
                .addFields(
                    { name: '📦 Produto', value: produto.name, inline: true },
                    { name: '🆔 ID', value: produto.id, inline: true },
                    { name: '💰 Preço', value: `R$ ${produto.price}`, inline: true },
                    { name: '📊 Estoque', value: produto.stock ? produto.stock.toString() : 'Ilimitado', inline: true },
                    { name: '🗓️ Removido em', value: new Date().toLocaleString('pt-BR'), inline: true },
                    { name: '👤 Removido por', value: message.author.username, inline: true }
                )
                .setColor('#ff0000')
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // Log da remoção
            console.log(`🗑️ Produto removido: ${produto.name} (ID: ${produto.id}) por ${message.author.username}`);

        } catch (error) {
            console.error('❌ Erro ao remover produto:', error);
            message.reply('❌ Erro interno ao remover produto.');
        }
    }
};