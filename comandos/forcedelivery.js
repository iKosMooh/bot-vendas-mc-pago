const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("forcedelivery")
    .setDescription("Força a entrega manual de um produto")
    .addStringOption(option => option
      .setName("payment_id")
      .setDescription("ID do pagamento")
      .setRequired(true)
    )
    .addUserOption(option => option
      .setName("user")
      .setDescription("Usuário que receberá o produto")
      .setRequired(true)
    ),

  async run(client, interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    const paymentId = interaction.options.getString("payment_id");
    const targetUser = interaction.options.getUser("user");

    try {
      let paymentsData = {};
      if (fs.existsSync('payments.json')) {
        paymentsData = JSON.parse(fs.readFileSync('payments.json', 'utf8'));
      }

      const payment = paymentsData[paymentId];
      
      if (!payment) {
        return interaction.reply({ 
          content: "❌ Pagamento não encontrado.", 
          ephemeral: true 
        });
      }

      // Marca como entregue manualmente
      payment.status = 'delivered_manually';
      payment.deliveredAt = new Date().toISOString();
      payment.deliveredBy = interaction.user.id;
      
      fs.writeFileSync('payments.json', JSON.stringify(paymentsData, null, 2));

      // Adiciona às compras aprovadas se não estiver
      let approvedData = {};
      if (fs.existsSync('approved_purchases.json')) {
        approvedData = JSON.parse(fs.readFileSync('approved_purchases.json', 'utf8'));
      }

      if (!approvedData[paymentId]) {
        approvedData[paymentId] = {
          userId: targetUser.id,
          username: targetUser.username,
          product: payment.product,
          amount: payment.amount,
          deliveredManually: true,
          deliveredBy: interaction.user.username,
          deliveredAt: new Date().toISOString()
        };
        fs.writeFileSync('approved_purchases.json', JSON.stringify(approvedData, null, 2));
      }

      // Notifica o usuário
      try {
        const userDM = await targetUser.createDM();
        const dmEmbed = new Discord.EmbedBuilder()
          .setTitle('📦 Produto Entregue')
          .setDescription(`Seu produto foi entregue manualmente por um administrador.`)
          .addFields(
            { name: "Produto", value: payment.product, inline: true },
            { name: "Valor", value: `R$ ${payment.amount}`, inline: true },
            { name: "ID Pagamento", value: paymentId, inline: true }
          )
          .setColor('#00FF00')
          .setTimestamp();
        
        await userDM.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log("Não foi possível enviar DM para o usuário");
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle("📦 Entrega Forçada")
        .setColor("#00FF00")
        .setDescription("Produto entregue manualmente com sucesso!")
        .addFields(
          { name: "Usuário", value: targetUser.username, inline: true },
          { name: "Produto", value: payment.product, inline: true },
          { name: "ID Pagamento", value: paymentId, inline: true },
          { name: "Entregue por", value: interaction.user.username, inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro na entrega forçada:", error);
      return interaction.reply({ 
        content: "❌ Erro ao processar entrega forçada.", 
        ephemeral: true 
      });
    }
  }
};
