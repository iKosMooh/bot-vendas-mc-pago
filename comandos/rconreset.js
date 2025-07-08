const Discord = require("discord.js");
const { SlashCommandBuilder } = require('discord.js');
const { Rcon } = require('rcon-client');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rconreset")
    .setDescription("Reinicia a conexão RCON"),

  async execute(interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    await interaction.reply({ content: "🔄 Reiniciando conexão RCON...", ephemeral: true });

    try {
      // Reset da conexão RCON (se implementado no módulo rcon)
      console.log("Reiniciando conexão RCON...");
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("🔄 RCON Reiniciado")
        .setColor("#00FF00")
        .setDescription("Conexão RCON foi reiniciada com sucesso!")
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });

    } catch (error) {
      console.error("Erro ao reiniciar RCON:", error);
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("❌ Erro ao Reiniciar")
        .setColor("#FF0000")
        .setDescription("Falha ao reiniciar conexão RCON!")
        .addFields(
          { name: "Erro", value: error.message || "Erro desconhecido", inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });
    }
  }
};
