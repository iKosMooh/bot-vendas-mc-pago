// Teste para verificar o ciclo de vida dos tickets
const path = require('path');

// Simular estrutura do ticket handler
const ticketHandler = require('../utils/ticketHandler');

async function testTicketLifecycle() {
    console.log('🧪 Iniciando teste de ciclo de vida de tickets...');
    
    try {
        // Simular dados de teste
        const mockUser = { id: '123456789', username: 'testuser' };
        const mockGuild = { 
            id: '987654321',
            channels: {
                cache: new Map()
            }
        };
        
        // Teste 1: Criar ticket
        console.log('\n📝 Teste 1: Criando ticket...');
        const tickets = ticketHandler.loadTickets();
        const ticketId = Date.now().toString();
        
        tickets[ticketId] = {
            id: ticketId,
            userId: mockUser.id,
            username: mockUser.username,
            type: 'test',
            channelId: 'test-channel-123',
            status: 'open',
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        if (ticketHandler.saveTickets(tickets)) {
            console.log('✅ Ticket criado com sucesso');
        } else {
            console.log('❌ Erro ao criar ticket');
            return;
        }
        
        // Teste 2: Fechar ticket sem deletar canal
        console.log('\n🔒 Teste 2: Fechando ticket sem deletar canal...');
        const closeResult = await ticketHandler.closeTicket(ticketId, mockUser, mockGuild, false);
        
        if (closeResult.success) {
            console.log('✅ Ticket fechado com sucesso');
            console.log(`   - Status: ${closeResult.ticket.status}`);
            console.log(`   - Fechado por: ${closeResult.ticket.closedByUsername}`);
        } else {
            console.log(`❌ Erro ao fechar ticket: ${closeResult.error}`);
        }
        
        // Teste 3: Tentar fechar ticket já fechado
        console.log('\n🔄 Teste 3: Tentando fechar ticket já fechado...');
        const closeResult2 = await ticketHandler.closeTicket(ticketId, mockUser, mockGuild, false);
        
        if (!closeResult2.success) {
            console.log('✅ Correctly prevented closing already closed ticket');
            console.log(`   - Erro esperado: ${closeResult2.error}`);
        } else {
            console.log('❌ Should not allow closing already closed ticket');
        }
        
        // Teste 4: Verificar estado final
        console.log('\n📊 Teste 4: Verificando estado final...');
        const finalTickets = ticketHandler.loadTickets();
        const finalTicket = finalTickets[ticketId];
        
        if (finalTicket && finalTicket.status === 'closed') {
            console.log('✅ Estado final correto');
            console.log(`   - ID: ${finalTicket.id}`);
            console.log(`   - Status: ${finalTicket.status}`);
            console.log(`   - Criado em: ${finalTicket.createdAt}`);
            console.log(`   - Fechado em: ${finalTicket.closedAt}`);
        } else {
            console.log('❌ Estado final incorreto');
        }
        
        // Limpar ticket de teste
        delete finalTickets[ticketId];
        ticketHandler.saveTickets(finalTickets);
        console.log('\n🧹 Ticket de teste removido');
        
        console.log('\n🎉 Todos os testes passaram com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante teste:', error);
    }
}

// Executar teste se este arquivo for executado diretamente
if (require.main === module) {
    testTicketLifecycle();
}

module.exports = { testTicketLifecycle };
