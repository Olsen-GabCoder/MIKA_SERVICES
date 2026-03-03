#!/bin/sh
# Remplace __PORT__ par $PORT (Railway) ou 80 par défaut, puis lance nginx.
PORT="${PORT:-80}"
sed "s/__PORT__/$PORT/g" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
