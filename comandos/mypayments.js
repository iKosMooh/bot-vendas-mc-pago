const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("mypayments")
    .setDescription("Mostra seus pagamentos registrados"),

  async run(client, interaction) {
    const userId = interaction.user.id;

    try {
      let paymentsData = {};
      if (fs.existsSync('payments.json')) {
        paymentsData = JSON.parse(fs.readFileSync('payments.json', 'utf8'));
      }

      const userPayments = Object.keys(paymentsData).filter(paymentId => 
        paymentsData[paymentId].userId === userId
      );

      if (userPayments.length === 0) {
        return interaction.reply({ 
          content: "💳 Você não possui pagamentos registrados.", 
          ephemeral: true 
        });
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle("💳 Seus Pagamentos")
        .setColor("#00FF00")
        .setDescription(`Total de pagamentos: ${userPayments.length}`)
        .setTimestamp();

      let description = "";
      userPayments.slice(0, 5).forEach((paymentId, index) => {
        const payment = paymentsData[paymentId];
        description += `\n**${index + 1}. ID: ${paymentId}**\n`;
        description += `💰 Valor: R$ ${payment.amount || "N/A"}\n`;
        description += `📦 Produto: ${payment.product || "N/A"}\n`;
        description += `📅 Data: ${payment.date || "N/A"}\n`;
        description += `🔄 Status: ${payment.status || "N/A"}\n`;
        description += "─".repeat(40) + "\n";
      });

      if (userPayments.length > 5) {
        description += `\n... e mais ${userPayments.length - 5} pagamentos.`;
      }

      embed.setDescription(description);

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao listar pagamentos do usuário:", error);
      return interaction.reply({ 
        content: "❌ Erro ao listar seus pagamentos.", 
        ephemeral: true 
      });
    }
  }
};
