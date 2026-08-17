#!/bin/bash
# ============================================================
# Monitoramento de RAM — Alerta via log quando RAM livre < 300MB
# Instalar: sudo bash deploy/03-monitor-memory.sh
# ============================================================
set -e

cat > /usr/local/bin/check-memory.sh << 'SCRIPT'
#!/bin/bash
FREE=$(free -m | awk 'NR==2{print $4}')
TOTAL=$(free -m | awk 'NR==2{print $2}')
USED_PCT=$(free | awk 'NR==2{printf "%.0f", $3/$2*100}')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$FREE" -lt 300 ]; then
  MSG="[$TIMESTAMP] ALERTA: RAM livre abaixo de 300 MB! Livre: ${FREE}MB / Total: ${TOTAL}MB (${USED_PCT}% usado)"
  echo "$MSG" >> /var/log/sgf-memory-alerts.log

  # Log dos top 5 processos por consumo de RAM
  echo "[$TIMESTAMP] Top 5 processos por RAM:" >> /var/log/sgf-memory-alerts.log
  ps aux --sort=-%mem | head -6 >> /var/log/sgf-memory-alerts.log
  echo "---" >> /var/log/sgf-memory-alerts.log
fi
SCRIPT

chmod +x /usr/local/bin/check-memory.sh

# Adicionar ao cron (a cada 5 minutos)
CRON_LINE="*/5 * * * * /usr/local/bin/check-memory.sh"
(crontab -l 2>/dev/null | grep -v "check-memory"; echo "$CRON_LINE") | crontab -

echo "Monitoramento de RAM instalado."
echo "Logs em: /var/log/sgf-memory-alerts.log"
echo "Verificação a cada 5 minutos."
