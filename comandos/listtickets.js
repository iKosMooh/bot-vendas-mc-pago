const Discord = require("discord.js");
const { requireAdmin } = require("../utils/permissions");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("listtickets")
    .setDescription("Lista todos os tickets ativos no servidor"),

  async execute(interaction) {
        // Verificar permissões de administrador
        if (!requireAdmin({ member: interaction.member, reply: interaction.reply.bind(interaction) }, 'o comando listtickets')) {
            return;
        }
        
    // Verifica se o usuário tem permissão (ManageChannels)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    try {
      // Busca todos os canais que começam com "ticket-"
      const ticketChannels = interaction.guild.channels.cache.filter(channel => 
        channel.name.startsWith('ticket-') && channel.type === Discord.ChannelType.GuildText
      );

      if (ticketChannels.size === 0) {
        return interaction.reply({ 
          content: "🎫 Nenhum ticket ativo encontrado.", 
          ephemeral: true 
        });
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle("🎫 Tickets Ativos")
        .setColor("#00FF00")
        .setDescription(`Total de tickets ativos: ${ticketChannels.size}`)
        .setTimestamp();

      let description = "";
      let ticketCount = 0;

      for (const [channelId, channel] of ticketChannels) {
        if (ticketCount >= 20) break; // Limita a 20 tickets para não ultrapassar limite do embed
        
        const username = channel.name.replace('ticket-', '');
        const createdAt = new Date(channel.createdTimestamp).toLocaleString('pt-BR');
        
        description += `\n**${ticketCount + 1}. ${channel}**\n`;
        description += `👤 Usuário: ${username}\n`;
        description += `📅 Criado: ${createdAt}\n`;
        description += `🔗 Canal: ${channel}\n`;
        description += "─".repeat(30) + "\n";
        
        ticketCount++;
      }

      if (ticketChannels.size > 20) {
        description += `\n... e mais ${ticketChannels.size - 20} tickets.`;
      }

      embed.setDescription(description);

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao listar tickets:", error);
      return interaction.reply({ 
        content: "❌ Erro ao listar tickets.", 
        ephemeral: true 
      });
    }
  }
};
