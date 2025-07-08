const Discord = require("discord.js");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("createticket")
    .setDescription("Cria um ticket de suporte")
    .addStringOption(option => option
      .setName("assunto")
      .setDescription("Assunto do ticket")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("descricao")
      .setDescription("Descrição detalhada do problema")
      .setRequired(true)
    ),

  async execute(interaction) {
    const assunto = interaction.options.getString("assunto");
    const descricao = interaction.options.getString("descricao");
    
    try {
      // Cria canal do ticket
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: Discord.ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [Discord.PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages],
          },
          // Adicione permissões para staff aqui
        ],
      });

      const embed = new Discord.EmbedBuilder()
        .setTitle("🎫 Ticket Criado")
        .setColor("#00FF00")
        .addFields(
          { name: "Usuário", value: interaction.user.username, inline: true },
          { name: "Assunto", value: assunto, inline: true },
          { name: "Descrição", value: descricao, inline: false }
        )
        .setTimestamp();

      const closeButton = new Discord.ActionRowBuilder()
        .addComponents(
          new Discord.ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("Fechar Ticket")
            .setStyle(Discord.ButtonStyle.Danger)
            .setEmoji("🔒")
        );

      await ticketChannel.send({ 
        content: `${interaction.user} - Seu ticket foi criado!`, 
        embeds: [embed], 
        components: [closeButton] 
      });

      return interaction.reply({ 
        content: `✅ Ticket criado em ${ticketChannel}!`, 
        ephemeral: true 
      });

    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      return interaction.reply({ 
        content: "❌ Erro ao criar ticket.", 
        ephemeral: true 
      });
    }
  }
};
