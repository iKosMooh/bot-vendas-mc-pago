const Discord = require("discord.js");
const mercadopago = require("mercadopago");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("testmp")
    .setDescription("Testa a conexão com o Mercado Pago"),

  async run(client, interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    await interaction.reply({ content: "🔄 Testando conexão com Mercado Pago...", ephemeral: true });

    try {
      // Testa criando um pagamento de teste
      const payment = {
        transaction_amount: 0.01,
        payment_method_id: 'pix',
        description: 'Teste de conexão',
        payer: {
          email: 'test@test.com',
        },
      };

      const response = await mercadopago.payment.create(payment);
      
      if (response.body && response.body.id) {
        // Cancela o pagamento de teste
        await mercadopago.payment.cancel(response.body.id);

        const embed = new Discord.EmbedBuilder()
          .setTitle("✅ Teste do Mercado Pago")
          .setColor("#00FF00")
          .setDescription("Conexão com Mercado Pago funcionando corretamente!")
          .addFields(
            { name: "Status", value: "✅ Conectado", inline: true },
            { name: "ID do Teste", value: response.body.id.toString(), inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ content: null, embeds: [embed] });
      } else {
        throw new Error("Resposta inválida do Mercado Pago");
      }

    } catch (error) {
      console.error("Erro ao testar Mercado Pago:", error);
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("❌ Erro no Teste do Mercado Pago")
        .setColor("#FF0000")
        .setDescription("Falha na conexão com Mercado Pago!")
        .addFields(
          { name: "Erro", value: error.message || "Erro desconhecido", inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });
    }
  }
};
