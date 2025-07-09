const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { requireAdmin } = require('../utils/permissions');
const battlemetrics = require('../utils/battlemetrics');
const Utils = require('../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setservermonitor')
        .setDescription('Configura o monitoramento de servidor Unturned')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal onde será exibido o status do servidor')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL do servidor no Battlemetrics')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('intervalo')
                .setDescription('Intervalo de atualização em minutos (mínimo 5, máximo 60)')
                .setMinValue(5)
                .setMaxValue(60)
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Verificar permissões de admin
            if (!(await requireAdmin(interaction, 'setservermonitor'))) {
                return;
            }

            await interaction.deferReply();

            const channel = interaction.options.getChannel('canal');
            const url = interaction.options.getString('url');
            const interval = interaction.options.getInteger('intervalo') || 10; // Padrão: 10 minutos

            // Verificar se o canal é de texto
            if (channel.type !== 0) { // GUILD_TEXT
                return interaction.editReply({
                    content: '❌ O canal deve ser um canal de texto!'
                });
            }

            // Verificar se o bot tem permissões no canal
            const permissions = channel.permissionsFor(interaction.client.user);
            if (!permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
                return interaction.editReply({
                    content: '❌ O bot não tem permissões suficientes no canal especificado!\nPermissões necessárias: Ver Canal, Enviar Mensagens, Inserir Links'
                });
            }

            // Extrair ID do servidor da URL
            const serverId = battlemetrics.extractServerIdFromURL(url);
            if (!serverId) {
                return interaction.editReply({
                    content: '❌ URL inválida! Use uma URL válida do Battlemetrics.\nExemplo: `https://www.battlemetrics.com/servers/unturned/34456987`'
                });
            }

            // Testar conexão com o servidor
            console.log('🔍 Testando conexão com o servidor...');
            let serverData;
            try {
                serverData = await battlemetrics.getServerData(serverId);
            } catch (error) {
                console.error('❌ Erro ao conectar com servidor:', error);
                return interaction.editReply({
                    content: `❌ Erro ao conectar com o servidor!\nDetalhes: ${error.message}\n\nVerifique se a URL está correta e se o servidor existe.`
                });
            }

            // Salvar configuração
            const channels = Utils.loadChannels();
            channels.serverMonitor = {
                channelId: channel.id,
                serverId: serverId,
                serverName: serverData.name,
                url: url,
                interval: interval,
                lastMessageId: null,
                enabled: true,
                configuredAt: new Date().toISOString(),
                configuredBy: interaction.user.id
            };

            if (Utils.saveChannels(channels)) {
                console.log(`✅ Canal de monitoramento configurado: #${channel.name} (${channel.id})`);
                
                // Criar embed de confirmação
                const embed = new EmbedBuilder()
                    .setTitle('✅ Monitoramento de Servidor Configurado')
                    .setDescription(`O canal ${channel} foi configurado para monitorar o servidor **${serverData.name}**`)
                    .addFields(
                        { name: '🎮 Servidor', value: serverData.name, inline: true },
                        { name: '📍 Canal', value: `${channel}`, inline: true },
                        { name: '⏱️ Intervalo', value: `${interval} minutos`, inline: true },
                        { name: '🆔 Server ID', value: serverId, inline: true },
                        { name: '👥 Jogadores Atuais', value: `${serverData.players}/${serverData.maxPlayers}`, inline: true },
                        { name: '📊 Status', value: serverData.status === 'online' ? '🟢 Online' : '🔴 Offline', inline: true }
                    )
                    .setColor('#00ff00')
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [embed]
                });

                // Enviar primeira mensagem de status no canal configurado
                try {
                    const serverEmbed = battlemetrics.createServerEmbed(serverData);
                    const statusMessage = await channel.send({
                        embeds: [serverEmbed]
                    });

                    // Salvar ID da mensagem para futuras edições
                    channels.serverMonitor.lastMessageId = statusMessage.id;
                    Utils.saveChannels(channels);

                    console.log(`✅ Primeira mensagem de status enviada: ${statusMessage.id}`);

                    // Iniciar monitoramento se ainda não estiver ativo
                    const { startServerMonitoring } = require('../utils/serverMonitor');
                    startServerMonitoring(interaction.client);

                    // Atualizar status do bot com o nome do servidor
                    try {
                        const { ActivityType } = require('discord.js');
                        const serverName = `Unturned ${serverData.name}`;
                        interaction.client.user.setActivity(serverName, { type: ActivityType.Playing });
                        console.log(`✅ Status do bot atualizado: Jogando ${serverName}`);
                    } catch (statusError) {
                        console.error('❌ Erro ao atualizar status do bot:', statusError);
                    }

                } catch (error) {
                    console.error('❌ Erro ao enviar primeira mensagem:', error);
                    await interaction.followUp({
                        content: '⚠️ Configuração salva, mas erro ao enviar primeira mensagem. Verifique as permissões do bot no canal.',
                        ephemeral: true
                    });
                }

            } else {
                await interaction.editReply({
                    content: '❌ Erro ao salvar configuração!'
                });
            }

        } catch (error) {
            console.error('❌ Erro no comando setservermonitor:', error);
            
            const errorMessage = '❌ Erro interno ao configurar monitoramento!';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};
