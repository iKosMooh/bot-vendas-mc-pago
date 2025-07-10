const Discord = require("discord.js");
const fs = require("fs");
const { Rcon } = require('rcon-client');

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("link")
    .setDescription("Mostra seu vínculo Steam ou vincula uma nova conta")
    .addStringOption(option => option
      .setName("steamid")
      .setDescription("Nova Steam64ID para vincular (opcional)")
      .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const newSteamId = interaction.options.getString("steamid");

    try {
      let linksData = {};
      if (fs.existsSync('data/links.json')) {
        linksData = JSON.parse(fs.readFileSync('data/links.json', 'utf8'));
      }

      if (newSteamId) {
        // Vincula nova Steam ID
        let steamId = null;
        const match = newSteamId.match(/steamcommunity\.com\/(?:id|profiles)\/(\d{17})/);
        if (match) {
          steamId = match[1];
        } else if (/^\d{17}$/.test(newSteamId)) {
          steamId = newSteamId;
        }

        if (!steamId) {
          return interaction.reply({
            content: '❌ Steam64ID inválido. Use 17 dígitos ou link do perfil.',
            ephemeral: true
          });
        }

        const userTag = interaction.member.user?.discriminator !== '0'
          ? `${interaction.member.user.username}#${interaction.member.user.discriminator}`
          : interaction.member.nickname || interaction.member.user.username;

        linksData[userId] = { username: userTag, steamId };
        fs.writeFileSync('data/links.json', JSON.stringify(linksData, null, 2), 'utf8');

        // Executar comando RCON para adicionar permissão no servidor
        let rconResult = null;
        try {
          const config = require('../config.json');
          if (config.rcon && config.rcon.host && config.rcon.password) {
            const rcon = new Rcon({
              host: config.rcon.host,
              port: config.rcon.port || 27015,
              password: config.rcon.password,
              timeout: 10000
            });

            await rcon.connect();
            // Comando para adicionar usuário ao grupo discord
            const rconCommand = `p add ${steamId} discord`;
            const response = await rcon.send(rconCommand);
            await rcon.end();
            
            rconResult = {
              success: true,
              command: rconCommand,
              response: response
            };
            
            console.log(`✅ Comando RCON executado para ${userTag}: ${rconCommand}`);
            console.log(`📤 Resposta: ${response}`);
          } else {
            rconResult = {
              success: false,
              error: 'RCON não configurado'
            };
          }
        } catch (error) {
          console.error('❌ Erro ao executar comando RCON:', error);
          rconResult = {
            success: false,
            error: error.message
          };
        }

        const embed = new Discord.EmbedBuilder()
          .setTitle("🔗 Steam Vinculado")
          .setColor("#00FF00")
          .addFields(
            { name: "Discord", value: userTag, inline: true },
            { name: "Steam64ID", value: steamId, inline: true }
          );

        // Adicionar campo do RCON se foi executado
        if (rconResult) {
          if (rconResult.success) {
            embed.setDescription("✅ Steam ID vinculada e permissões adicionadas no servidor!");
            console.log(`🎮 RCON executado para ${interaction.user.tag}: ${rconResult.command} -> ${rconResult.response}`);
          } else {
            embed.setDescription("✅ Steam ID vinculada, mas não foi possível adicionar permissões no servidor.");
            console.log(`❌ Erro RCON para ${interaction.user.tag}: ${rconResult.error}`);
          }
        }

        embed.setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });

      } else {
        // Mostra vínculo atual
        const userLink = linksData[userId];
        
        if (!userLink) {
          return interaction.reply({
            content: '❌ Você não possui vínculo Steam. Use `/link <steamid>` para vincular.',
            ephemeral: true
          });
        }

        const embed = new Discord.EmbedBuilder()
          .setTitle("🔗 Seu Vínculo Steam")
          .setColor("#00FF00")
          .addFields(
            { name: "Discord", value: userLink.username, inline: true },
            { name: "Steam64ID", value: userLink.steamId, inline: true },
            { name: "Perfil Steam", value: `[Clique aqui](https://steamcommunity.com/profiles/${userLink.steamId})`, inline: false }
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (error) {
      console.error("Erro ao processar vínculo Steam:", error);
      return interaction.reply({ 
        content: "❌ Erro ao processar vínculo Steam.", 
        ephemeral: true 
      });
    }
  }
};
