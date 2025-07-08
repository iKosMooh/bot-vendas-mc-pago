const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("mypurchases")
    .setDescription("Mostra suas compras aprovadas"),

  async execute(interaction) {
    const userId = interaction.user.id;

    try {
      let approvedData = {};
      if (fs.existsSync('approved_purchases.json')) {
        approvedData = JSON.parse(fs.readFileSync('approved_purchases.json', 'utf8'));
      }

      const userPurchases = Object.keys(approvedData).filter(paymentId => 
        approvedData[paymentId].userId === userId
      );

      if (userPurchases.length === 0) {
        return interaction.reply({ 
          content: "🛒 Você não possui compras aprovadas.", 
          ephemeral: true 
        });
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle("🛒 Suas Compras Aprovadas")
        .setColor("#00FF00")
        .setDescription(`Total de compras: ${userPurchases.length}`)
        .setTimestamp();

      let description = "";
      userPurchases.slice(0, 5).forEach((paymentId, index) => {
        const purchase = approvedData[paymentId];
        description += `\n**${index + 1}. ${purchase.product}**\n`;
        description += `💰 Valor: R$ ${purchase.amount}\n`;
        description += `📅 Aprovado: ${new Date(purchase.approvedAt).toLocaleString('pt-BR')}\n`;
        description += `🏷️ ID: ${paymentId}\n`;
        description += "─".repeat(30) + "\n";
      });

      if (userPurchases.length > 5) {
        description += `\n... e mais ${userPurchases.length - 5} compras.`;
      }

      embed.setDescription(description);

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao listar compras do usuário:", error);
      return interaction.reply({ 
        content: "❌ Erro ao listar suas compras.", 
        ephemeral: true 
      });
    }
  }
};
