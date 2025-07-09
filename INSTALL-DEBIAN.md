# StarV Discord Bot - Instalação no Debian LTS

## Pré-requisitos

1. **Sistema Operacional**: Debian 11+ (LTS) ou Ubuntu 20.04+ LTS
2. **Privilégios**: Acesso sudo
3. **Node.js**: Versão 16+ (será instalado automaticamente se necessário)

## Instalação Rápida

### 1. Preparar o sistema
```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git build-essential

# Instalar Node.js LTS (se não estiver instalado)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Configurar o bot
```bash
# Navegar para o diretório do bot
cd /caminho/para/bot-vendas-mc-pago

# Dar permissão de execução ao script
chmod +x start.sh

# Configurar o arquivo config.json (copiar de config.example.json)
cp config.example.json config.json
nano config.json  # Editar com suas configurações
```

### 3. Instalar e iniciar como serviço
```bash
# Executar instalação completa
./start.sh install

# OU simplesmente
./start.sh
```

## Comandos Disponíveis

### Gerenciamento do Serviço
```bash
# Instalar/configurar bot como serviço
./start.sh install

# Iniciar serviço
./start.sh start

# Parar serviço
./start.sh stop

# Reiniciar serviço
./start.sh restart

# Ver status
./start.sh status

# Ver logs em tempo real
./start.sh logs

# Remover serviço
./start.sh remove
```

### Comandos Systemd Diretos
```bash
# Status detalhado
sudo systemctl status starv-bot

# Iniciar
sudo systemctl start starv-bot

# Parar
sudo systemctl stop starv-bot

# Reiniciar
sudo systemctl restart starv-bot

# Habilitar auto-start
sudo systemctl enable starv-bot

# Desabilitar auto-start
sudo systemctl disable starv-bot

# Ver logs
sudo journalctl -u starv-bot -f

# Ver logs das últimas 100 linhas
sudo journalctl -u starv-bot -n 100
```

## Estrutura de Arquivos

Após a instalação, a estrutura será:
```
/caminho/para/bot/
├── bot.js                 # Arquivo principal do bot
├── config.json           # Configurações (TOKEN, etc)
├── start.sh              # Script de gerenciamento
├── package.json          # Dependências Node.js
├── data/                 # Dados do bot (JSON files)
├── logs/                 # Logs locais
└── ...

/etc/systemd/system/
└── starv-bot.service     # Arquivo de serviço systemd

/var/log/starv-bot/
├── bot.log              # Logs de saída
└── error.log            # Logs de erro
```

## Logs e Monitoramento

### Localização dos Logs
- **Systemd Journal**: `sudo journalctl -u starv-bot`
- **Arquivo de Log**: `/var/log/starv-bot/bot.log`
- **Arquivo de Erro**: `/var/log/starv-bot/error.log`

### Monitoramento em Tempo Real
```bash
# Via journalctl (recomendado)
sudo journalctl -u starv-bot -f

# Via arquivos de log
tail -f /var/log/starv-bot/bot.log
tail -f /var/log/starv-bot/error.log
```

## Configurações de Segurança

O serviço é configurado com as seguintes medidas de segurança:

- **Usuário não-privilegiado**: Roda com o usuário atual, não como root
- **Diretórios protegidos**: Acesso restrito apenas aos diretórios necessários
- **Limites de recursos**: Configurado para prevenir uso excessivo de recursos
- **Restart automático**: Reinicia automaticamente em caso de falha
- **Temporary files**: Isolamento de arquivos temporários

## Troubleshooting

### Bot não inicia
```bash
# Verificar status
sudo systemctl status starv-bot

# Ver logs de erro
sudo journalctl -u starv-bot -n 50

# Verificar configuração
cat config.json

# Testar manualmente
node bot.js
```

### Problemas de permissão
```bash
# Verificar ownership dos arquivos
ls -la

# Corrigir permissões se necessário
sudo chown -R $USER:$USER .
chmod +x start.sh
```

### Atualizar o bot
```bash
# Parar serviço
./start.sh stop

# Atualizar código (git pull, etc)
git pull origin main

# Instalar novas dependências
npm install --production

# Reiniciar serviço
./start.sh start
```

## Backup e Manutenção

### Backup dos dados
```bash
# Backup automático dos dados
tar -czf backup-starv-bot-$(date +%Y%m%d).tar.gz data/ config.json

# Backup completo
tar -czf backup-starv-bot-full-$(date +%Y%m%d).tar.gz . --exclude=node_modules
```

### Rotação de logs
Os logs são automaticamente gerenciados pelo systemd, mas você pode configurar rotação adicional:

```bash
# Editar configuração de log rotation
sudo nano /etc/logrotate.d/starv-bot

# Conteúdo sugerido:
/var/log/starv-bot/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload starv-bot
    endscript
}
```

## Configurações Avançadas

### Variáveis de Ambiente
Edite o arquivo de serviço para adicionar variáveis:
```bash
sudo nano /etc/systemd/system/starv-bot.service

# Adicionar na seção [Service]:
Environment=NODE_ENV=production
Environment=DEBUG=bot:*
Environment=TZ=America/Sao_Paulo
```

### Limites de Recursos
Ajustar limites no arquivo de serviço:
```bash
# Memória máxima (em bytes)
MemoryLimit=512M

# CPU máximo (percentual)
CPUQuota=50%

# Arquivos abertos
LimitNOFILE=65536
```

Após qualquer alteração no arquivo de serviço:
```bash
sudo systemctl daemon-reload
sudo systemctl restart starv-bot
```
