# PowerShell script for automatic build
# Encoding: UTF-8

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Header {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   Multi-Model LLM Chat - Автоматическая сборка            ║" -ForegroundColor Cyan
    Write-Host "║   Версия 2.0.0                                             ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[X] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[i] $Message" -ForegroundColor Cyan
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-NodeJS {
    Write-Info "Скачивание Node.js 20.x LTS..."

    $nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    $installerPath = "$env:TEMP\nodejs.msi"

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing

        Write-Info "Установка Node.js (это займет ~30 секунд)..."
        Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /qn /norestart" -Wait -NoNewWindow

        # Обновление PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        Remove-Item $installerPath -Force
        Write-Success "Node.js установлен"
        return $true
    }
    catch {
        Write-Error "Ошибка установки Node.js: $_"
        return $false
    }
}

# Main script
Clear-Host
Write-Header

# Check administrator rights
if (-not (Test-Administrator)) {
    Write-Info "Требуются права администратора для установки Node.js"
    Write-Info "Перезапуск с правами администратора..."
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Set-Location $PSScriptRoot

# Step 1: Check Node.js
Write-Step "[1/5] Проверка Node.js..."
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js $nodeVersion найден"
    }
    else {
        throw "Node.js не найден"
    }
}
catch {
    Write-Info "Node.js не установлен"
    if (-not (Install-NodeJS)) {
        Write-Error "Не удалось установить Node.js"
        Write-Info "Установите вручную: https://nodejs.org/"
        Read-Host "Нажмите Enter для выхода"
        exit 1
    }
}

# Step 2: Check npm
Write-Host ""
Write-Step "[2/5] Проверка npm..."
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "npm $npmVersion найден"
    }
    else {
        throw "npm не найден"
    }
}
catch {
    Write-Error "npm не найден"
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

# Step 3: Install dependencies
Write-Host ""
Write-Step "[3/5] Установка зависимостей..."
Write-Info "Это может занять 2-5 минут..."

try {
    npm install --loglevel=error 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Зависимости установлены"
    }
    else {
        throw "Ошибка установки"
    }
}
catch {
    Write-Error "Ошибка установки зависимостей: $_"
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

# Step 4: Build application
Write-Host ""
Write-Step "[4/5] Сборка приложения..."
Write-Info "Компиляция TypeScript и сборка Electron..."
Write-Info "Это может занять 3-7 минут..."

try {
    npm run dist:win 2>&1 | ForEach-Object {
        if ($_ -match "error|failed") {
            Write-Host $_ -ForegroundColor Red
        }
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Приложение собрано"
    }
    else {
        throw "Ошибка сборки"
    }
}
catch {
    Write-Error "Ошибка сборки: $_"
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

# Step 5: Check results
Write-Host ""
Write-Step "[5/5] Проверка результата..."

$installerPath = "release\Multi-Model LLM Chat Setup 2.0.0.exe"
$portablePath = "release\Multi-Model LLM Chat 2.0.0.exe"

if (Test-Path $installerPath) {
    $size = (Get-Item $installerPath).Length / 1MB
    Write-Success "Установщик создан"
    Write-Info ("Размер: {0:N2} MB" -f $size)
}
else {
    Write-Info "Установщик не найден"
}

if (Test-Path $portablePath) {
    $size = (Get-Item $portablePath).Length / 1MB
    Write-Success "Portable версия создана"
    Write-Info ("Размер: {0:N2} MB" -f $size)
}
else {
    Write-Info "Portable версия не найдена"
}

# Success message
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   СБОРКА ЗАВЕРШЕНА УСПЕШНО!                               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Готовые файлы находятся в папке: release\" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Установщик: Multi-Model LLM Chat Setup 2.0.0.exe" -ForegroundColor White
Write-Host "[2] Portable:   Multi-Model LLM Chat 2.0.0.exe" -ForegroundColor White
Write-Host ""

# Open release folder
Start-Process explorer.exe -ArgumentList (Resolve-Path "release")

Write-Host ""
Read-Host "Нажмите Enter для выхода"
