const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("delproduct")
    .setDescription("Remove um produto do sistema")
    .addStringOption(option => option
      .setName("nome")
      .setDescription("Nome do produto a ser removido")
      .setRequired(true)
    ),

  async run(client, interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    const nomeProduto = interaction.options.getString("nome");
    
    // Lê o arquivo de produtos
    let produtosData = {};
    try {
      if (fs.existsSync('produtos.json')) {
        produtosData = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
      }
    } catch (error) {
      return interaction.reply({ content: "❌ Erro ao ler arquivo de produtos.", ephemeral: true });
    }

    // Verifica se o produto existe
    if (!produtosData[nomeProduto]) {
      return interaction.reply({ content: `❌ Produto "${nomeProduto}" não encontrado.`, ephemeral: true });
    }

    const produto = produtosData[nomeProduto];

    // Remove a mensagem do anúncio se existir
    try {
      if (produto.announcementId && produto.channel) {
        const channel = interaction.guild.channels.cache.get(produto.channel);
        if (channel) {
          const message = await channel.messages.fetch(produto.announcementId);
          if (message) {
            await message.delete();
          }
        }
      }
    } catch (error) {
      console.log("Erro ao deletar mensagem do anúncio:", error);
    }

    // Remove o produto do arquivo
    delete produtosData[nomeProduto];
    
    try {
      fs.writeFileSync('produtos.json', JSON.stringify(produtosData, null, 2));
    } catch (error) {
      return interaction.reply({ content: "❌ Erro ao salvar arquivo de produtos.", ephemeral: true });
    }

    return interaction.reply({ 
      content: `✅ Produto "${nomeProduto}" removido com sucesso!`, 
      ephemeral: true 
    });
  }
};
