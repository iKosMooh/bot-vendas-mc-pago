const Discord = require("discord.js");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("setwebcommand")
    .setDescription("Configura um comando web personalizado")
    .addStringOption(option => option
      .setName("nome")
      .setDescription("Nome do comando")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("url")
      .setDescription("URL do webhook/API")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("metodo")
      .setDescription("Método HTTP")
      .setRequired(true)
      .addChoices(
        { name: "GET", value: "GET" },
        { name: "POST", value: "POST" },
        { name: "PUT", value: "PUT" },
        { name: "DELETE", value: "DELETE" }
      )
    ),

  async execute(interaction) {
    // Verifica se o usuário tem permissão (Administrator)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    const nome = interaction.options.getString("nome");
    const url = interaction.options.getString("url");
    const metodo = interaction.options.getString("metodo");

    try {
      // Aqui você salvaria a configuração em um arquivo JSON ou banco de dados
      const config = {
        nome: nome,
        url: url,
        metodo: metodo,
        criadoPor: interaction.user.id,
        criadoEm: new Date().toISOString()
      };

      const embed = new Discord.EmbedBuilder()
        .setTitle("⚙️ Comando Web Configurado")
        .setColor("#00FF00")
        .addFields(
          { name: "Nome", value: nome, inline: true },
          { name: "URL", value: url, inline: true },
          { name: "Método", value: metodo, inline: true },
          { name: "Configurado por", value: interaction.user.username, inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao configurar comando web:", error);
      return interaction.reply({ 
        content: "❌ Erro ao configurar comando web.", 
        ephemeral: true 
      });
    }
  }
};
