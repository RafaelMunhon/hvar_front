#!/bin/sh

# Substituir base href no index.html se necessário
sed -i 's|<base href=".*">|<base href="/">|g' /usr/share/nginx/html/index.html

# Executar comando original
exec "$@" 