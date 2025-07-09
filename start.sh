#!/bin/bash

# Bot Discord - StarV
# Script de inicialização para Debian LTS
# Configurado para funcionar como systemd service

# Configurações
BOT_NAME="starv-discord-bot"
BOT_DIR="/opt/starv-bot"
NODE_ENV="production"
LOG_DIR="/var/log/starv-bot"
PID_FILE="/var/run/starv-bot.pid"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Verificar se está rodando como root (necessário para systemd)
check_root() {
    if [[ $EUID -eq 0 ]]; then
        warning "Rodando como root. Para produção, considere criar um usuário específico."
    fi
}

# Verificar dependências
check_dependencies() {
    log "🔍 Verificando dependências..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js não está instalado!"
        info "Instale com: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
        exit 1
    fi
    
    NODE_VERSION=$(node -v)
    log "✅ Node.js encontrado: $NODE_VERSION"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        error "npm não está instalado!"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    log "✅ npm encontrado: $NPM_VERSION"
    
    # Verificar systemctl
    if ! command -v systemctl &> /dev/null; then
        error "systemctl não está disponível! Este script requer systemd."
        exit 1
    fi
    
    log "✅ systemd encontrado"
}

# Instalar dependências do Node.js
install_dependencies() {
    log "📦 Instalando dependências do Node.js..."
    
    if [ ! -f "package.json" ]; then
        error "package.json não encontrado!"
        exit 1
    fi
    
    npm install --production
    if [ $? -eq 0 ]; then
        log "✅ Dependências instaladas com sucesso"
    else
        error "Falha ao instalar dependências"
        exit 1
    fi
}

# Verificar configuração
check_config() {
    log "⚙️ Verificando configuração..."
    
    if [ ! -f "config.json" ]; then
        error "config.json não encontrado!"
        info "Copie config.example.json para config.json e configure-o"
        exit 1
    fi
    
    # Verificar se tem token
    if ! grep -q '"token"' config.json; then
        error "Token do bot não configurado em config.json"
        exit 1
    fi
    
    log "✅ Configuração válida"
}

# Criar diretórios necessários
create_directories() {
    log "📁 Criando diretórios necessários..."
    
    # Diretório de logs
    sudo mkdir -p $LOG_DIR
    sudo chown $(whoami):$(whoami) $LOG_DIR
    
    # Diretório data se não existir
    mkdir -p data
    mkdir -p logs
    
    log "✅ Diretórios criados"
}

# Criar arquivo de serviço systemd
create_systemd_service() {
    log "🔧 Criando serviço systemd..."
    
    CURRENT_DIR=$(pwd)
    CURRENT_USER=$(whoami)
    
    sudo tee /etc/systemd/system/starv-bot.service > /dev/null <<EOF
[Unit]
Description=StarV Discord Bot
After=network.target
Wants=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$CURRENT_DIR
ExecStart=/usr/bin/node bot.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
StandardOutput=append:$LOG_DIR/bot.log
StandardError=append:$LOG_DIR/error.log

# Limites de recursos
LimitNOFILE=65536
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$CURRENT_DIR $LOG_DIR
NoNewPrivileges=true

# Reiniciar em caso de falha
StartLimitInterval=60s
StartLimitBurst=3

[Install]
WantedBy=multi-user.target
EOF

    if [ $? -eq 0 ]; then
        log "✅ Arquivo de serviço criado: /etc/systemd/system/starv-bot.service"
    else
        error "Falha ao criar arquivo de serviço"
        exit 1
    fi
}

# Configurar e iniciar serviço
setup_service() {
    log "🚀 Configurando serviço systemd..."
    
    # Recarregar systemd
    sudo systemctl daemon-reload
    
    # Habilitar o serviço para iniciar automaticamente
    sudo systemctl enable starv-bot.service
    
    # Iniciar o serviço
    sudo systemctl start starv-bot.service
    
    if [ $? -eq 0 ]; then
        log "✅ Serviço iniciado com sucesso"
    else
        error "Falha ao iniciar serviço"
        sudo systemctl status starv-bot.service
        exit 1
    fi
}

# Verificar status do serviço
check_service_status() {
    log "📊 Verificando status do serviço..."
    
    if sudo systemctl is-active --quiet starv-bot.service; then
        log "✅ Serviço está rodando"
        sudo systemctl status starv-bot.service --no-pager -l
    else
        error "Serviço não está rodando"
        sudo systemctl status starv-bot.service --no-pager -l
        exit 1
    fi
}

# Mostrar logs
show_logs() {
    log "📋 Últimas 20 linhas do log:"
    echo ""
    sudo journalctl -u starv-bot.service -n 20 --no-pager
    echo ""
    info "Para ver logs em tempo real: sudo journalctl -u starv-bot.service -f"
    info "Para ver logs do arquivo: tail -f $LOG_DIR/bot.log"
}

# Função principal
main() {
    echo ""
    log "🤖 StarV Discord Bot - Configuração para Debian LTS"
    log "=================================================="
    echo ""
    
    check_root
    check_dependencies
    install_dependencies
    check_config
    create_directories
    create_systemd_service
    setup_service
    check_service_status
    show_logs
    
    echo ""
    log "🎉 Bot configurado e iniciado como serviço systemd!"
    echo ""
    info "Comandos úteis:"
    info "  • Verificar status: sudo systemctl status starv-bot"
    info "  • Parar bot: sudo systemctl stop starv-bot"
    info "  • Iniciar bot: sudo systemctl start starv-bot"
    info "  • Reiniciar bot: sudo systemctl restart starv-bot"
    info "  • Ver logs: sudo journalctl -u starv-bot -f"
    info "  • Desabilitar auto-start: sudo systemctl disable starv-bot"
    echo ""
}

# Verificar argumentos
case "${1:-}" in
    "install"|"setup"|"")
        main
        ;;
    "start")
        log "🚀 Iniciando serviço..."
        sudo systemctl start starv-bot.service
        ;;
    "stop")
        log "🛑 Parando serviço..."
        sudo systemctl stop starv-bot.service
        ;;
    "restart")
        log "🔄 Reiniciando serviço..."
        sudo systemctl restart starv-bot.service
        ;;
    "status")
        sudo systemctl status starv-bot.service --no-pager -l
        ;;
    "logs")
        sudo journalctl -u starv-bot.service -f
        ;;
    "remove")
        log "🗑️ Removendo serviço..."
        sudo systemctl stop starv-bot.service
        sudo systemctl disable starv-bot.service
        sudo rm /etc/systemd/system/starv-bot.service
        sudo systemctl daemon-reload
        log "✅ Serviço removido"
        ;;
    *)
        echo "Uso: $0 [install|start|stop|restart|status|logs|remove]"
        echo ""
        echo "Comandos:"
        echo "  install  - Instala e configura o bot como serviço (padrão)"
        echo "  start    - Inicia o serviço"
        echo "  stop     - Para o serviço"
        echo "  restart  - Reinicia o serviço"
        echo "  status   - Mostra status do serviço"
        echo "  logs     - Mostra logs em tempo real"
        echo "  remove   - Remove o serviço do sistema"
        exit 1
        ;;
esac