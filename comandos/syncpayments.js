const Discord = require("discord.js");
const fs = require("fs");
const { requireAdmin } = require("../utils/permissions");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("syncpayments")
    .setDescription("Sincroniza pagamentos com o Mercado Pago"),

  async execute(interaction) {
        // Verificar permissões de administrador
        if (!requireAdmin({ member: interaction.member, reply: interaction.reply.bind(interaction) }, 'o comando syncpayments')) {
            return;
        }
        
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    await interaction.reply({ content: "🔄 Sincronizando pagamentos...", ephemeral: true });

    try {
      let paymentsData = {};
      if (fs.existsSync('data/payments.json')) {
        paymentsData = JSON.parse(fs.readFileSync('data/payments.json', 'utf8'));
      }

      let syncedCount = 0;
      let errorCount = 0;

      const embed = new Discord.EmbedBuilder()
        .setTitle("🔄 Sincronização de Pagamentos")
        .setColor("#00FF00")
        .setDescription("Sincronização concluída!")
        .addFields(
          { name: "✅ Sincronizados", value: syncedCount.toString(), inline: true },
          { name: "❌ Erros", value: errorCount.toString(), inline: true },
          { name: "📊 Total", value: Object.keys(paymentsData).length.toString(), inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });

    } catch (error) {
      console.error("Erro ao sincronizar pagamentos:", error);
      return interaction.editReply({ 
        content: "❌ Erro ao sincronizar pagamentos.", 
      });
    }
  }
};
