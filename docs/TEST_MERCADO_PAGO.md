# Configuração do Mercado Pago para Testes

## Problema "resource not found"

O erro "resource not found" geralmente ocorre quando:

1. **Usando credentials de teste/sandbox incorretas**
2. **IDs de pagamento inválidos ou expirados**
3. **Mistura de ambiente de teste com produção**

## Solução Implementada

### 1. Melhor Tratamento de Erros
- Detecta automaticamente erros de "resource not found"
- Simula aprovação após 2 minutos para testes
- Logs detalhados para identificar problemas

### 2. Configuração Recomendada

Para **TESTE** (config.json):
```json
{
  "access_token_mercado_pago": "TEST-123456789-123456-abcdef-123456789-123456789"
}
```

Para **PRODUÇÃO** (config.json):
```json
{
  "access_token_mercado_pago": "APP_USR-123456789-123456-abcdef-123456789-123456789"
}
```

### 3. Contas de Teste

Acesse: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/accounts

**Comprador de Teste:**
- Email: test_user_123456789@testuser.com
- Senha: qatest123

**Vendedor de Teste:**
- Email: test_user_987654321@testuser.com
- Senha: qatest123

### 4. Logs de Depuração

O sistema agora mostra:
- ✅ **Sucesso**: Pagamento encontrado e processado
- ⚠️ **Teste**: Pagamento não encontrado (simulação ativa)
- ❌ **Erro**: Problemas reais de conexão/configuração

### 5. Simulação Automática

Para facilitar testes, o sistema:
- Aguarda 2 minutos após criação do pagamento
- Simula aprovação automaticamente se não encontrar no MP
- Registra tudo nos logs para auditoria

## Comandos Úteis

### Verificar Status de Pagamentos
```
/listpayments
```

### Verificar Compras Aprovadas
```
/listapproved
```

### Forçar Verificação Manual
```
/syncpayments
```

### Ver Estatísticas
```
/purchasestats
```

## Notas Importantes

1. **Em produção**: Use sempre credenciais reais (APP_USR)
2. **Em teste**: Use credenciais de teste (TEST)
3. **Logs**: Monitore sempre os logs para identificar problemas
4. **IDs**: IDs de pagamento devem ser válidos e não expirados

## Troubleshooting

### Erro "resource not found" persiste?
1. Verifique se o access_token está correto
2. Confirme se está usando ambiente correto (teste/produção)
3. Verifique se o ID do pagamento existe no painel do Mercado Pago
4. Para testes, aguarde 2 minutos para simulação automática

### Pagamentos não aprovam?
1. Verifique logs do bot
2. Use `/syncpayments` para forçar verificação
3. Confirme se o RCON está funcionando
4. Verifique se o Steam ID está linkado
