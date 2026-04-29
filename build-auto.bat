@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ╔════════════════════════════════════════════════════════════╗
echo ║   Multi-Model LLM Chat - Автоматическая сборка            ║
echo ║   Версия 2.0.0                                             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Проверка прав администратора
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Требуются права администратора
    echo [i] Перезапуск с правами администратора...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo [1/5] Проверка Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Node.js не установлен
    echo [i] Скачивание Node.js 20.x LTS...

    :: Скачивание Node.js installer
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi' -OutFile '%TEMP%\nodejs.msi'}"

    if exist "%TEMP%\nodejs.msi" (
        echo [i] Установка Node.js...
        msiexec /i "%TEMP%\nodejs.msi" /qn /norestart

        :: Ожидание завершения установки
        timeout /t 30 /nobreak >nul

        :: Обновление PATH
        set "PATH=%PATH%;%ProgramFiles%\nodejs"

        del "%TEMP%\nodejs.msi"
        echo [✓] Node.js установлен
    ) else (
        echo [X] Ошибка скачивания Node.js
        echo [i] Установите вручную: https://nodejs.org/
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [✓] Node.js !NODE_VERSION! найден
)

echo.
echo [2/5] Проверка npm...
where npm >nul 2>&1
if %errorLevel% neq 0 (
    echo [X] npm не найден
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [✓] npm !NPM_VERSION! найден

echo.
echo [3/5] Установка зависимостей...
echo [i] Это может занять 2-5 минут...

call npm install --loglevel=error
if %errorLevel% neq 0 (
    echo [X] Ошибка установки зависимостей
    pause
    exit /b 1
)
echo [✓] Зависимости установлены

echo.
echo [4/5] Сборка приложения...
echo [i] Компиляция TypeScript и сборка Electron...
echo [i] Это может занять 3-7 минут...

call npm run dist:win
if %errorLevel% neq 0 (
    echo [X] Ошибка сборки
    pause
    exit /b 1
)
echo [✓] Приложение собрано

echo.
echo [5/5] Проверка результата...

if exist "release\Multi-Model LLM Chat Setup 2.0.0.exe" (
    echo [✓] Установщик создан
    set INSTALLER_SIZE=0
    for %%A in ("release\Multi-Model LLM Chat Setup 2.0.0.exe") do set INSTALLER_SIZE=%%~zA
    set /a INSTALLER_SIZE_MB=!INSTALLER_SIZE! / 1048576
    echo [i] Размер: !INSTALLER_SIZE_MB! MB
) else (
    echo [!] Установщик не найден
)

if exist "release\Multi-Model LLM Chat 2.0.0.exe" (
    echo [✓] Portable версия создана
    set PORTABLE_SIZE=0
    for %%A in ("release\Multi-Model LLM Chat 2.0.0.exe") do set PORTABLE_SIZE=%%~zA
    set /a PORTABLE_SIZE_MB=!PORTABLE_SIZE! / 1048576
    echo [i] Размер: !PORTABLE_SIZE_MB! MB
) else (
    echo [!] Portable версия не найдена
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   СБОРКА ЗАВЕРШЕНА УСПЕШНО!                               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Готовые файлы находятся в папке: release\
echo.
echo [1] Установщик: Multi-Model LLM Chat Setup 2.0.0.exe
echo [2] Portable:   Multi-Model LLM Chat 2.0.0.exe
echo.

:: Открыть папку с результатами
explorer "release"

echo.
echo Нажмите любую клавишу для выхода...
pause >nul
