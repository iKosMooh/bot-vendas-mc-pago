const Discord = require("discord.js");
const mercadopago = require("mercadopago");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("checkpayment")
    .setDescription("Verifica o status de um pagamento")
    .addStringOption(option => option
      .setName("payment_id")
      .setDescription("ID do pagamento para verificar")
      .setRequired(true)
    ),

  async execute(interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    const paymentId = interaction.options.getString("payment_id");
    
    try {
      const response = await mercadopago.payment.get(paymentId);
      const payment = response.body;

      const embed = new Discord.EmbedBuilder()
        .setTitle("📊 Status do Pagamento")
        .setColor(payment.status === 'approved' ? '#00FF00' : payment.status === 'pending' ? '#FFFF00' : '#FF0000')
        .addFields(
          { name: "ID", value: payment.id.toString(), inline: true },
          { name: "Status", value: payment.status, inline: true },
          { name: "Valor", value: `R$ ${payment.transaction_amount}`, inline: true },
          { name: "Descrição", value: payment.description || "N/A", inline: true },
          { name: "Método", value: payment.payment_method_id, inline: true },
          { name: "Data", value: new Date(payment.date_created).toLocaleString('pt-BR'), inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
      return interaction.reply({ 
        content: "❌ Erro ao verificar pagamento. Verifique se o ID está correto.", 
        ephemeral: true 
      });
    }
  }
};
