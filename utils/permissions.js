/**
 * Utilitário para verificação de permissões
 */

/**
 * Verifica se o usuário tem permissões de administrador
 * @param {GuildMember} member - Membro do Discord
 * @returns {boolean} - True se for admin
 */
function isAdmin(member) {
    if (!member || !member.permissions) return false;
    
    return member.permissions.has('Administrator') || 
           member.permissions.has('ManageGuild') ||
           member.permissions.has('ManageChannels');
}

/**
 * Verifica se o usuário tem permissões de moderador
 * @param {GuildMember} member - Membro do Discord
 * @returns {boolean} - True se for moderador
 */
function isModerator(member) {
    if (!member || !member.permissions) return false;
    
    return isAdmin(member) ||
           member.permissions.has('ManageMessages') ||
           member.permissions.has('KickMembers') ||
           member.permissions.has('BanMembers');
}

/**
 * Verifica se o usuário pode gerenciar o servidor
 * @param {GuildMember} member - Membro do Discord
 * @returns {boolean} - True se pode gerenciar
 */
function canManageServer(member) {
    if (!member || !member.permissions) return false;
    
    return member.permissions.has('Administrator') || 
           member.permissions.has('ManageGuild');
}

/**
 * Middleware para comandos que requerem permissão de admin
 * @param {Message} message - Mensagem do Discord
 * @param {string} commandName - Nome do comando
 * @returns {boolean} - True se pode executar
 */
function requireAdmin(message, commandName = 'este comando') {
    if (!isAdmin(message.member)) {
        message.reply({
            content: `❌ **Acesso Negado**\n\nVocê precisa ter permissões de **Administrador** para usar ${commandName}.\n\n**Permissões necessárias:**\n• Administrator\n• Manage Guild\n• Manage Channels`,
            ephemeral: true
        });
        return false;
    }
    return true;
}

/**
 * Middleware para comandos que requerem permissão de moderador
 * @param {Message} message - Mensagem do Discord
 * @param {string} commandName - Nome do comando
 * @returns {boolean} - True se pode executar
 */
function requireModerator(message, commandName = 'este comando') {
    if (!isModerator(message.member)) {
        message.reply({
            content: `❌ **Acesso Negado**\n\nVocê precisa ter permissões de **Moderador** para usar ${commandName}.\n\n**Permissões necessárias:**\n• Administrator\n• Manage Guild\n• Manage Messages\n• Kick Members\n• Ban Members`,
            ephemeral: true
        });
        return false;
    }
    return true;
}

/**
 * Lista de comandos que requerem permissão de admin
 */
const ADMIN_COMMANDS = [
    'addproduct',
    'listpayments', 
    'listapproved',
    'purchasestats',
    'clearpayments',
    'forcedelivery',
    'forceexpire',
    'forceremoval',
    'syncpayments',
    'clear',
    'status',
    'config',
    'logs',
    'setchannels',
    'setrconchannel',
    'testmp',
    'mpstatus',
    'testrcon',
    'rconstatus', 
    'rconreset',
    'webcommand',
    'setwebcommand',
    'listtickets',
    'forceclose',
    'testticket'
];

/**
 * Lista de comandos que requerem permissão de moderador
 */
const MODERATOR_COMMANDS = [
    'forceclose',
    'listtickets'
];

/**
 * Lista de comandos públicos (usuários comuns)
 */
const PUBLIC_COMMANDS = [
    'ping',
    'shop',
    'listproducts',
    'buy',
    'profile',
    'checkpayment',
    'mypayments',
    'mypurchases', 
    'purchasedetails',
    'link',
    'help',
    'createticket',
    'closeticket',
    'tickethelp'
];

module.exports = {
    isAdmin,
    isModerator,
    canManageServer,
    requireAdmin,
    requireModerator,
    ADMIN_COMMANDS,
    MODERATOR_COMMANDS,
    PUBLIC_COMMANDS
};
