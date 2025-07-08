## Configuração de Produção - Mercado Pago

### Alterações Realizadas

1. **Removido Sandbox**: 
   - Removido `sandbox_init_point` em favor de `init_point`
   - Links de pagamento agora apontam para produção

2. **Simulação Automática Desativada**:
   - Removida simulação automática de aprovação
   - Pagamentos só serão aprovados com status real do Mercado Pago

3. **CPF Genérico**:
   - Alterado CPF fictício para formato mais genérico

4. **Mensagens Atualizadas**:
   - Comandos `/mpstatus` e `/testmp` atualizados
   - Removidas referências ao sandbox nos logs

### Status Atual
- ✅ Token de produção: `APP_USR-*`
- ✅ URLs de pagamento: Produção
- ✅ Simulação automática: Desativada
- ✅ Entrega: Apenas com pagamento confirmado

### Próximos Passos
1. Testar criação de pagamento real
2. Verificar se links PIX funcionam corretamente
3. Confirmar que entrega só ocorre com pagamento aprovado
4. Monitorar logs para erros

### Comandos Úteis
- `/mpstatus` - Verificar status da configuração
- `/testmp create` - Criar preferência de teste
- `/listpayments` - Listar pagamentos pendentes
- `/syncpayments` - Forçar verificação de pagamentos

**⚠️ IMPORTANTE**: Agora o bot está configurado para produção. Pagamentos reais serão processados e valores reais serão cobrados dos usuários.
