const Discord = require("discord.js");
const { SlashCommandBuilder } = require('discord.js');
const { Rcon } = require('rcon-client');
const config = require('../config.json');

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("rconstatus")
    .setDescription("Verifica o status do servidor via RCON"),

  async execute(interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    await interaction.reply({ content: "🔄 Verificando status do servidor...", ephemeral: true });

    try {
      const players = await execCommand("players");
      const status = await execCommand("status");
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("🖥️ Status do Servidor")
        .setColor("#00FF00")
        .setDescription("Servidor online e funcionando!")
        .addFields(
          { name: "Jogadores Online", value: players || "Comando não suportado", inline: true },
          { name: "Status", value: status || "Online", inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });

    } catch (error) {
      console.error("Erro ao verificar status:", error);
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("❌ Servidor Offline")
        .setColor("#FF0000")
        .setDescription("Não foi possível conectar ao servidor!")
        .addFields(
          { name: "Erro", value: error.message || "Servidor inacessível", inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });
    }
  }
};
