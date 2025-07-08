const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('linksteam')
        .setDescription('Vincula uma conta Steam a um usuário do Discord')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário para vincular')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('steamid')
                .setDescription('O Steam ID do usuário')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('acao')
                .setDescription('Ação a ser realizada')
                .setRequired(false)
                .addChoices(
                    { name: 'Vincular', value: 'link' },
                    { name: 'Desvincular', value: 'unlink' },
                    { name: 'Atualizar', value: 'update' }
                )
        ),

    async execute(interaction) {
        // Verificar permissões de administrador
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: '❌ Você precisa ter permissões de administrador para usar este comando!', 
                ephemeral: true 
            });
        }

        const targetUser = interaction.options.getUser('usuario');
        const steamId = interaction.options.getString('steamid');
        const action = interaction.options.getString('acao') || 'link';

        // Validar Steam ID
        if (action !== 'unlink' && !isValidSteamId(steamId)) {
            return interaction.reply({ 
                content: '❌ Steam ID inválido! Use o formato: STEAM_0:X:XXXXXXXX ou 76561198XXXXXXXXX', 
                ephemeral: true 
            });
        }

        const linksPath = path.join(__dirname, '..', '..', 'links.json');
        let links = {};

        // Carregar links existentes
        if (fs.existsSync(linksPath)) {
            try {
                links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
            } catch (error) {
                console.error('❌ Erro ao carregar links:', error);
                return interaction.reply({ 
                    content: '❌ Erro interno ao carregar dados de vinculação.', 
                    ephemeral: true 
                });
            }
        }

        switch (action) {
            case 'link':
                return await linkAccount(interaction, targetUser, steamId, links, linksPath);
            case 'unlink':
                return await unlinkAccount(interaction, targetUser, links, linksPath);
            case 'update':
                return await updateAccount(interaction, targetUser, steamId, links, linksPath);
            default:
                return interaction.reply({ 
                    content: '❌ Ação inválida!', 
                    ephemeral: true 
                });
        }
    }
};

