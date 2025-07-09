# Sistema RCON - Manual de Uso

## Visão Geral
O sistema RCON permite que administradores executem comandos diretamente no servidor de jogo através do Discord, sem precisar de acesso direto ao console do servidor.

## Configuração Inicial

### 1. Configuração do config.json
Certifique-se de que o arquivo `config.json` possui a seção RCON configurada:

```json
{
  "rcon": {
    "host": "SEU_IP_DO_SERVIDOR",
    "port": 27017,
    "password": "SUA_SENHA_RCON"
  }
}
```

### 2. Configurar Canal RCON
Use o comando para definir qual canal receberá os comandos RCON:

```
/setrconchannel #canal-console
```

ou

```
$setrconchannel #canal-console
```

### 3. Remover Canal RCON
Para remover a configuração:

```
/setrconchannel acao:Remover
```

## Como Usar

### ✅ Funcionamento Correto
1. **Configure o canal** com `/setrconchannel #canal-desejado`
2. **Envie comandos diretamente** no canal configurado
3. **Apenas administradores** podem executar comandos
4. **Não use prefixos** ($) nas mensagens do canal RCON

### Exemplo de Uso:

**Canal:** `#console-unturned`

**Usuário envia:** `clear`

**Bot responde:**
```
🎮 Comando RCON Executado
📝 Comando
clear
📤 Resposta
Command executed.
Executado por ikosmooh • Hoje às 22:17
```

## Comandos RCON Comuns

### Unturned Server
- `clear` - Limpa o chat
- `say <mensagem>` - Envia mensagem para todos
- `kick <player>` - Expulsa jogador
- `ban <player>` - Bane jogador
- `unban <player>` - Remove ban
- `save` - Salva o mundo
- `shutdown` - Desliga servidor
- `players` - Lista jogadores online

### Outros Jogos
Os comandos variam dependendo do jogo/servidor configurado.

## Permissões

### Quem Pode Usar
- ✅ Usuários com permissão de **Administrador**
- ✅ Usuários em cargos administrativos configurados
- ❌ Usuários comuns

### Verificação de Permissões
O sistema verifica automaticamente se o usuário tem permissão antes de executar qualquer comando.

## Recursos do Sistema

### 🔄 Feedback em Tempo Real
- Mostra quando o comando está sendo processado
- Exibe a resposta do servidor
- Indica quem executou o comando
- Timestamp de execução

### 🛡️ Segurança
- Apenas administradores podem usar
- Todas as execuções são logadas
- Timeout de 10 segundos para evitar travamentos
- Tratamento de erros robusto

### 📱 Suporte a Slash Commands e Prefixo
- `/setrconchannel` (Slash Command)
- `$setrconchannel` (Comando com prefixo)

## Resolução de Problemas

### ❌ Canal não responde aos comandos
1. Verifique se o canal foi configurado corretamente
2. Confirme se você tem permissão de administrador
3. Verifique se não está usando prefixos ($) nos comandos RCON

### ❌ Erro de conexão RCON
1. Verifique a configuração no `config.json`
2. Confirme se o servidor está online
3. Teste a conectividade RCON externamente

### ❌ Comando não encontrado
1. Verifique se o comando existe no servidor
2. Confirme a sintaxe correta para o jogo/servidor

## Status do Sistema

### ✅ Funcionalidades Implementadas
- Configuração de canal via comando
- Execução de comandos RCON
- Verificação de permissões
- Feedback visual completo
- Tratamento de erros
- Logs de execução
- Suporte a timeout

### 🔧 Comandos Relacionados
- `/setrconchannel` - Configurar canal
- `/testrcon` - Testar conexão RCON
- `/rconstatus` - Status da conexão
- `/rconreset` - Resetar conexão

## Exemplo de Configuração Completa

1. **Configure o canal:**
   ```
   /setrconchannel #console-unturned
   ```

2. **O bot confirma:**
   ```
   ✅ Canal RCON Configurado
   O canal #console-unturned foi definido para comandos RCON.
   ```

3. **Use comandos diretamente:**
   ```
   clear
   save
   say Servidor será reiniciado em 5 minutos
   ```

4. **Bot responde para cada comando:**
   ```
   🎮 Comando RCON Executado
   📝 Comando: clear
   📤 Resposta: Command executed.
   Executado por Admin • Hoje às 22:17
   ```

## Logs e Monitoramento

Todas as execuções são logadas com:
- ✅ Comando executado
- ✅ Usuário que executou
- ✅ Timestamp de execução
- ✅ Resposta do servidor
- ✅ Erros (se houver)

---

**⚠️ Importante:** Use o sistema RCON com responsabilidade. Comandos incorretos podem afetar a experiência dos jogadores ou causar problemas no servidor.
