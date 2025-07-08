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
      .setName("preco")
      .setDescription("Preço do produto")
      .setRequired(true)
    )
    .addBooleanOption(option => option
      .setName("infinito")
      .setDescription("Se o produto é infinito (sem prazo de validade)")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("comando_aprovacao")
      .setDescription("Comando RCON executado quando o pagamento for aprovado")
      .setRequired(true)
    )
    .addIntegerOption(option => option
      .setName("tempo")
      .setDescription("Tempo de validade (apenas se não for infinito)")
      .setRequired(false)
    )
    .addStringOption(option => option
      .setName("unidade_tempo")
      .setDescription("Unidade de tempo")
      .setRequired(false)
      .addChoices(
        { name: "Minutos", value: "minutos" },
        { name: "Horas", value: "horas" },
        { name: "Dias", value: "dias" }
      )
    )
    .addStringOption(option => option
      .setName("comando_expiracao")
      .setDescription("Comando RCON executado quando o produto expirar (apenas se não for infinito)")
      .setRequired(false)
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

  async execute(interaction) {
    // Verifica se o usuário tem permissão (ManageGuild)
    if (!interaction.member || !interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", flags: 64 });
    }

    const nome = interaction.options.getString("nome");
    const descricao = interaction.options.getString("descricao");
    const preco = interaction.options.getNumber("preco");
    const infinito = interaction.options.getBoolean("infinito");
    const tempo = interaction.options.getInteger("tempo");
    const unidadeTempo = interaction.options.getString("unidade_tempo") || "dias";
    const comandoAprovacao = interaction.options.getString("comando_aprovacao");
    const comandoExpiracao = interaction.options.getString("comando_expiracao");
    const imagem = interaction.options.getString("imagem") || null;
    const estoque = interaction.options.getInteger("estoque") || null;

    // Validações
    if (!infinito && !tempo) {
      return interaction.reply({ 
        content: "❌ Se o produto não for infinito, você deve especificar o tempo de validade.", 
        flags: 64
      });
    }

    if (!infinito && !unidadeTempo) {
      return interaction.reply({ 
        content: "❌ Se o produto não for infinito, você deve especificar a unidade de tempo.", 
        flags: 64
      });
    }

    if (!infinito && !comandoExpiracao) {
      return interaction.reply({ 
        content: "❌ Se o produto não for infinito, você deve especificar o comando de expiração.", 
        flags: 64
      });
    }

    // Carrega produtos existentes
    let produtosData = {};
    if (fs.existsSync('produtos.json')) {
      try {
        const fileContent = fs.readFileSync('produtos.json', 'utf8').trim();
        if (fileContent) {
          produtosData = JSON.parse(fileContent);
        }
      } catch (error) {
        console.error("Erro ao ler produtos.json:", error);
        // Se o arquivo estiver corrompido, fazer backup e criar novo
        if (fs.existsSync('produtos.json')) {
          fs.renameSync('produtos.json', `produtos_backup_${Date.now()}.json`);
        }
        produtosData = {};
      }
    }

    // Verifica se o produto já existe
    if (produtosData[nome]) {
      return interaction.reply({ 
        content: `❌ Produto "${nome}" já existe no sistema!`, 
        flags: 64
      });
    }

    // Converte tempo para minutos para padronização
    let tempoEmMinutos = null;
    if (!infinito && tempo) {
      switch (unidadeTempo) {
        case "minutos":
          tempoEmMinutos = tempo;
          break;
        case "horas":
          tempoEmMinutos = tempo * 60;
          break;
        case "dias":
          tempoEmMinutos = tempo * 24 * 60;
          break;
        default:
          tempoEmMinutos = tempo * 24 * 60; // Default para dias
      }
    }

    // Adiciona o produto
    produtosData[nome] = {
      name: nome,
      description: descricao,
      value: preco,
      image: imagem,
      stock: estoque,
      infinite: infinito,
      duration_minutes: tempoEmMinutos,
      duration_original: infinito ? null : { value: tempo, unit: unidadeTempo },
      approval_command: comandoAprovacao,
      expiration_command: infinito ? null : comandoExpiracao,
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
          { name: "Preço", value: `R$ ${preco}`, inline: true },
          { name: "Estoque", value: estoque ? estoque.toString() : "Ilimitado", inline: true },
          { name: "Tipo", value: infinito ? "Infinito" : `${tempo} ${unidadeTempo}`, inline: true },
          { name: "Descrição", value: descricao, inline: false },
          { name: "Comando de Aprovação", value: `\`${comandoAprovacao}\``, inline: false }
        )
        .setTimestamp();

      if (!infinito && comandoExpiracao) {
        embed.addFields({ name: "Comando de Expiração", value: `\`${comandoExpiracao}\``, inline: false });
      }

      if (imagem) {
        embed.setThumbnail(imagem);
      }

      return interaction.reply({ embeds: [embed], flags: 64 });

    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      return interaction.reply({ 
        content: "❌ Erro ao salvar produto no sistema.", 
        flags: 64
      });
    }
  }
};
