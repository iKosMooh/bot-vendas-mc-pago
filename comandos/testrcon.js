const Discord = require("discord.js");
const { SlashCommandBuilder } = require('discord.js');
const { Rcon } = require('rcon-client');
const config = require('../config.json');

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("testrcon")
    .setDescription("Testa a conexão RCON com o servidor"),

  async run(client, interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    await interaction.reply({ content: "🔄 Testando conexão RCON...", ephemeral: true });

    try {
      const response = await execCommand("echo teste_rcon");
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("✅ Teste RCON")
        .setColor("#00FF00")
        .setDescription("Conexão RCON funcionando!")
        .addFields(
          { name: "Status", value: "✅ Conectado", inline: true },
          { name: "Resposta", value: response || "Comando executado", inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });

    } catch (error) {
      console.error("Erro no teste RCON:", error);
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("❌ Erro RCON")
        .setColor("#FF0000")
        .setDescription("Falha na conexão RCON!")
        .addFields(
          { name: "Erro", value: error.message || "Erro desconhecido", inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });
    }
  }
};
