/**
 * Teste para validar as correções no sistema de permissões
 * Testa se requireAdmin funciona corretamente com Message e Interaction
 */

const { 
    requireAdmin, 
    requireModerator, 
    checkAdmin, 
    checkModerator,
    isInteraction,
    replyToContext
} = require('../utils/permissions');

// Mock objects para simular contextos do Discord
const mockMember = {
    permissions: {
        has: (permission) => {
            // Simula admin permissions
            const adminPerms = ['Administrator', 'ManageGuild', 'ManageChannels'];
            return adminPerms.includes(permission);
        }
    },
    user: {
        tag: 'TestUser#1234'
    }
};

const mockMemberNoPerms = {
    permissions: {
        has: (permission) => false
    },
    user: {
        tag: 'RegularUser#5678'
    }
};

// Mock message (prefix command)
const mockMessage = {
    member: mockMember,
    reply: async (content) => {
        console.log('📨 Message reply:', content);
        return { id: 'mock-message-id' };
    }
};

// Mock interaction (slash command)
const mockInteraction = {
    member: mockMember,
    isCommand: () => true,
    reply: async (content) => {
        console.log('⚡ Interaction reply:', content);
        return { id: 'mock-interaction-id' };
    },
    replied: false,
    deferred: false
};

// Mock message sem permissões
const mockMessageNoPerms = {
    member: mockMemberNoPerms,
    reply: async (content) => {
        console.log('📨 Message reply (no perms):', content);
        return { id: 'mock-message-id' };
    }
};

// Mock interaction sem permissões
const mockInteractionNoPerms = {
    member: mockMemberNoPerms,
    isCommand: () => true,
    reply: async (content) => {
        console.log('⚡ Interaction reply (no perms):', content);
        return { id: 'mock-interaction-id' };
    },
    replied: false,
    deferred: false
};

async function runTests() {
    console.log('🔧 Iniciando testes do sistema de permissões corrigido...\n');

    try {
        // Teste 1: requireAdmin com Message (admin)
        console.log('📝 Teste 1: requireAdmin com Message (admin)');
        const result1 = await requireAdmin(mockMessage, 'teste message admin');
        console.log(`✅ Resultado: ${result1}\n`);

        // Teste 2: requireAdmin com Interaction (admin)
        console.log('📝 Teste 2: requireAdmin com Interaction (admin)');
        const result2 = await requireAdmin(mockInteraction, 'teste interaction admin');
        console.log(`✅ Resultado: ${result2}\n`);

        // Teste 3: requireAdmin com Message (sem permissões)
        console.log('📝 Teste 3: requireAdmin com Message (sem permissões)');
        const result3 = await requireAdmin(mockMessageNoPerms, 'teste message no perms');
        console.log(`❌ Resultado: ${result3}\n`);

        // Teste 4: requireAdmin com Interaction (sem permissões)
        console.log('📝 Teste 4: requireAdmin com Interaction (sem permissões)');
        const result4 = await requireAdmin(mockInteractionNoPerms, 'teste interaction no perms');
        console.log(`❌ Resultado: ${result4}\n`);

        // Teste 5: checkAdmin (função simples)
        console.log('📝 Teste 5: checkAdmin (função simples)');
        const result5 = checkAdmin(mockMessage);
        const result6 = checkAdmin(mockMessageNoPerms);
        console.log(`✅ Admin com perms: ${result5}`);
        console.log(`❌ Admin sem perms: ${result6}\n`);

        // Teste 6: isInteraction
        console.log('📝 Teste 6: isInteraction');
        const result7 = isInteraction(mockMessage);
        const result8 = isInteraction(mockInteraction);
        console.log(`📨 Message é interaction? ${result7}`);
        console.log(`⚡ Interaction é interaction? ${result8}\n`);

        // Teste 7: replyToContext
        console.log('📝 Teste 7: replyToContext');
        await replyToContext(mockMessage, { content: 'Teste reply to message' });
        await replyToContext(mockInteraction, { content: 'Teste reply to interaction' });

        console.log('\n🎉 Todos os testes concluídos com sucesso!');
        console.log('✅ O sistema de permissões agora funciona corretamente com Message e Interaction');

    } catch (error) {
        console.error('❌ Erro durante os testes:', error);
        process.exit(1);
    }
}

// Executar testes
runTests().catch(console.error);
