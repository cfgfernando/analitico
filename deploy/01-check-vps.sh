#!/bin/bash
# ============================================================
# ETAPA 1 — Verificar o Estado Atual da VPS
# Execute como root: sudo bash deploy/01-check-vps.sh
# ============================================================
set -e

echo "=========================================="
echo " SGF — Diagnóstico da VPS"
echo "=========================================="
echo ""

echo "--- OS ---"
cat /etc/os-release | grep -E 'PRETTY_NAME|VERSION'
echo ""

echo "--- CPU ---"
nproc
lscpu | grep "Model name"
echo ""

echo "--- RAM ---"
free -h
echo ""

echo "--- DISCO ---"
df -h / /
echo ""

echo "--- SERVIÇOS ATIVOS ---"
systemctl list-units --type=service --state=running 2>/dev/null | grep -E 'mysql|redis|nginx|php|node|pm2' || echo "(nenhum dos serviços listados encontrado)"
echo ""

echo "--- NODE.JS ---"
node -v 2>/dev/null || echo "Node.js NÃO instalado"
npm -v 2>/dev/null || echo "npm NÃO instalado"
echo ""

echo "--- PM2 ---"
pm2 list 2>/dev/null || echo "PM2 NÃO instalado"
echo ""

echo "--- PORTAS EM USO ---"
ss -tlnp | grep -E ':80|:443|:3000|:3306|:6379' 2>/dev/null || netstat -tlnp | grep -E ':80|:443|:3000|:3306|:6379' 2>/dev/null || echo "(nenhum processo nas portas listadas)"
echo ""

echo "--- SWAP ATUAL ---"
swapon --show 2>/dev/null || echo "Nenhum swap configurado"
echo ""

echo "=========================================="
echo " Diagnóstico completo. Revise os dados acima."
echo "=========================================="
