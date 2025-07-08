const Discord = require("discord.js");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("forceclose")
    .setDescription("Força o fechamento de um ticket específico")
    .addChannelOption(option => option
      .setName("ticket")
      .setDescription("Canal do ticket para fechar")
      .setRequired(true)
      .addChannelTypes(Discord.ChannelType.GuildText)
    )
    .addStringOption(option => option
      .setName("motivo")
      .setDescription("Motivo do fechamento forçado")
      .setRequired(false)
    ),

  async execute(interaction) {
    // Verifica se o usuário tem permissão (ManageChannels)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    const ticketChannel = interaction.options.getChannel("ticket");
    const motivo = interaction.options.getString("motivo") || "Fechado pela administração";

    // Verifica se é um canal de ticket
    if (!ticketChannel.name.startsWith('ticket-')) {
      return interaction.reply({ 
        content: "❌ O canal especificado não é um ticket.", 
        ephemeral: true 
      });
    }

    try {
      // Envia mensagem de fechamento no ticket
      const embed = new Discord.EmbedBuilder()
        .setTitle("🔒 Ticket Fechado Administrativamente")
        .setDescription("Este ticket foi fechado pela administração.")
        .setColor("#FF0000")
        .addFields(
          { name: "Fechado por", value: interaction.user.username, inline: true },
          { name: "Motivo", value: motivo, inline: true },
          { name: "Data", value: new Date().toLocaleString('pt-BR'), inline: true }
        )
        .setTimestamp();

      await ticketChannel.send({ embeds: [embed] });

      // Responde no canal onde foi executado o comando
      await interaction.reply({ 
        content: `✅ Ticket ${ticketChannel} será fechado em 10 segundos.`, 
        ephemeral: true 
      });

      // Fecha o ticket após 10 segundos
      setTimeout(async () => {
        try {
          await ticketChannel.delete();
        } catch (error) {
          console.error("Erro ao deletar ticket:", error);
        }
      }, 10000);

    } catch (error) {
      console.error("Erro ao fechar ticket:", error);
      return interaction.reply({ 
        content: "❌ Erro ao fechar ticket.", 
        ephemeral: true 
      });
    }
  }
};
