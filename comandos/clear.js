const Discord = require("discord.js");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("clear")
    .setDescription("Limpa mensagens do canal")
    .addIntegerOption(option => option
      .setName("quantidade")
      .setDescription("Quantidade de mensagens para limpar (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
    ),

  async execute(interaction) {
    // Verifica se o comando está sendo usado em um servidor
    if (!interaction.guild) {
      return interaction.reply({ content: "❌ Este comando só pode ser usado em servidores.", ephemeral: true });
    }

    // Verifica se o usuário tem permissão (ManageMessages)
    if (!interaction.member || !interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    const quantidade = interaction.options.getInteger("quantidade");

    try {
      // Busca e deleta as mensagens
      const messages = await interaction.channel.messages.fetch({ limit: quantidade });
      const deletedMessages = await interaction.channel.bulkDelete(messages, true);

      const embed = new Discord.EmbedBuilder()
        .setTitle("🗑️ Mensagens Limpas")
        .setColor("#00FF00")
        .setDescription(`${deletedMessages.size} mensagens foram deletadas.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

      // Remove a resposta após 5 segundos
      setTimeout(() => {
        interaction.deleteReply().catch(console.error);
      }, 5000);

    } catch (error) {
      console.error("Erro ao limpar mensagens:", error);
      return interaction.reply({ 
        content: "❌ Erro ao limpar mensagens. Verifique se as mensagens não são muito antigas (14+ dias).", 
        ephemeral: true 
      });
    }
  }
};
