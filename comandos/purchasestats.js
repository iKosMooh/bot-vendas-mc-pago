const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("purchasestats")
    .setDescription("Mostra estatísticas de vendas"),

  async execute(interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    try {
      let paymentsData = {};
      let approvedData = {};
      
      if (fs.existsSync('payments.json')) {
        paymentsData = JSON.parse(fs.readFileSync('payments.json', 'utf8'));
      }
      
      if (fs.existsSync('approved_purchases.json')) {
        approvedData = JSON.parse(fs.readFileSync('approved_purchases.json', 'utf8'));
      }

      const totalPayments = Object.keys(paymentsData).length;
      const approvedPayments = Object.keys(approvedData).length;
      const pendingPayments = Object.values(paymentsData).filter(p => p.status === 'pending').length;
      const cancelledPayments = Object.values(paymentsData).filter(p => p.status === 'cancelled').length;

      // Calcula total de vendas
      const totalRevenue = Object.values(approvedData).reduce((sum, purchase) => {
        return sum + parseFloat(purchase.amount || 0);
      }, 0);

      // Produtos mais vendidos
      const productStats = {};
      Object.values(approvedData).forEach(purchase => {
        const product = purchase.product;
        if (productStats[product]) {
          productStats[product].count++;
          productStats[product].revenue += parseFloat(purchase.amount || 0);
        } else {
          productStats[product] = {
            count: 1,
            revenue: parseFloat(purchase.amount || 0)
          };
        }
      });

      const topProducts = Object.entries(productStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      const embed = new Discord.EmbedBuilder()
        .setTitle("📊 Estatísticas de Vendas")
        .setColor("#00FF00")
        .addFields(
          { name: "💳 Total de Pagamentos", value: totalPayments.toString(), inline: true },
          { name: "✅ Aprovados", value: approvedPayments.toString(), inline: true },
          { name: "⏳ Pendentes", value: pendingPayments.toString(), inline: true },
          { name: "❌ Cancelados", value: cancelledPayments.toString(), inline: true },
          { name: "💰 Receita Total", value: `R$ ${totalRevenue.toFixed(2)}`, inline: true },
          { name: "📈 Taxa de Aprovação", value: totalPayments > 0 ? `${((approvedPayments/totalPayments)*100).toFixed(1)}%` : "0%", inline: true }
        )
        .setTimestamp();

      if (topProducts.length > 0) {
        let topProductsText = "";
        topProducts.forEach((product, index) => {
          topProductsText += `${index + 1}. **${product[0]}** - ${product[1].count} vendas (R$ ${product[1].revenue.toFixed(2)})\n`;
        });
        embed.addFields({ name: "🏆 Top Produtos", value: topProductsText, inline: false });
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao gerar estatísticas:", error);
      return interaction.reply({ 
        content: "❌ Erro ao gerar estatísticas.", 
        ephemeral: true 
      });
    }
  }
};
