const Discord = require("discord.js");
const mercadopago = require("mercadopago");
const { requireAdmin } = require("../utils/permissions");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("mpstatus")
    .setDescription("Verifica o status do Mercado Pago"),

  async execute(interaction) {
        // Verificar permissões de administrador
        if (!requireAdmin({ member: interaction.member, reply: interaction.reply.bind(interaction) }, 'o comando mpstatus')) {
            return;
        }
        
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    await interaction.reply({ content: "🔄 Verificando status do Mercado Pago...", ephemeral: true });

    try {
      // Testa a conectividade criando um pagamento mínimo
      const testPayment = {
        transaction_amount: 0.01,
        payment_method_id: 'pix',
        description: 'Teste de conectividade',
        payer: {
          email: 'test@test.com',
        },
      };

      const response = await mercadopago.payment.create(testPayment);
      
      if (response.body && response.body.id) {
        // Cancela o pagamento de teste imediatamente
        await mercadopago.payment.cancel(response.body.id);

        const embed = new Discord.EmbedBuilder()
          .setTitle("✅ Status do Mercado Pago")
          .setColor("#00FF00")
          .setDescription("Serviço funcionando normalmente!")
          .addFields(
            { name: "🔗 Conectividade", value: "✅ OK", inline: true },
            { name: "🔑 Autenticação", value: "✅ OK", inline: true },
            { name: "💳 API Pagamentos", value: "✅ OK", inline: true },
            { name: "🧪 Teste ID", value: response.body.id.toString(), inline: false }
          )
          .setTimestamp();

        return interaction.editReply({ content: null, embeds: [embed] });

      } else {
        throw new Error("Resposta inválida da API");
      }

    } catch (error) {
      console.error("Erro no status do Mercado Pago:", error);
      
      let errorMessage = "Erro desconhecido";
      if (error.message.includes("401")) {
        errorMessage = "Token de acesso inválido";
      } else if (error.message.includes("network")) {
        errorMessage = "Erro de conectividade";
      } else {
        errorMessage = error.message;
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle("❌ Erro no Mercado Pago")
        .setColor("#FF0000")
        .setDescription("Problemas detectados no serviço!")
        .addFields(
          { name: "🔗 Conectividade", value: "❌ ERRO", inline: true },
          { name: "🔑 Autenticação", value: "❌ ERRO", inline: true },
          { name: "💳 API Pagamentos", value: "❌ ERRO", inline: true },
          { name: "⚠️ Detalhes", value: errorMessage, inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });
    }
  }
};
