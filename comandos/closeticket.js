const Discord = require("discord.js");
const { requireAdmin } = require('../utils/permissions');

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("closeticket")
    .setDescription("Fecha um ticket de suporte"),

  async execute(interaction) {
    try {
      // Verifica se o canal é um ticket
      if (!interaction.channel.name.startsWith('ticket-')) {
        return interaction.reply({ 
          content: "❌ Este comando só pode ser usado em canais de ticket.", 
          ephemeral: true 
        });
      }

      // Extrair ID do ticket do nome do canal
      const ticketId = interaction.channel.name.replace('ticket-', '');
      
      // Verificar se é o dono do ticket ou admin
      const ticketHandler = require('../utils/ticketHandler');
      const tickets = ticketHandler.loadTickets();
      const ticket = tickets[ticketId];
      
      if (!ticket) {
        return interaction.reply({ 
          content: "❌ Ticket não encontrado no sistema.", 
          ephemeral: true 
        });
      }

      const isOwner = ticket.userId === interaction.user.id;
      const { checkAdmin } = require('../utils/permissions');
      const isAdmin = checkAdmin(interaction);
      
      if (!isOwner && !isAdmin) {
        return interaction.reply({ 
          content: "❌ Você não tem permissão para fechar este ticket.", 
          ephemeral: true 
        });
      }

      // Responder imediatamente
      const embed = new Discord.EmbedBuilder()
        .setTitle("🔒 Fechando Ticket")
        .setDescription("Este ticket será fechado em alguns segundos...")
        .setColor("#FF0000")
        .addFields(
          { name: "Fechado por", value: interaction.user.username, inline: true },
          { name: "Data", value: new Date().toLocaleString('pt-BR'), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Usar o sistema de tickets para fechar corretamente
      const result = await ticketHandler.closeTicket(ticketId, interaction.user, interaction.guild, false);

      if (result.success) {
        // Editar a resposta para confirmar
        try {
          await interaction.editReply({ 
            embeds: [embed.setDescription("✅ Ticket fechado! O canal será deletado em 3 segundos...")]
          });
        } catch (editError) {
          console.log('⚠️ Não foi possível editar resposta:', editError.message);
        }

        // Deletar canal após delay
        setTimeout(async () => {
          try {
            const channel = interaction.guild.channels.cache.get(interaction.channel.id);
            if (channel) {
              await channel.delete();
              console.log('✅ Canal do ticket deletado via comando');
            }
          } catch (deleteError) {
            console.error('❌ Erro ao deletar canal via comando:', deleteError.message);
          }
        }, 3000);
      } else {
        try {
          await interaction.editReply({ 
            embeds: [embed.setDescription(`❌ Erro ao fechar ticket: ${result.error}`)]
          });
        } catch (editError) {
          console.log('⚠️ Não foi possível editar resposta de erro:', editError.message);
        }
      }

    } catch (error) {
      console.error('❌ Erro no comando closeticket:', error);
      
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: '❌ Erro ao fechar ticket!', 
            ephemeral: true 
          });
        } else {
          await interaction.editReply({ 
            content: '❌ Erro ao fechar ticket!' 
          });
        }
      } catch (replyError) {
        console.error('❌ Erro ao responder:', replyError.message);
      }
    }
  }
};
