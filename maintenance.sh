#!/bin/bash

# StarV Bot - Script de Manutenção
# Utilitários para backup, update e manutenção do bot

# Configurações
BOT_NAME="starv-bot"
BACKUP_DIR="/opt/starv-bot/backups"
LOG_DIR="/var/log/starv-bot"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Criar backup
backup() {
    log "📦 Criando backup..."
    
    mkdir -p $BACKUP_DIR
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/starv-bot-backup-$TIMESTAMP.tar.gz"
    
    # Parar serviço temporariamente
    log "⏸️ Parando serviço temporariamente..."
    sudo systemctl stop starv-bot
    
    # Criar backup
    tar -czf $BACKUP_FILE \
        --exclude=node_modules \
        --exclude=backups \
        --exclude=.git \
        . 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log "✅ Backup criado: $BACKUP_FILE"
    else
        error "Falha ao criar backup"
    fi
    
    # Reiniciar serviço
    log "▶️ Reiniciando serviço..."
    sudo systemctl start starv-bot
    
    # Limpar backups antigos (manter últimos 10)
    ls -t $BACKUP_DIR/starv-bot-backup-*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null
    log "🧹 Backups antigos removidos"
}

# Atualizar bot
update() {
    log "🔄 Atualizando bot..."
    
    # Criar backup antes da atualização
    backup
    
    # Parar serviço
    log "⏸️ Parando serviço..."
    sudo systemctl stop starv-bot
    
    # Atualizar código (se usando git)
    if [ -d ".git" ]; then
        log "📥 Baixando atualizações..."
        git pull origin main
        if [ $? -ne 0 ]; then
            error "Falha ao atualizar código"
            sudo systemctl start starv-bot
            exit 1
        fi
    else
        info "Repositório git não encontrado, pule esta etapa se atualizou manualmente"
    fi
    
    # Atualizar dependências
    log "📦 Atualizando dependências..."
    npm install --production
    if [ $? -ne 0 ]; then
        error "Falha ao atualizar dependências"
        sudo systemctl start starv-bot
        exit 1
    fi
    
    # Reiniciar serviço
    log "▶️ Reiniciando serviço..."
    sudo systemctl start starv-bot
    
    # Verificar se iniciou corretamente
    sleep 5
    if sudo systemctl is-active --quiet starv-bot; then
        log "✅ Bot atualizado e reiniciado com sucesso"
    else
        error "Bot falhou ao iniciar após atualização"
        sudo systemctl status starv-bot
    fi
}

# Limpar logs
clean_logs() {
    log "🧹 Limpando logs antigos..."
    
    # Limpar logs do systemd (manter últimos 7 dias)
    sudo journalctl --vacuum-time=7d
    
    # Limpar logs de arquivo (manter últimos 30 dias)
    find $LOG_DIR -name "*.log" -type f -mtime +30 -delete 2>/dev/null
    
    # Compactar logs antigos
    find $LOG_DIR -name "*.log" -type f -mtime +7 -exec gzip {} \; 2>/dev/null
    
    log "✅ Logs limpos"
}

# Verificar saúde do sistema
health_check() {
    log "🏥 Verificando saúde do sistema..."
    
    echo ""
    info "📊 Status do Serviço:"
    sudo systemctl status starv-bot --no-pager -l
    
    echo ""
    info "💾 Uso de Memória:"
    if sudo systemctl is-active --quiet starv-bot; then
        PID=$(sudo systemctl show starv-bot --property=MainPID --value)
        if [ "$PID" != "0" ]; then
            ps -p $PID -o pid,ppid,cmd,%mem,%cpu --no-headers
        fi
    fi
    
    echo ""
    info "💿 Espaço em Disco:"
    df -h . | tail -1
    
    echo ""
    info "📈 Últimas 5 linhas do log:"
    sudo journalctl -u starv-bot -n 5 --no-pager
    
    echo ""
    info "🔍 Verificando arquivos críticos:"
    files=("config.json" "bot.js" "package.json")
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo "  ✅ $file"
        else
            echo "  ❌ $file (não encontrado)"
        fi
    done
}

