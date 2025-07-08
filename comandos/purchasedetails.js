const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("purchasedetails")
    .setDescription("Mostra detalhes de uma compra específica")
    .addStringOption(option => option
      .setName("payment_id")
      .setDescription("ID do pagamento")
      .setRequired(true)
    ),

  async execute(interaction) {
    const paymentId = interaction.options.getString("payment_id");

    try {
      let paymentsData = {};
      if (fs.existsSync('data/payments.json')) {
        paymentsData = JSON.parse(fs.readFileSync('data/payments.json', 'utf8'));
      }

      const payment = paymentsData[paymentId];
      
      if (!payment) {
        return interaction.reply({ 
          content: "❌ Pagamento não encontrado.", 
          ephemeral: true 
        });
      }

      // Verifica se o usuário tem permissão ou é o dono da compra
      const isOwner = payment.userId === interaction.user.id;
      const isAdmin = interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild);
      
      if (!isOwner && !isAdmin) {
        return interaction.reply({ 
          content: "❌ Você não tem permissão para ver este pagamento.", 
          ephemeral: true 
        });
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle("📋 Detalhes da Compra")
        .setColor("#00FF00")
        .addFields(
          { name: "ID do Pagamento", value: paymentId, inline: true },
          { name: "Usuário", value: payment.username || "N/A", inline: true },
          { name: "Valor", value: `R$ ${payment.amount || "N/A"}`, inline: true },
          { name: "Produto", value: payment.product || "N/A", inline: true },
          { name: "Status", value: payment.status || "N/A", inline: true },
          { name: "Data", value: payment.date || "N/A", inline: true }
        )
        .setTimestamp();

      if (payment.cityName) {
        embed.addFields({ name: "Nome na Cidade", value: payment.cityName, inline: true });
      }
      if (payment.rg) {
        embed.addFields({ name: "RG na Cidade", value: payment.rg, inline: true });
      }
      if (payment.availability) {
        embed.addFields({ name: "Disponibilidade", value: payment.availability, inline: false });
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao buscar detalhes da compra:", error);
      return interaction.reply({ 
        content: "❌ Erro ao buscar detalhes da compra.", 
        ephemeral: true 
      });
    }
  }
};
