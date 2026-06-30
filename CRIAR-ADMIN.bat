@echo off
chcp 65001 >nul
color 0A
cls

echo ================================================
echo   CRIANDO USUARIO ADMINISTRADOR...
echo ================================================
echo.

set DATABASE_URL=postgresql://postgres:JoCa1506Si%%23@db.bueynmtetdriftuyivqr.supabase.co:5432/postgres
set JWT_SECRET=ponto-eletronico-2026-chave-secreta

npx tsx src/db/seed-admin.ts

echo.
echo ================================================
echo   PRONTO! Acesse http://localhost:3000
echo   Login: admin@sistema.com
echo   Senha: admin123
echo ================================================
echo.
pause
