const Discord = require("discord.js");
const { SlashCommandBuilder } = require('discord.js');
const { Rcon } = require('rcon-client');
const config = require('../config.json');
const { requireAdmin } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rconstatus")
    .setDescription("Verifica o status do servidor via RCON"),

  async execute(interaction) {
        // Verificar permissões de administrador
        if (!requireAdmin({ member: interaction.member, reply: interaction.reply.bind(interaction) }, 'o comando rconstatus')) {
            return;
        }
        
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", flags: 64 });
    }

    await interaction.reply({ content: "🔄 Verificando status do servidor...", flags: 64 });

    try {
      // Verificar se o RCON está configurado
      if (!config.rcon || !config.rcon.host || !config.rcon.password) {
        return interaction.editReply({ content: "❌ Configuração RCON não encontrada no config.json!" });
      }

      const rcon = new Rcon({
        host: config.rcon.host,
        port: config.rcon.port || 25575,
        password: config.rcon.password,
        timeout: 5000
      });

      await rcon.connect();
      
      // Tentar diferentes comandos para obter informações
      let playersInfo = "Não disponível";
      let serverInfo = "Online";
      
      try {
        const listResponse = await rcon.send("list");
        playersInfo = listResponse || "Comando não suportado";
      } catch (error) {
        console.log("Comando 'list' não suportado:", error.message);
      }

      try {
        const statusResponse = await rcon.send("status");
        if (statusResponse) {
          serverInfo = statusResponse;
        }
      } catch (error) {
        console.log("Comando 'status' não suportado:", error.message);
      }

      await rcon.end();
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("🖥️ Status do Servidor")
        .setColor("#00FF00")
        .setDescription("Servidor online e funcionando!")
        .addFields(
          { name: "📊 Informações", value: playersInfo, inline: false },
          { name: "🔧 Status", value: serverInfo, inline: false },
          { name: "🌐 Servidor", value: `${config.rcon.host}:${config.rcon.port}`, inline: true }
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
