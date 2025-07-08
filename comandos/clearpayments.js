const Discord = require("discord.js");
const fs = require("fs");
const { requireAdmin } = require("../utils/permissions");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("clearpayments")
    .setDescription("Limpa todos os pagamentos registrados"),

  async execute(interaction) {
    // Verificar permissões de administrador
    if (!requireAdmin({ member: interaction.member, reply: interaction.reply.bind(interaction) }, 'o comando clearpayments')) {
      return;
    }

    try {
      // Cria um backup antes de limpar
      if (fs.existsSync('data/payments.json')) {
        const backupName = `payments_backup_${Date.now()}.json`;
        fs.copyFileSync('data/payments.json', backupName);
        console.log(`Backup criado: ${backupName}`);
      }

      // Limpa o arquivo de pagamentos
      fs.writeFileSync('data/payments.json', JSON.stringify({}, null, 2));

      const embed = new Discord.EmbedBuilder()
        .setTitle("🗑️ Pagamentos Limpos")
        .setColor("#FF0000")
        .setDescription("Todos os pagamentos foram removidos do sistema.")
        .addFields(
          { name: "⚠️ Atenção", value: "Um backup foi criado automaticamente.", inline: false }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao limpar pagamentos:", error);
      return interaction.reply({ 
        content: "❌ Erro ao limpar pagamentos.", 
        ephemeral: true 
      });
    }
  }
};
