const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { requireAdmin } = require('../utils/permissions');
const { getMonitoringStatus, restartServerMonitoring } = require('../utils/serverMonitor');
const battlemetrics = require('../utils/battlemetrics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servermonitor')
        .setDescription('Gerencia o monitoramento de servidor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Exibe o status atual do monitoramento'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('restart')
                .setDescription('Reinicia o monitoramento'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Testa a conexão com o servidor configurado')),

    async execute(interaction) {
        try {
            // Verificar permissões de admin
            if (!(await requireAdmin(interaction, 'servermonitor'))) {
                return;
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'status':
                    await this.handleStatus(interaction);
                    break;
                case 'restart':
                    await this.handleRestart(interaction);
                    break;
                case 'test':
                    await this.handleTest(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Subcomando não reconhecido!',
                        ephemeral: true
                    });
            }

        } catch (error) {
            console.error('❌ Erro no comando servermonitor:', error);
            
            const errorMessage = '❌ Erro interno no comando!';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },

    async handleStatus(interaction) {
        const status = getMonitoringStatus();
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Status do Monitoramento de Servidor')
            .setColor(status.isRunning ? '#00ff00' : '#ff0000')
            .setTimestamp();

        if (!status.config) {
            embed.setDescription('❌ Monitoramento não configurado')
                .addFields({
                    name: '🔧 Como configurar',
                    value: 'Use `/setservermonitor` para configurar o monitoramento',
                    inline: false
                });
        } else {
            const statusIcon = status.isRunning ? '🟢' : '🔴';
            const statusText = status.isRunning ? 'Ativo' : 'Inativo';
            
            embed.setDescription(`${statusIcon} Status: **${statusText}**`);
            
            embed.addFields(
                { name: '🎮 Servidor', value: status.config.serverName || 'N/A', inline: true },
                { name: '🆔 Server ID', value: status.config.serverId || 'N/A', inline: true },
                { name: '⏱️ Intervalo', value: `${status.config.interval || 'N/A'} minutos`, inline: true },
                { name: '📍 Canal', value: `<#${status.config.channelId}>`, inline: true }
            );

            if (status.lastUpdate) {
                embed.addFields({
                    name: '🕐 Última Atualização',
                    value: status.lastUpdate.toLocaleString('pt-BR'),
                    inline: true
                });
            }

            if (status.errorCount > 0) {
                embed.addFields({
                    name: '⚠️ Erros',
                    value: `${status.errorCount} erro(s) recente(s)`,
                    inline: true
                });
            }
        }

        await interaction.reply({ embeds: [embed] });
    },

    async handleRestart(interaction) {
        await interaction.deferReply();

        const status = getMonitoringStatus();
        
        if (!status.config) {
            return interaction.editReply({
                content: '❌ Monitoramento não configurado! Use `/setservermonitor` primeiro.'
            });
        }

        try {
            restartServerMonitoring();
            
            const embed = new EmbedBuilder()
                .setTitle('🔄 Monitoramento Reiniciado')
                .setDescription('O monitoramento de servidor foi reiniciado com sucesso!')
                .addFields(
                    { name: '🎮 Servidor', value: status.config.serverName, inline: true },
                    { name: '⏱️ Intervalo', value: `${status.config.interval} minutos`, inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('❌ Erro ao reiniciar monitoramento:', error);
            await interaction.editReply({
                content: '❌ Erro ao reiniciar monitoramento!'
            });
        }
    },

    async handleTest(interaction) {
        await interaction.deferReply();

        const status = getMonitoringStatus();
        
        if (!status.config) {
            return interaction.editReply({
                content: '❌ Monitoramento não configurado! Use `/setservermonitor` primeiro.'
            });
        }

        try {
            console.log(`🧪 Testando conexão com servidor ${status.config.serverId}...`);
            
            const serverData = await battlemetrics.getServerData(status.config.serverId);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Teste de Conexão Bem-sucedido')
                .setDescription(`Conexão com o servidor **${serverData.name}** estabelecida com sucesso!`)
                .addFields(
                    { name: '🎮 Nome', value: serverData.name, inline: true },
                    { name: '📊 Status', value: serverData.status === 'online' ? '🟢 Online' : '🔴 Offline', inline: true },
                    { name: '👥 Jogadores', value: `${serverData.players}/${serverData.maxPlayers}`, inline: true },
                    { name: '🌐 Endereço', value: `starvs.online:${serverData.port}`, inline: false }
                )
                .setColor('#00ff00')
                .setTimestamp();

            if (serverData.rank) {
                embed.addFields({
                    name: '🏆 Ranking',
                    value: `#${serverData.rank}`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('❌ Erro no teste de conexão:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Teste de Conexão Falhou')
                .setDescription('Não foi possível conectar com o servidor.')
                .addFields(
                    { name: '🆔 Server ID', value: status.config.serverId, inline: true },
                    { name: '⚠️ Erro', value: error.message, inline: false },
                    { name: '💡 Sugestões', value: '• Verifique se o servidor existe\n• Verifique se a URL está correta\n• Tente reconfigurar com `/setservermonitor`', inline: false }
                )
                .setColor('#ff0000')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
