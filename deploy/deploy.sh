#!/bin/bash
# ============================================================
# SGF — Script de Deploy para VPS DigitalOcean (4GB RAM)
# Execute como root: sudo bash deploy/deploy.sh
# ============================================================
set -e

PROJECT_DIR="/var/www/analitico"
BACKUP_DIR="/var/backups/sgf"
LOG_FILE="/var/log/sgf-deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log " SGF — Deploy na VPS"
log "=========================================="

# -------------------------------------------------------
# ETAPA 1: Diagnóstico
# -------------------------------------------------------
log ""
log "--- ETAPA 1: Diagnóstico da VPS ---"
free -h | tee -a "$LOG_FILE"
df -h / | tee -a "$LOG_FILE"
log "CPU: $(nproc) vCPUs"
log ""

# -------------------------------------------------------
# ETAPA 2: Node.js 20 LTS
# -------------------------------------------------------
log "--- ETAPA 2: Verificando Node.js ---"
if command -v node &> /dev/null; then
  NODE_VER=$(node -v)
  log "Node.js já instalado: $NODE_VER"
  if [[ "$NODE_VER" != v20* ]]; then
    log "AVISO: Versão diferente de v20. Atualizando..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
else
  log "Instalando Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
log "Node: $(node -v) | npm: $(npm -v)"

# -------------------------------------------------------
# ETAPA 3: PM2
# -------------------------------------------------------
log ""
log "--- ETAPA 3: Verificando PM2 ---"
if ! command -v pm2 &> /dev/null; then
  log "Instalando PM2..."
  sudo npm install -g pm2
fi
log "PM2: $(pm2 -v)"

# -------------------------------------------------------
# ETAPA 4: Clonar/atualizar o projeto
# -------------------------------------------------------
log ""
log "--- ETAPA 4: Preparando projeto ---"
if [ ! -d "$PROJECT_DIR" ]; then
  log "Criando diretório do projeto..."
  sudo mkdir -p "$PROJECT_DIR"
fi

# Copiar os arquivos do build (presumindo que o build já foi feito localmente)
log "Projeto em: $PROJECT_DIR"
log "IMPORTANTE: Copie os arquivos buildados para $PROJECT_DIR antes de prosseguir."
log "  Exemplo: scp -r dist/ root@IP:/var/www/analitico/"
log "  Exemplo: scp package.json package-lock.json root@IP:/var/www/analitico/"

# Instalar dependências de produção
cd "$PROJECT_DIR"
if [ -f "package.json" ]; then
  log "Instalando dependências..."
  npm ci --omit=dev 2>&1 | tail -5 | tee -a "$LOG_FILE"
fi

# Gerar Prisma Client
if [ -f "prisma/schema.prisma" ]; then
  log "Gerando Prisma Client..."
  npx prisma generate 2>&1 | tee -a "$LOG_FILE"
fi

# Build do frontend (Vite)
if [ -f "vite.config.ts" ]; then
  log "Buildando frontend..."
  npx vite build 2>&1 | tail -3 | tee -a "$LOG_FILE"
fi

# Build do backend (esbuild — mesmo método do package.json)
log "Buildando backend (API + Worker)..."
npm run build 2>&1 | tail -5 | tee -a "$LOG_FILE"

# Build do worker separado
log "Buildando worker de filas..."
npx esbuild src/server/worker.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server-worker.cjs 2>&1 | tail -3 | tee -a "$LOG_FILE"

# -------------------------------------------------------
# ETAPA 5: MySQL otimizado
# -------------------------------------------------------
log ""
log "--- ETAPA 5: Configurando MySQL ---"
if [ -f "/etc/mysql/mysql.conf.d/mysqld.cnf" ]; then
  sudo cp /etc/mysql/mysql.conf.d/mysqld.cnf "$BACKUP_DIR/mysqld.cnf.bak.$(date +%Y%m%d)" 2>/dev/null || true
  sudo cp deploy/mysql-optimized.cnf /etc/mysql/mysql.conf.d/mysqld-sgf.cnf
  log "Config MySQL aplicada. Reiniciando MySQL..."
  sudo systemctl restart mysql
  sudo systemctl status mysql --no-pager | head -5 | tee -a "$LOG_FILE"
else
  log "AVISO: MySQL não encontrado em /etc/mysql/. Pulando."
fi

