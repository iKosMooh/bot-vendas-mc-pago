const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("listproducts")
    .setDescription("Lista todos os produtos cadastrados no sistema"),

  async run(client, interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    try {
      let produtosData = {};
      if (fs.existsSync('produtos.json')) {
        produtosData = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
      }

      const produtos = Object.keys(produtosData);
      
      if (produtos.length === 0) {
        return interaction.reply({ 
          content: "📦 Nenhum produto cadastrado no sistema.", 
          ephemeral: true 
        });
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle("📦 Produtos Cadastrados")
        .setColor("#00FF00")
        .setDescription(`Total de produtos: ${produtos.length}`)
        .setTimestamp();

      let description = "";
      produtos.forEach((nome, index) => {
        const produto = produtosData[nome];
        description += `\n**${index + 1}. ${nome}**\n`;
        description += `💰 Valor: R$ ${produto.value}\n`;
        description += `📦 Estoque: ${produto.stock || "Ilimitado"}\n`;
        description += `📝 Descrição: ${produto.description.substring(0, 100)}${produto.description.length > 100 ? "..." : ""}\n`;
        description += "─".repeat(40) + "\n";
      });

      if (description.length > 4000) {
        description = description.substring(0, 4000) + "\n... (lista truncada)";
      }

      embed.setDescription(description);

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      return interaction.reply({ 
        content: "❌ Erro ao listar produtos.", 
        ephemeral: true 
      });
    }
  }
};
