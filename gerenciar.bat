@echo off
setlocal enabledelayedexpansion
title Campo Branco - Gerenciador de Projeto

:: Cores simples (usando escapes ANSI se suportado, fallback para preto e branco)
set "green=[32m"
set "blue=[34m"
set "yellow=[33m"
set "red=[31m"
set "reset=[0m"

:menu
cls
echo ======================================================
echo           CAMPO BRANCO - GERENCIADOR DE PROJETO
echo ======================================================
echo.
echo  1. Instalar / Atualizar Dependencias (npm install)
echo  2. Build do Projeto (npm run build)
echo  3. Sincronizar Regras do Firebase (DEV e PROD)
echo  4. Iniciar Servidor de Desenvolvimento (npm run dev)
echo  5. Limpeza Total (node_modules e cache)
echo.
echo  0. Sair
echo.
echo ======================================================
set /p opt="Escolha uma opcao: "

if "%opt%"=="1" goto install
if "%opt%"=="2" goto build
if "%opt%"=="3" goto rules
if "%opt%"=="4" goto devmode
if "%opt%"=="5" goto clean
if "%opt%"=="0" exit
goto menu

:install
echo.
echo --- Instalando/Atualizando dependencias ---
call npm install
echo.
echo Operacao concluida!
pause
goto menu

:build
echo.
echo --- Gerando Build do Next.js ---
call npm run build
echo.
echo Build concluido!
pause
goto menu

:rules
echo.
echo --- Sincronizando Regras do Firestore (Ambientes DEV e PROD) ---
call npm run rules:deploy
echo.
echo Regras sincronizadas com sucesso!
pause
goto menu

:devmode
echo.
echo --- Iniciando Servidor de Desenvolvimento ---
echo (Pressione Ctrl+C para parar o servidor depois)
call npm run dev
goto menu

:clean
echo.
echo --- LIMPEZA TOTAL ---
echo ATENCAO: Isso removera a pasta node_modules e o cache do Next.js.
set /p confirm="Tem certeza? (S/N): "
if /i "%confirm%"=="S" (
    echo Removendo pastas...
    if exist node_modules rmdir /s /q node_modules
    if exist .next rmdir /s /q .next
    echo Limpeza concluida. Rode a opcao 1 para reinstalar.
)
pause
goto menu
