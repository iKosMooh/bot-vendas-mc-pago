const Discord = require("discord.js");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("testticket")
    .setDescription("Cria um ticket de teste para verificar o sistema"),

  async run(client, interaction) {
    // Verifica se o usuário tem permissão (ManageChannels)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    try {
      // Cria canal de teste
      const testChannel = await interaction.guild.channels.create({
        name: `teste-ticket-${Date.now()}`,
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
        ],
      });

      const embed = new Discord.EmbedBuilder()
        .setTitle("🧪 Ticket de Teste")
        .setColor("#FFD700")
        .setDescription("Este é um ticket de teste criado para verificar o funcionamento do sistema.")
        .addFields(
          { name: "Criado por", value: interaction.user.username, inline: true },
          { name: "Tipo", value: "Teste do Sistema", inline: true },
          { name: "Status", value: "✅ Funcionando", inline: true }
        )
        .setTimestamp();

      const buttons = new Discord.ActionRowBuilder()
        .addComponents(
          new Discord.ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("Fechar Teste")
            .setStyle(Discord.ButtonStyle.Danger)
            .setEmoji("🔒"),
          new Discord.ButtonBuilder()
            .setCustomId("test_success")
            .setLabel("Teste OK")
            .setStyle(Discord.ButtonStyle.Success)
            .setEmoji("✅")
        );

      await testChannel.send({ 
        content: `${interaction.user} - Canal de teste criado!`, 
        embeds: [embed], 
        components: [buttons] 
      });

      // Agenda auto-delete em 2 minutos
      setTimeout(async () => {
        try {
          await testChannel.delete();
        } catch (error) {
          console.error("Erro ao deletar canal de teste:", error);
        }
      }, 120000);

      return interaction.reply({ 
        content: `🧪 Canal de teste criado: ${testChannel}\n⏰ Será deletado automaticamente em 2 minutos.`, 
        ephemeral: true 
      });

    } catch (error) {
      console.error("Erro ao criar ticket de teste:", error);
      return interaction.reply({ 
        content: "❌ Erro ao criar ticket de teste.", 
        ephemeral: true 
      });
    }
  }
};
