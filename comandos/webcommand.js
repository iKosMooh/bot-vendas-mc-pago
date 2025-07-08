const Discord = require("discord.js");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("webcommand")
    .setDescription("Executa um comando web personalizado")
    .addStringOption(option => option
      .setName("comando")
      .setDescription("Comando web para executar")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("parametros")
      .setDescription("Parâmetros do comando (opcional)")
      .setRequired(false)
    ),

  async execute(interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    const comando = interaction.options.getString("comando");
    const parametros = interaction.options.getString("parametros") || "";

    await interaction.reply({ content: "🔄 Executando comando web...", ephemeral: true });

    try {
      // Aqui você pode implementar a lógica para executar comandos web
      // Por exemplo, chamadas para APIs externas, webhooks, etc.
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("🌐 Comando Web Executado")
        .setColor("#00FF00")
        .addFields(
          { name: "Comando", value: comando, inline: true },
          { name: "Parâmetros", value: parametros || "Nenhum", inline: true },
          { name: "Executado por", value: interaction.user.username, inline: true },
          { name: "Status", value: "✅ Sucesso", inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });

    } catch (error) {
      console.error("Erro ao executar comando web:", error);
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("❌ Erro no Comando Web")
        .setColor("#FF0000")
        .addFields(
          { name: "Comando", value: comando, inline: true },
          { name: "Erro", value: error.message || "Erro desconhecido", inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });
    }
  }
};
