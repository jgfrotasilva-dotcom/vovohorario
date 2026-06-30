@echo off
echo ========================================
echo   SETUP - Sistema de Ponto Eletronico
echo ========================================
echo.

echo [1/4] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [2/4] Configurando banco de dados...
echo IMPORTANTE: Certifique-se de que o arquivo .env esta configurado!
echo.
pause

echo.
echo [3/4] Aplicando schema ao banco...
call npx drizzle-kit push
if errorlevel 1 (
    echo ERRO ao aplicar schema!
    pause
    exit /b 1
)

echo.
echo [4/4] Criando usuario administrador...
call npx tsx src/db/seed-admin.ts
if errorlevel 1 (
    echo ERRO ao criar administrador!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SETUP CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Para iniciar o sistema:
echo   npm run dev
echo.
echo Acesse: http://localhost:3000
echo Login: admin@sistema.com
echo Senha: admin123
echo.
pause
