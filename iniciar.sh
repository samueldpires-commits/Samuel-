#!/bin/sh
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Instale o Node.js em https://nodejs.org"; exit 1; }
[ -d node_modules ] || npm install
echo "Abra http://localhost:3000 no navegador"
node server.js
