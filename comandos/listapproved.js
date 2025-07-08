const Discord = require("discord.js");
const fs = require("fs");
const { requireAdmin } = require("../utils/permissions");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("listapproved")
    .setDescription("Lista todas as compras aprovadas"),

  async execute(interaction) {
        // Verificar permissões de administrador
        if (!requireAdmin({ member: interaction.member, reply: interaction.reply.bind(interaction) }, 'o comando listapproved')) {
            return;
        }
        
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    try {
      let approvedData = {};
      if (fs.existsSync('data/approved_purchases.json')) {
        approvedData = JSON.parse(fs.readFileSync('data/approved_purchases.json', 'utf8'));
      }

      const purchases = Object.keys(approvedData);
      
      if (purchases.length === 0) {
        return interaction.reply({ 
          content: "✅ Nenhuma compra aprovada registrada.", 
          ephemeral: true 
        });
      }

      const embed = new Discord.EmbedBuilder()
        .setTitle("✅ Compras Aprovadas")
        .setColor("#00FF00")
        .setDescription(`Total de compras aprovadas: ${purchases.length}`)
        .setTimestamp();

      let description = "";
      purchases.slice(0, 10).forEach((paymentId, index) => {
        const purchase = approvedData[paymentId];
        description += `\n**${index + 1}. ID: ${paymentId}**\n`;
        description += `👤 Usuário: ${purchase.username || "N/A"}\n`;
        description += `📦 Produto: ${purchase.product || "N/A"}\n`;
        description += `💰 Valor: R$ ${purchase.amount || "N/A"}\n`;
        description += `📅 Aprovado em: ${new Date(purchase.approvedAt).toLocaleString('pt-BR') || "N/A"}\n`;
        description += "─".repeat(40) + "\n";
      });

      if (purchases.length > 10) {
        description += `\n... e mais ${purchases.length - 10} compras aprovadas.`;
      }

      embed.setDescription(description);

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao listar compras aprovadas:", error);
      return interaction.reply({ 
        content: "❌ Erro ao listar compras aprovadas.", 
        ephemeral: true 
      });
    }
  }
};
