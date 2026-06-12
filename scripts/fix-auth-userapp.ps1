#Requires -Version 5.1
<#
.SYNOPSIS
  Crea BD_AUTH.AUTH_USERAPP y seed de apps si falta (Neon).

.EXAMPLE
  .\fix-auth-userapp.ps1
#>
param(
  [string]$SettingsPath = ""
)

$ErrorActionPreference = "Stop"
$appsRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

if (-not $SettingsPath) {
  $SettingsPath = Join-Path $appsRoot "langlab-azure\local.settings.json"
  if (-not (Test-Path $SettingsPath)) {
    $SettingsPath = Join-Path $appsRoot "langlab\local.settings.json"
  }
}
if (-not (Test-Path $SettingsPath)) {
  throw "No local.settings.json con NEON_DATABASE_URL en langlab-azure o langlab"
}

$settings = Get-Content $SettingsPath | ConvertFrom-Json
$neon = ($settings.Values.NEON_DATABASE_URL -replace '&channel_binding=require', '')
if (-not $neon) { throw "NEON_DATABASE_URL vacio" }

$env:AUTH_DATABASE_URL = $neon
$env:NEON_DATABASE_URL = $neon

$backend = Join-Path $appsRoot "system-login\backend"
Push-Location $backend
try {
  if (-not (Test-Path node_modules\pg)) { npm install --silent 2>$null }
  Write-Host "Aplicando BD_AUTH..." -ForegroundColor Cyan
  npm run db:apply
  Write-Host "Seed permisos..." -ForegroundColor Cyan
  npm run db:seed-permissions
  Write-Host "Verificacion..." -ForegroundColor Cyan
  node scripts/verify-schemas.mjs
} finally {
  Pop-Location
}

Write-Host "AUTH_USERAPP listo. Redeploy system-login si usas Workers en prod." -ForegroundColor Green
