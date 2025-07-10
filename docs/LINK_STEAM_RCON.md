# Sistema de Link Steam com RCON Automático

## Visão Geral
O comando `/link` agora executa automaticamente um comando RCON no servidor quando um usuário vincula sua Steam ID, adicionando permissões ou executando ações configuradas.

## Como Funciona

### 1. **Usuário Vincula Steam ID**
```
/link steamid:76561198123456789
```

### 2. **Bot Executa Automaticamente:**
1. ✅ Salva a Steam ID no arquivo `data/links.json`
2. 🎮 Conecta ao servidor via RCON
3. 📤 Executa comando configurado (ex: `p add 76561198123456789 nomade`)
4. 📋 Retorna resultado ao usuário

### 3. **Resposta do Bot:**
```
🔗 Steam Vinculado
✅ Steam ID vinculada e permissões adicionadas no servidor!

Discord: TestUser#1234
Steam64ID: 76561198123456789
🎮 Comando RCON: p add 76561198123456789 nomade
📤 Resposta: Command executed
```

## Configuração

### config.json
```json
{
  "rcon": {
    "host": "31.97.253.61",
    "port": 27017,
    "password": "root:Mascara100@",
    "linkCommand": "p add {steamid} nomade"
  }
}
```

### Variáveis Disponíveis
- `{steamid}` - Substituído pela Steam ID do usuário

### Exemplos de Comandos RCON
```json
// Unturned - Adicionar permissão
"linkCommand": "p add {steamid} nomade"

// Unturned - Adicionar ao grupo VIP
"linkCommand": "p add {steamid} vip"

// Minecraft - Adicionar à whitelist
"linkCommand": "whitelist add {steamid}"

// Customizado
"linkCommand": "adduser {steamid} player"
```

## Tratamento de Erros

### ✅ Sucesso
- Steam ID vinculada ✅
- Comando RCON executado ✅
- Resposta do servidor exibida ✅

### ⚠️ RCON Indisponível
- Steam ID vinculada ✅
- Comando RCON falhou ❌
- Mensagem de aviso exibida ⚠️

### ❌ Erro Geral
- Steam ID não vinculada ❌
- Mensagem de erro exibida ❌

## Logs
Todos os comandos RCON executados pelo `/link` são logados:
```
✅ Comando RCON executado para TestUser#1234: p add 76561198123456789 nomade
📤 Resposta: Command executed
```

## Segurança
- ✅ Verificação de Steam ID válida
- ✅ Timeout de 10 segundos para RCON
- ✅ Tratamento de erros robusto
- ✅ Logs de todas as execuções

---

**Status: ✅ IMPLEMENTADO E FUNCIONAL**

O comando `/link` agora executa automaticamente comandos RCON quando um usuário vincula sua Steam ID, proporcionando uma experiência mais fluida e automatizada.
