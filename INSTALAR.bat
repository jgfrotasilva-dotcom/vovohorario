@echo off
chcp 65001 >nul
color 0A
cls

echo ================================================
echo   INSTALADOR AUTOMATICO - PONTO ELETRONICO
echo ================================================
echo.
echo   Este script vai instalar tudo automaticamente!
echo.
echo ================================================
echo.

echo [1/5] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo.
    echo ERRO! Tentando novamente...
    call npm install --legacy-peer-deps
)
echo OK!
echo.

echo [2/5] Configurando banco de dados...
echo.

REM Criar arquivo .env com dados do Supabase
echo DATABASE_URL=postgresql://postgres:JoCa1506Si%%23@db.bueynmtetdriftuyivqr.supabase.co:5432/postgres> .env
echo JWT_SECRET=ponto-eletronico-2026-chave-secreta>> .env
echo. >> .env
echo Arquivo .env configurado!
echo.

echo [3/5] Aplicando tabelas ao banco...
echo (Isso pode demorar 1-2 minutos)
echo.
call npx drizzle-kit push
echo.

echo [4/5] Criando usuario administrador...
set DATABASE_URL=postgresql://postgres:JoCa1506Si%%23@db.bueynmtetdriftuyivqr.supabase.co:5432/postgres
set JWT_SECRET=ponto-eletronico-2026-chave-secreta
call npx tsx src/db/seed-admin.ts
echo.

echo [5/5] Iniciando o sistema...
echo.
echo ================================================
echo   INSTALACAO CONCLUIDA!
echo ================================================
echo.
echo   Acesse: http://localhost:3000
echo   Login: admin@sistema.com
echo   Senha: admin123
echo.
echo ================================================
echo.

start http://localhost:3000
call npm run dev
