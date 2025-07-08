const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("listpayments")
    .setDescription("Lista todos os pagamentos registrados no sistema"),

  async execute(interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    try {
      let paymentsData = {};
      if (fs.existsSync('payments.json')) {
        paymentsData = JSON.parse(fs.readFileSync('payments.json', 'utf8'));
      }

      const payments = Object.keys(paymentsData);
      
      if (payments.length === 0) {
        return interaction.reply({ 
          content: "💳 Nenhum pagamento registrado no sistema.", 
          ephemeral: true 
        });
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle("💳 Pagamentos Registrados")
        .setColor("#00FF00")
        .setDescription(`Total de pagamentos: ${payments.length}`)
        .setTimestamp();

      let description = "";
      payments.slice(0, 10).forEach((paymentId, index) => {
        const payment = paymentsData[paymentId];
        description += `\n**${index + 1}. ID: ${paymentId}**\n`;
        description += `👤 Usuário: ${payment.username || "N/A"}\n`;
        description += `💰 Valor: R$ ${payment.amount || "N/A"}\n`;
        description += `📅 Data: ${payment.date || "N/A"}\n`;
        description += `🔄 Status: ${payment.status || "N/A"}\n`;
        description += "─".repeat(40) + "\n";
      });

      if (payments.length > 10) {
        description += `\n... e mais ${payments.length - 10} pagamentos.`;
      }

      embed.setDescription(description);

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao listar pagamentos:", error);
      return interaction.reply({ 
        content: "❌ Erro ao listar pagamentos.", 
        ephemeral: true 
      });
    }
  }
};
