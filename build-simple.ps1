$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-NodeJS {
    Write-Info "Downloading Node.js 20.x LTS..."
    $nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    $installerPath = "$env:TEMP\nodejs.msi"

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing
        Write-Info "Installing Node.js..."
        Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /qn /norestart" -Wait -NoNewWindow
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
        Remove-Item $installerPath -Force
        Write-Success "Node.js installed"
        return $true
    }
    catch {
        Write-Error "Failed to install Node.js: $_"
        return $false
    }
}

Clear-Host
Write-Host "Multi-Model LLM Chat - Automatic Build v2.0.0" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Administrator)) {
    Write-Info "Administrator rights required"
    Write-Info "Restarting with admin rights..."
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs
    exit
}

Set-Location $PSScriptRoot

Write-Step "[1/5] Checking Node.js..."
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js $nodeVersion found"
    }
    else {
        throw "Node.js not found"
    }
}
catch {
    Write-Info "Node.js not installed"
    if (-not (Install-NodeJS)) {
        Write-Error "Failed to install Node.js"
        Write-Info "Install manually: https://nodejs.org/"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Step "[2/5] Checking npm..."
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "npm $npmVersion found"
    }
    else {
        throw "npm not found"
    }
}
catch {
    Write-Error "npm not found"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Step "[3/5] Installing dependencies..."
Write-Info "This may take 2-5 minutes..."

try {
    npm install --loglevel=error 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed"
    }
    else {
        throw "Installation failed"
    }
}
catch {
    Write-Error "Failed to install dependencies: $_"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Step "[4/5] Building application..."
Write-Info "Compiling TypeScript and building Electron..."
Write-Info "This may take 3-7 minutes..."

try {
    npm run dist:win 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application built"
    }
    else {
        throw "Build failed"
    }
}
catch {
    Write-Error "Build failed: $_"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Step "[5/5] Checking results..."

$installerPath = "release\Multi-Model LLM Chat Setup 2.0.0.exe"
$portablePath = "release\Multi-Model LLM Chat 2.0.0.exe"

if (Test-Path $installerPath) {
    $size = (Get-Item $installerPath).Length / 1MB
    Write-Success "Installer created"
    Write-Info ("Size: {0:N2} MB" -f $size)
}
else {
    Write-Info "Installer not found"
}

if (Test-Path $portablePath) {
    $size = (Get-Item $portablePath).Length / 1MB
    Write-Success "Portable version created"
    Write-Info ("Size: {0:N2} MB" -f $size)
}
else {
    Write-Info "Portable version not found"
}

Write-Host ""
Write-Host "BUILD COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host ""
Write-Host "Files are in: release\" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Installer: Multi-Model LLM Chat Setup 2.0.0.exe" -ForegroundColor White
Write-Host "[2] Portable:  Multi-Model LLM Chat 2.0.0.exe" -ForegroundColor White
Write-Host ""

Start-Process explorer.exe -ArgumentList (Resolve-Path "release")

Write-Host ""
Read-Host "Press Enter to exit"
