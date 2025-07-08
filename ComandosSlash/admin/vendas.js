const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("venda")
    .setDescription("Anuncia um produto para venda")
    .addStringOption(option => option
      .setName("nome")
      .setDescription("Nome do produto")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("descricao")
      .setDescription("Descrição do produto")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("valor")
      .setDescription("Valor do produto")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("imagem")
      .setDescription("URL da imagem do produto")
      .setRequired(true)
    )
    .addChannelOption(option => option
      .setName("canal")
      .setDescription("Canal onde o produto será anunciado")
      .setRequired(true)
    )
    .addIntegerOption(option => option
      .setName("estoque")
      .setDescription("Quantidade em estoque (deixe vazio para ilimitado)")
      .setRequired(false)
    ),

  async run(client, interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", flags: 64 });
    }

    const nome = interaction.options.getString("nome");
    const descricao = interaction.options.getString("descricao");
    const valor = interaction.options.getString("valor");
    const imagem = interaction.options.getString("imagem");
    const canal = interaction.options.getChannel("canal");
    const estoque = interaction.options.getInteger("estoque") || "N/A";

    // Verifica se o canal é de texto
    if (canal.type !== Discord.ChannelType.GuildText) {
      return interaction.reply({ content: "❌ O canal deve ser um canal de texto.", flags: 64 });
    }

    // Cria o embed do produto
    const embed = new Discord.EmbedBuilder()
      .setTitle(nome)
      .setDescription(descricao)
      .addFields(
        { name: "Valor", value: `R$ ${valor}`, inline: true },
        { name: "Estoque", value: estoque.toString(), inline: true }
      )
      .setImage(imagem)
      .setColor("#00FF00")
      .setTimestamp();

    // Cria o botão de comprar
    const botao = new Discord.ActionRowBuilder()
      .addComponents(
        new Discord.ButtonBuilder()
          .setCustomId(`cargo_b${nome}`)
          .setLabel("Comprar")
          .setStyle(Discord.ButtonStyle.Success)
          .setEmoji("🛒")
      );

    try {
      // Envia a mensagem no canal especificado
      const message = await canal.send({ embeds: [embed], components: [botao] });

      // Salva as informações do produto
      let produtosData = {};
      if (fs.existsSync('produtos.json')) {
        produtosData = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
      }

      produtosData[nome] = {
        name: nome,
        description: descricao,
        value: valor,
        image: imagem,
        channel: canal.id,
        stock: estoque,
        announcementId: message.id
      };

      fs.writeFileSync('produtos.json', JSON.stringify(produtosData, null, 2));

      return interaction.reply({ 
        content: `✅ Produto "${nome}" anunciado com sucesso no canal ${canal}!`, 
        flags: 64 
      });

    } catch (error) {
      console.error("Erro ao anunciar produto:", error);
      return interaction.reply({ content: "❌ Erro ao anunciar o produto.", flags: 64 });
    }
  }
};