async function linkAccount(interaction, targetUser, steamId, links, linksPath) {
    // Verificar se o usuário já está vinculado
    if (links[targetUser.id]) {
        return interaction.reply({ 
            content: `❌ ${targetUser.username} já possui uma conta Steam vinculada! Use a ação "update" para atualizar.`, 
            ephemeral: true 
        });
    }

    // Verificar se o Steam ID já está em uso
    const existingUser = Object.keys(links).find(userId => links[userId].steamId === steamId);
    if (existingUser) {
        const existingUserObj = await interaction.client.users.fetch(existingUser);
        return interaction.reply({ 
            content: `❌ Este Steam ID já está vinculado ao usuário ${existingUserObj.username}!`, 
            ephemeral: true 
        });
    }

    // Criar vinculação
    links[targetUser.id] = {
        userId: targetUser.id,
        username: targetUser.username,
        steamId: steamId,
        linkedAt: new Date().toISOString(),
        linkedBy: interaction.user.id,
        linkedByUsername: interaction.user.username
    };

    try {
        fs.writeFileSync(linksPath, JSON.stringify(links, null, 2));
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Conta Steam Vinculada')
            .setDescription(`Conta Steam vinculada com sucesso!`)
            .addFields(
                { name: '👤 Usuário', value: targetUser.toString(), inline: true },
                { name: '🎮 Steam ID', value: steamId, inline: true },
                { name: '👨‍💼 Vinculado por', value: interaction.user.username, inline: true },
                { name: '📅 Data', value: new Date().toLocaleString('pt-BR'), inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // Enviar DM para o usuário vinculado
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('🔗 Conta Steam Vinculada')
                .setDescription(`Sua conta Steam foi vinculada por um administrador.`)
                .addFields(
                    { name: '🎮 Steam ID', value: steamId, inline: true },
                    { name: '👨‍💼 Vinculado por', value: interaction.user.username, inline: true }
                )
                .setColor('#0099ff')
                .setTimestamp();

            await targetUser.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.log('Não foi possível enviar DM para o usuário:', error);
        }

    } catch (error) {
        console.error('❌ Erro ao salvar vinculação:', error);
        return interaction.reply({ 
            content: '❌ Erro ao salvar vinculação.', 
            ephemeral: true 
        });
    }
}

async function unlinkAccount(interaction, targetUser, links, linksPath) {
    if (!links[targetUser.id]) {
        return interaction.reply({ 
            content: `❌ ${targetUser.username} não possui uma conta Steam vinculada!`, 
            ephemeral: true 
        });
    }

    const oldLink = links[targetUser.id];
    delete links[targetUser.id];

    try {
        fs.writeFileSync(linksPath, JSON.stringify(links, null, 2));
        
        const embed = new EmbedBuilder()
            .setTitle('🔓 Conta Steam Desvinculada')
            .setDescription(`Conta Steam desvinculada com sucesso!`)
            .addFields(
                { name: '👤 Usuário', value: targetUser.toString(), inline: true },
                { name: '🎮 Steam ID (Removido)', value: oldLink.steamId, inline: true },
                { name: '👨‍💼 Desvinculado por', value: interaction.user.username, inline: true },
                { name: '📅 Data', value: new Date().toLocaleString('pt-BR'), inline: true }
            )
            .setColor('#ff9900')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ Erro ao salvar desvinculação:', error);
        return interaction.reply({ 
            content: '❌ Erro ao salvar desvinculação.', 
            ephemeral: true 
        });
    }
}

async function updateAccount(interaction, targetUser, steamId, links, linksPath) {
    if (!links[targetUser.id]) {
        return interaction.reply({ 
            content: `❌ ${targetUser.username} não possui uma conta Steam vinculada! Use a ação "link" primeiro.`, 
            ephemeral: true 
        });
    }

    // Verificar se o novo Steam ID já está em uso por outro usuário
    const existingUser = Object.keys(links).find(userId => 
        userId !== targetUser.id && links[userId].steamId === steamId
    );
    
    if (existingUser) {
        const existingUserObj = await interaction.client.users.fetch(existingUser);
        return interaction.reply({ 
            content: `❌ Este Steam ID já está vinculado ao usuário ${existingUserObj.username}!`, 
            ephemeral: true 
        });
    }

    const oldSteamId = links[targetUser.id].steamId;
    
    // Atualizar vinculação
    links[targetUser.id] = {
        ...links[targetUser.id],
        steamId: steamId,
        updatedAt: new Date().toISOString(),
        updatedBy: interaction.user.id,
        updatedByUsername: interaction.user.username
    };

    try {
        fs.writeFileSync(linksPath, JSON.stringify(links, null, 2));
        
        const embed = new EmbedBuilder()
            .setTitle('🔄 Conta Steam Atualizada')
            .setDescription(`Conta Steam atualizada com sucesso!`)
            .addFields(
                { name: '👤 Usuário', value: targetUser.toString(), inline: true },
                { name: '🎮 Steam ID Antigo', value: oldSteamId, inline: true },
                { name: '🎮 Steam ID Novo', value: steamId, inline: true },
                { name: '👨‍💼 Atualizado por', value: interaction.user.username, inline: true },
                { name: '📅 Data', value: new Date().toLocaleString('pt-BR'), inline: true }
            )
            .setColor('#0099ff')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('❌ Erro ao salvar atualização:', error);
        return interaction.reply({ 
            content: '❌ Erro ao salvar atualização.', 
            ephemeral: true 
        });
    }
}

function isValidSteamId(steamId) {
    // Validar formato STEAM_0:X:XXXXXXXX
    const steamIdPattern = /^STEAM_[0-5]:[01]:\d+$/;
    // Validar formato SteamID64 (76561198XXXXXXXXX)
    const steamId64Pattern = /^7656119[0-9]{10}$/;
    
    return steamIdPattern.test(steamId) || steamId64Pattern.test(steamId);
}