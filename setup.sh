#!/bin/bash
echo "========================================"
echo "  SETUP - Sistema de Ponto Eletronico"
echo "========================================"
echo ""

echo "[1/4] Instalando dependencias..."
npm install
if [ $? -ne 0 ]; then
    echo "ERRO ao instalar dependencias!"
    exit 1
fi

echo ""
echo "[2/4] Configurando banco de dados..."
echo "IMPORTANTE: Certifique-se de que o arquivo .env esta configurado!"
read -p "Pressione Enter para continuar..."

echo ""
echo "[3/4] Aplicando schema ao banco..."
npx drizzle-kit push
if [ $? -ne 0 ]; then
    echo "ERRO ao aplicar schema!"
    exit 1
fi

echo ""
echo "[4/4] Criando usuario administrador..."
npx tsx src/db/seed-admin.ts
if [ $? -ne 0 ]; then
    echo "ERRO ao criar administrador!"
    exit 1
fi

echo ""
echo "========================================"
echo "  SETUP CONCLUIDO COM SUCESSO!"
echo "========================================"
echo ""
echo "Para iniciar o sistema:"
echo "  npm run dev"
echo ""
echo "Acesse: http://localhost:3000"
echo "Login: admin@sistema.com"
echo "Senha: admin123"
echo ""
