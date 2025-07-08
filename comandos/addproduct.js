const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("addproduct")
    .setDescription("Adiciona um produto ao sistema")
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
    .addNumberOption(option => option
      .setName("valor")
      .setDescription("Valor do produto")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("imagem")
      .setDescription("URL da imagem do produto")
      .setRequired(false)
    )
    .addIntegerOption(option => option
      .setName("estoque")
      .setDescription("Quantidade em estoque")
      .setRequired(false)
    ),

  async run(client, interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
    }

    const nome = interaction.options.getString("nome");
    const descricao = interaction.options.getString("descricao");
    const valor = interaction.options.getNumber("valor");
    const imagem = interaction.options.getString("imagem") || null;
    const estoque = interaction.options.getInteger("estoque") || null;

    // Carrega produtos existentes
    let produtosData = {};
    if (fs.existsSync('produtos.json')) {
      try {
        produtosData = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
      } catch (error) {
        console.error("Erro ao ler produtos.json:", error);
      }
    }

    // Verifica se o produto já existe
    if (produtosData[nome]) {
      return interaction.reply({ 
        content: `❌ Produto "${nome}" já existe no sistema!`, 
        ephemeral: true 
      });
    }

    // Adiciona o produto
    produtosData[nome] = {
      name: nome,
      description: descricao,
      value: valor,
      image: imagem,
      stock: estoque,
      created_at: new Date().toISOString()
    };

    // Salva no arquivo
    try {
      fs.writeFileSync('produtos.json', JSON.stringify(produtosData, null, 2));
      
      const embed = new Discord.EmbedBuilder()
        .setTitle("✅ Produto Adicionado")
        .setColor("#00FF00")
        .addFields(
          { name: "Nome", value: nome, inline: true },
          { name: "Valor", value: `R$ ${valor}`, inline: true },
          { name: "Estoque", value: estoque ? estoque.toString() : "Ilimitado", inline: true },
          { name: "Descrição", value: descricao }
        )
        .setTimestamp();

      if (imagem) {
        embed.setThumbnail(imagem);
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      return interaction.reply({ 
        content: "❌ Erro ao salvar produto no sistema.", 
        ephemeral: true 
      });
    }
  }
};
