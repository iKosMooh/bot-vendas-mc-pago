const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("clearpayments")
    .setDescription("Limpa todos os pagamentos registrados"),

  async execute(interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    try {
      // Cria um backup antes de limpar
      if (fs.existsSync('payments.json')) {
        const backupName = `payments_backup_${Date.now()}.json`;
        fs.copyFileSync('payments.json', backupName);
        console.log(`Backup criado: ${backupName}`);
      }

      // Limpa o arquivo de pagamentos
      fs.writeFileSync('payments.json', JSON.stringify({}, null, 2));

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
