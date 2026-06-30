#!/bin/bash

echo "🚀 Configurando banco de dados..."

# Aplicar schema ao banco
echo "📋 Aplicando schema..."
npx drizzle-kit push

# Executar seed
echo "🌱 Populando banco com dados iniciais..."
npx tsx src/db/seed.ts

echo "✅ Setup concluído!"
