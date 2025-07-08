const Discord = require("discord.js");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("ping")
    .setDescription("Verifica a latência do bot"),

  async run(client, interaction) {
    const start = Date.now();
    await interaction.reply("🏓 Pong!");
    const end = Date.now();
    
    const embed = new Discord.EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setColor("#00FF00")
      .addFields(
        { name: "Latência", value: `${end - start}ms`, inline: true },
        { name: "API Latência", value: `${Math.round(client.ws.ping)}ms`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  }
};
