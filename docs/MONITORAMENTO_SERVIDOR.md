# Sistema de Monitoramento de Servidor Unturned

## Visão Geral

O sistema de monitoramento permite acompanhar em tempo real o status de servidores Unturned através do Battlemetrics, exibindo informações como número de jogadores, status do servidor, ranking e outros detalhes em um canal específico do Discord.

## Funcionalidades

### 🎮 **Monitoramento em Tempo Real**
- Status do servidor (Online/Offline)
- Número de jogadores conectados
- Capacidade máxima do servidor
- Percentual de ocupação com barra visual
- Ranking do servidor
- Localização geográfica
- Detalhes do jogo (mapa, modo, versão)

### 📊 **Embed Dinâmico**
- Card visual atualizado automaticamente
- Cores que mudam conforme o status (verde = online, vermelho = offline)
- Barra de progresso visual para ocupação
- Link direto para o Battlemetrics
- Timestamp da última atualização

### ⚙️ **Configuração Flexível**
- Configuração de canal específico
- Intervalo de atualização personalizável (5-60 minutos)
- Sistema de recuperação de erros
- Monitoramento de múltiplos servidores (futuro)

## Comandos

### `/setservermonitor`
Configura o monitoramento de servidor.

**Parâmetros:**
- `canal` - Canal onde será exibido o status
- `url` - URL do servidor no Battlemetrics
- `intervalo` - Intervalo de atualização (5-60 min, padrão: 10)

**Exemplo:**
```
/setservermonitor canal:#status-servidor url:https://www.battlemetrics.com/servers/unturned/34456987 intervalo:15
```

### `/servermonitor`
Gerencia o sistema de monitoramento.

**Subcomandos:**
- `status` - Exibe status atual do monitoramento
- `restart` - Reinicia o monitoramento
- `test` - Testa conexão com o servidor

## Como Configurar

### 1. **Obter URL do Battlemetrics**
1. Acesse https://www.battlemetrics.com
2. Busque pelo seu servidor Unturned
3. Copie a URL da página do servidor
4. Exemplo: `https://www.battlemetrics.com/servers/unturned/34456987`

### 2. **Configurar Canal**
1. Crie um canal dedicado (ex: `#status-servidor`)
2. Certifique-se de que o bot tem permissões:
   - Ver Canal
   - Enviar Mensagens
   - Inserir Links
   - Gerenciar Mensagens (opcional)

### 3. **Executar Comando**
```
/setservermonitor canal:#status-servidor url:https://www.battlemetrics.com/servers/unturned/34456987 intervalo:10
```

### 4. **Verificar Funcionamento**
- O bot enviará imediatamente a primeira mensagem de status
- Use `/servermonitor status` para verificar o funcionamento
- Use `/servermonitor test` para testar a conexão

## Formato do Card de Status

```
🎮 Nome do Servidor

████████████░░░░░░░░ 12/20 jogadores

📊 Status: 🟢 Online
👥 Jogadores: 👥 12/20
            📈 60%
🏆 Ranking: #150
🌐 Endereço: 192.168.1.100:27015
📍 Localização: Brazil, São Paulo

🎮 Detalhes:
🗺️ Mapa: PEI
🎯 Modo: Survival
📦 Versão: 3.23.15.0

🔗 Battlemetrics: [Ver no Battlemetrics](https://...)

Atualizado em • Próxima atualização em 10min
```

## Tratamento de Erros

### **Recuperação Automática**
- O sistema tenta se recuperar automaticamente de erros temporários
- Logs detalhados para debugging
- Notificação automática em caso de falhas persistentes

### **Erros Comuns**
1. **URL Inválida**: Verifique se a URL do Battlemetrics está correta
2. **Servidor Não Encontrado**: O servidor pode ter sido removido do Battlemetrics
3. **Sem Permissões**: Verifique as permissões do bot no canal
4. **API Indisponível**: A API do Battlemetrics pode estar temporariamente indisponível

### **Solução de Problemas**
```
/servermonitor status    # Verificar status
/servermonitor test      # Testar conexão
/servermonitor restart   # Reiniciar monitoramento
```

## Especificações Técnicas

### **API Utilizada**
- Battlemetrics API (https://api.battlemetrics.com)
- Rate limit respeitado
- Timeout de 10 segundos por requisição

### **Armazenamento**
- Configurações salvas em `data/channels.json`
- Backup automático em caso de erro

### **Performance**
- Atualização apenas da mensagem existente (sem spam)
- Cache de dados para reduzir requisições
- Sistema de retry em caso de falhas

### **Limitações**
- Um servidor por instância (expansível)
- Intervalo mínimo de 5 minutos
- Dependente da disponibilidade da API do Battlemetrics

## Expansões Futuras

- [ ] Monitoramento de múltiplos servidores
- [ ] Alertas de servidor offline/online
- [ ] Histórico de população
- [ ] Gráficos de atividade
- [ ] Integração com RCON
- [ ] Alertas de eventos do servidor
- [ ] Dashboard web
- [ ] API própria para dados históricos

## Logs e Debug

### **Logs Importantes**
```
🎮 Iniciando monitoramento do servidor...
✅ Monitoramento de servidor iniciado
🔄 Atualizando status do servidor...
✅ Status atualizado: ServerName (12/20)
❌ Erro ao atualizar status: [erro]
```

### **Verificação de Status**
```
/servermonitor status
```

Retorna informações completas sobre:
- Status do monitoramento (ativo/inativo)
- Última atualização
- Erros recentes
- Configuração atual
- Performance

## Suporte

Para problemas ou sugestões relacionadas ao sistema de monitoramento:

1. Verifique os logs do bot
2. Use `/servermonitor test` para diagnosticar
3. Verifique se a URL do Battlemetrics está correta
4. Confirme as permissões do bot no canal
5. Reinicie o monitoramento se necessário
