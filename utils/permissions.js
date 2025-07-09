/**
 * Utilitário para verificação de permissões
 */

/**
 * Verifica se o contexto é uma interação (slash command)
 * @param {Message|Interaction} context - Contexto do Discord
 * @returns {boolean} - True se for interação
 */
function isInteraction(context) {
    return context && (context.isCommand?.() || context.isAutocomplete?.() || context.type !== undefined);
}

/**
 * Responde ao contexto de forma apropriada
 * @param {Message|Interaction} context - Contexto do Discord
 * @param {Object} message - Mensagem a ser enviada
 */
async function replyToContext(context, message) {
    try {
        if (isInteraction(context)) {
            // É uma interação (slash command)
            if (context.replied || context.deferred) {
                return await context.followUp(message);
            } else {
                return await context.reply(message);
            }
        } else if (context.reply) {
            // É uma mensagem (prefix command)
            return await context.reply(message);
        } else {
            console.error('Contexto inválido para resposta:', context);
            return null;
        }
    } catch (error) {
        console.error('Erro ao responder ao contexto:', error);
        return null;
    }
}

/**
 * Verifica permissões de admin de forma simples
 * @param {Message|Interaction} context - Contexto do Discord
 * @returns {boolean} - True se for admin
 */
function checkAdmin(context) {
    return isAdmin(context.member);
}

/**
 * Verifica permissões de moderador de forma simples
 * @param {Message|Interaction} context - Contexto do Discord
 * @returns {boolean} - True se for moderador
 */
function checkModerator(context) {
    return isModerator(context.member);
}

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
 * @param {Message|Interaction} context - Mensagem ou Interação do Discord
 * @param {string} commandName - Nome do comando
 * @returns {boolean} - True se pode executar
 */
async function requireAdmin(context, commandName = 'este comando') {
    const member = context.member;
    
    if (!isAdmin(member)) {
        const errorMessage = {
            content: `❌ **Acesso Negado**\n\nVocê precisa ter permissões de **Administrador** para usar ${commandName}.\n\n**Permissões necessárias:**\n• Administrator\n• Manage Guild\n• Manage Channels`,
            ephemeral: true
        };
        
        await replyToContext(context, errorMessage);
        return false;
    }
    return true;
}

/**
 * Middleware para comandos que requerem permissão de moderador
 * @param {Message|Interaction} context - Mensagem ou Interação do Discord
 * @param {string} commandName - Nome do comando
 * @returns {boolean} - True se pode executar
 */
async function requireModerator(context, commandName = 'este comando') {
    const member = context.member;
    
    if (!isModerator(member)) {
        const errorMessage = {
            content: `❌ **Acesso Negado**\n\nVocê precisa ter permissões de **Moderador** para usar ${commandName}.\n\n**Permissões necessárias:**\n• Administrator\n• Manage Guild\n• Manage Messages\n• Kick Members\n• Ban Members`,
            ephemeral: true
        };
        
        await replyToContext(context, errorMessage);
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
    'testticket',
    
    // Sistema de monitoramento de servidor
    'setservermonitor',
    'servermonitor',
    
    // Configuração do sistema
    'setchannels',
    'setrconchannel',
    'setwebcommand',
    'config'
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
    isInteraction,
    replyToContext,
    checkAdmin,
    checkModerator,
    ADMIN_COMMANDS,
    MODERATOR_COMMANDS,
    PUBLIC_COMMANDS
};