# -------------------------------------------------------
# ETAPA 6: Redis otimizado
# -------------------------------------------------------
log ""
log "--- ETAPA 6: Configurando Redis ---"
if [ -f "/etc/redis/redis.conf" ]; then
  sudo cp /etc/redis/redis.conf "$BACKUP_DIR/redis.conf.bak.$(date +%Y%m%d)" 2>/dev/null || true
  # Aplicar apenas as linhas que precisam mudar
  sudo sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf 2>/dev/null || true
  sudo sed -i 's/^maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf 2>/dev/null || true
  sudo sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf 2>/dev/null || true
  grep -q '^maxmemory ' /etc/redis/redis.conf || echo 'maxmemory 256mb' | sudo tee -a /etc/redis/redis.conf > /dev/null
  grep -q '^maxmemory-policy' /etc/redis/redis.conf || echo 'maxmemory-policy allkeys-lru' | sudo tee -a /etc/redis/redis.conf > /dev/null
  log "Config Redis aplicada. Reiniciando Redis..."
  sudo systemctl restart redis-server 2>/dev/null || sudo systemctl restart redis 2>/dev/null || true
  log "Redis reiniciado."
else
  log "AVISO: Redis não encontrado. Pulando."
fi

# -------------------------------------------------------
# ETAPA 7: Swap de segurança
# -------------------------------------------------------
log ""
log "--- ETAPA 7: Verificando Swap ---"
if [ ! -f "/swapfile" ]; then
  log "Criando swap de 2GB..."
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
  sudo sysctl vm.swappiness=10
  echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf > /dev/null
  log "Swap criado e ativado."
else
  log "Swap já existe."
fi
free -h | tee -a "$LOG_FILE"

# -------------------------------------------------------
# ETAPA 8: Nginx
# -------------------------------------------------------
log ""
log "--- ETAPA 8: Configurando Nginx ---"
if command -v nginx &> /dev/null; then
  sudo cp /etc/nginx/sites-available/default "$BACKUP_DIR/nginx-default.bak.$(date +%Y%m%d)" 2>/dev/null || true
  sudo cp deploy/nginx-sgf.conf /etc/nginx/sites-available/sgf
  sudo ln -sf /etc/nginx/sites-available/sgf /etc/nginx/sites-enabled/sgf
  sudo nginx -t 2>&1 | tee -a "$LOG_FILE"
  sudo systemctl reload nginx
  log "Nginx configurado e recarregado."
else
  log "AVISO: Nginx não encontrado. Instale com: sudo apt install nginx"
fi

# -------------------------------------------------------
# ETAPA 9: PM2 — Subir a aplicação
# -------------------------------------------------------
log ""
log "--- ETAPA 9: Iniciando com PM2 ---"
cd "$PROJECT_DIR"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js 2>&1 | tee -a "$LOG_FILE"
pm2 save 2>&1 | tee -a "$LOG_FILE"

# Habilitar PM2 no boot
pm2 startup systemd -u root --hp /root 2>&1 | tail -3 | tee -a "$LOG_FILE" || true

# -------------------------------------------------------
# ETAPA 10: Monitoramento
# -------------------------------------------------------
log ""
log "--- ETAPA 10: Configurando monitoramento ---"
sudo bash deploy/03-monitor-memory.sh 2>&1 | tee -a "$LOG_FILE"

# -------------------------------------------------------
# ETAPA 11: Validação final
# -------------------------------------------------------
log ""
log "=========================================="
log " VALIDAÇÃO FINAL"
log "=========================================="
log ""
log "--- RAM ---"
free -h
log ""
log "--- PM2 ---"
pm2 list
log ""
log "--- Serviços ---"
systemctl status mysql --no-pager | head -3
systemctl status redis-server --no-pager | head -3 || systemctl status redis --no-pager | head -3
systemctl status nginx --no-pager | head -3
log ""
log "--- Health Check ---"
sleep 3
curl -s http://127.0.0.1:3000/health 2>/dev/null && log "API: OK" || log "API: FALHOU (verifique pm2 logs sgf-api)"
log ""
log "=========================================="
log " Deploy concluído!"
log " Logs: $LOG_FILE"
log " PM2: pm2 logs sgf-api / pm2 logs sgf-worker"
log " Monitor RAM: tail -f /var/log/sgf-memory-alerts.log"
log "=========================================="