# Reinstalar serviço
reinstall_service() {
    log "🔧 Reinstalando serviço..."
    
    # Parar e remover serviço existente
    sudo systemctl stop starv-bot 2>/dev/null
    sudo systemctl disable starv-bot 2>/dev/null
    sudo rm -f /etc/systemd/system/starv-bot.service
    
    # Reinstalar
    ./start.sh install
    
    log "✅ Serviço reinstalado"
}

# Exportar dados
export_data() {
    log "📤 Exportando dados do bot..."
    
    EXPORT_DIR="export_$(date +%Y%m%d_%H%M%S)"
    mkdir -p $EXPORT_DIR
    
    # Copiar dados
    cp -r data/ $EXPORT_DIR/ 2>/dev/null
    cp config.json $EXPORT_DIR/ 2>/dev/null
    
    # Criar arquivo de informações
    cat > $EXPORT_DIR/export_info.txt << EOF
StarV Bot - Export de Dados
============================
Data: $(date)
Versão Node.js: $(node -v)
Status do Bot: $(sudo systemctl is-active starv-bot)

Arquivos inclusos:
- data/ (todos os dados do bot)
- config.json (configurações)

Para importar em outro servidor:
1. Instalar o bot normalmente
2. Parar o serviço: sudo systemctl stop starv-bot
3. Sobrescrever data/ e config.json
4. Reiniciar: sudo systemctl start starv-bot
EOF

    # Compactar
    tar -czf "${EXPORT_DIR}.tar.gz" $EXPORT_DIR/
    rm -rf $EXPORT_DIR/
    
    log "✅ Dados exportados para: ${EXPORT_DIR}.tar.gz"
}

# Menu principal
show_menu() {
    echo ""
    log "🤖 StarV Bot - Menu de Manutenção"
    echo "=================================="
    echo ""
    echo "1) 📦 Criar Backup"
    echo "2) 🔄 Atualizar Bot"
    echo "3) 🧹 Limpar Logs"
    echo "4) 🏥 Verificar Saúde"
    echo "5) 🔧 Reinstalar Serviço"
    echo "6) 📤 Exportar Dados"
    echo "7) 📊 Ver Status"
    echo "8) 📋 Ver Logs"
    echo "9) ❌ Sair"
    echo ""
    read -p "Escolha uma opção [1-9]: " choice
    
    case $choice in
        1) backup ;;
        2) update ;;
        3) clean_logs ;;
        4) health_check ;;
        5) reinstall_service ;;
        6) export_data ;;
        7) sudo systemctl status starv-bot ;;
        8) sudo journalctl -u starv-bot -f ;;
        9) log "👋 Até logo!"; exit 0 ;;
        *) error "Opção inválida!"; show_menu ;;
    esac
}

# Processar argumentos
case "${1:-menu}" in
    "backup")
        backup
        ;;
    "update")
        update
        ;;
    "clean")
        clean_logs
        ;;
    "health")
        health_check
        ;;
    "reinstall")
        reinstall_service
        ;;
    "export")
        export_data
        ;;
    "menu"|"")
        show_menu
        ;;
    *)
        echo "Uso: $0 [backup|update|clean|health|reinstall|export|menu]"
        echo ""
        echo "Comandos:"
        echo "  backup     - Criar backup dos dados"
        echo "  update     - Atualizar bot e dependências"
        echo "  clean      - Limpar logs antigos"
        echo "  health     - Verificar saúde do sistema"
        echo "  reinstall  - Reinstalar serviço systemd"
        echo "  export     - Exportar dados para outro servidor"
        echo "  menu       - Mostrar menu interativo (padrão)"
        exit 1
        ;;
esac
