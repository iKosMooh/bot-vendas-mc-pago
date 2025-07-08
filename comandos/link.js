const Discord = require("discord.js");
const fs = require("fs");

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

        const embed = new Discord.EmbedBuilder()
          .setTitle("🔗 Steam Vinculado")
          .setColor("#00FF00")
          .addFields(
            { name: "Discord", value: userTag, inline: true },
            { name: "Steam64ID", value: steamId, inline: true }
          )
          .setTimestamp();

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
