const Discord = require("discord.js");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("closeticket")
    .setDescription("Fecha um ticket de suporte"),

  async execute(interaction) {
    // Verifica se o canal é um ticket
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ 
        content: "❌ Este comando só pode ser usado em canais de ticket.", 
        ephemeral: true 
      });
    }

    // Verifica permissões
    const isOwner = interaction.channel.name.includes(interaction.user.username);
    const isAdmin = interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels);
    
    if (!isOwner && !isAdmin) {
      return interaction.reply({ 
        content: "❌ Você não tem permissão para fechar este ticket.", 
        ephemeral: true 
      });
    }

    const embed = new Discord.EmbedBuilder()
      .setTitle("🔒 Fechando Ticket")
      .setDescription("Este ticket será fechado em 10 segundos...")
      .setColor("#FF0000")
      .addFields(
        { name: "Fechado por", value: interaction.user.username, inline: true },
        { name: "Data", value: new Date().toLocaleString('pt-BR'), inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (error) {
        console.error("Erro ao deletar canal:", error);
      }
    }, 10000);
  }
};
