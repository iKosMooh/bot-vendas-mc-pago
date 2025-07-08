# 🤖 Bot Vendas MC - Mercado Pago Integration

Bot completo para Discord com sistema de vendas integrado ao Mercado Pago, sistema de tickets, integração RCON e muito mais!

## 🚀 Funcionalidades

### 💳 Sistema de Vendas
- Integração completa com Mercado Pago
- Pagamentos via PIX com QR Code
- Verificação automática de pagamentos
- Entrega automática de produtos
- Sistema de estoque
- Histórico de compras

### 🎫 Sistema de Tickets
- Criação de tickets de suporte
- Canais privados para atendimento
- Sistema de fechamento automático
- Controle de permissões
- Histórico de tickets

### 🎮 Integração RCON
- Conexão com servidor Minecraft
- Execução de comandos automáticos
- Entrega de produtos via RCON
- Monitoramento de status

### 👥 Sistema de Usuários
- Perfis de usuários
- Vinculação de contas Steam
- Histórico de compras
- Estatísticas detalhadas

### 🛡️ Administração
- Gerenciamento de produtos
- Controle de pagamentos
- Sistema de logs
- Configurações avançadas

## 📋 Comandos Disponíveis

### 👥 Comandos de Usuário
- `!ping` - Verifica a latência do bot
- `!shop [página]` - Catálogo visual de produtos
- `!listproducts` - Lista produtos disponíveis
- `!buy <ID>` - Compra um produto
- `!profile [@usuário]` - Mostra perfil e histórico
- `!checkpayment <ID>` - Verifica status de pagamento
- `!mypayments` - Mostra seus pagamentos
- `!mypurchases` - Mostra suas compras aprovadas
- `!purchasedetails <ID>` - Detalhes de uma compra
- `!link <steamid>` - Vincula sua conta Steam
- `!help` - Mostra ajuda completa

### 🎫 Sistema de Tickets
- `!createticket <motivo>` - Cria um ticket de suporte
- `!closeticket` - Fecha ticket (no canal do ticket)
- `!tickethelp` - Ajuda sobre tickets
- `!listtickets` - Lista tickets ativos (Admin)
- `!forceclose <ID>` - Força fechamento (Admin)
- `!testticket` - Testa sistema de tickets (Admin)

### 👑 Comandos Administrativos
- `!addproduct` - Adiciona um produto
- `!listpayments` - Lista todos os pagamentos
- `!listapproved` - Lista compras aprovadas
- `!purchasestats` - Estatísticas de vendas
- `!clearpayments` - Limpa todos os pagamentos
- `!forcedelivery <ID>` - Força entrega manual
- `!syncpayments` - Sincroniza pagamentos
- `!clear <quantidade>` - Limpa mensagens
- `!status` - Status geral do bot
- `!config` - Gerencia configurações
- `!logs` - Visualiza logs do sistema

### 🔧 Comandos Técnicos
- `!testmp` - Testa Mercado Pago
- `!mpstatus` - Status do Mercado Pago
- `!testrcon` - Testa conexão RCON
- `!rconstatus` - Status do RCON
- `!rconreset` - Reseta conexão RCON
- `!webcommand <cmd>` - Executa comando web
- `!setwebcommand <cmd>` - Define comando web

### ⚡ Comandos Slash
- `/venda` - Anuncia um produto
- `/delproduct` - Remove um produto
- `/vendas` - Estatísticas de vendas
- `/linksteam` - Vincula conta Steam (Admin)

## 🔧 Instalação

### 1. Pré-requisitos
```bash
# Node.js 16+ e npm
node --version
npm --version
```

### 2. Clonar e instalar
```bash
git clone <repository-url>
cd bot-vendas-mc-pago
npm install
```

### 3. Configurar o bot
Edite o arquivo `config.json` com suas configurações:

```json
{
  "token": "SEU_TOKEN_DO_BOT_AQUI",
  "prefix": "!",
  "mercadoPago": {
    "accessToken": "SEU_ACCESS_TOKEN_MERCADO_PAGO",
    "webhook": "SEU_WEBHOOK_URL_AQUI"
  },
  "rcon": {
    "host": "IP_DO_SERVIDOR",
    "port": 25575,
    "password": "SENHA_RCON"
  }
}
```

### 4. Configurar produtos
Edite o arquivo `produtos.json` com seus produtos:

```json
[
  {
    "id": "vip_mensal",
    "name": "VIP Mensal",
    "description": "Acesso VIP por 30 dias",
    "price": 19.99,
    "stock": 50,
    "commands": [
      "lp user {username} parent set vip"
    ]
  }
]
```

### 5. Executar o bot
```bash
npm start
# ou
node index.js
```

## 📊 Estrutura de Arquivos

```
bot-vendas-mc-pago/
├── index.js                 # Arquivo principal
├── base.js                  # Funções base (pagamentos, etc)
├── init-files.js           # Inicialização de arquivos
├── config.json             # Configurações
├── produtos.json           # Produtos disponíveis
├── package.json            # Dependências
├── README.md               # Documentação
├── ComandosSlash/          # Comandos Slash
│   └── admin/
│       ├── delproduct.js   # Remover produtos
│       ├── vendas.js       # Estatísticas
│       └── linksteam.js    # Vincular Steam
├── comandos/               # Comandos prefixados
│   ├── addproduct.js       # Adicionar produto
│   ├── buy.js              # Comprar produto
│   ├── shop.js             # Catálogo
│   ├── profile.js          # Perfil usuário
│   ├── checkpayment.js     # Verificar pagamento
│   ├── createticket.js     # Criar ticket
│   ├── status.js           # Status do bot
│   ├── config.js           # Configurações
│   ├── logs.js             # Logs sistema
│   └── help.js             # Ajuda completa
└── handler/                # Handlers
    ├── index.js            # Handler principal
    └── prefix.js           # Handler comandos prefix
```

## 🔑 Configuração do Mercado Pago

1. Acesse o [Mercado Pago Developers](https://developers.mercadopago.com/)
2. Crie uma aplicação
3. Obtenha seu Access Token
4. Configure no `config.json`

## 🎮 Configuração RCON

1. Ative o RCON no seu servidor Minecraft
2. Configure IP, porta e senha
3. Teste a conexão com `!testrcon`

## 🎫 Sistema de Tickets

O sistema de tickets cria canais privados automaticamente:
- Apenas o usuário e administradores podem ver
- Fechamento automático por inatividade
- Logs de todas as interações

## 📈 Monitoramento

- Use `!status` para ver status geral
- Use `!logs` para visualizar logs
- Configure canais de notificação

## 🛡️ Segurança

- Tokens e senhas em arquivo separado
- Validação de permissões
- Logs de todas as ações
- Backup automático de dados

## 🐛 Solução de Problemas

### Bot não responde
1. Verifique se o token está correto
2. Verifique as permissões do bot
3. Veja os logs no console

### Pagamentos não funcionam
1. Verifique o Access Token do Mercado Pago
2. Teste com `!testmp`
3. Verifique a conexão de internet

### RCON não conecta
1. Verifique IP, porta e senha
2. Teste com `!testrcon`
3. Verifique firewall do servidor

## 📞 Suporte

Para suporte, use o sistema de tickets do próprio bot ou entre em contato através dos canais oficiais.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ para a comunidade Minecraft**
