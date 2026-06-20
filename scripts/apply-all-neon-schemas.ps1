# Aplica todos los esquemas Jeff-Aporta en Neon (lee URL desde Personal/apps/local.settings.json).
param(
  [switch]$Migrate,
  [switch]$SkipAuthMigrate
)

$ErrorActionPreference = "Stop"
$appsRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$settingsPath = Join-Path $appsRoot "local.settings.json"
if (-not (Test-Path $settingsPath)) { throw "No se encontro local.settings.json en $appsRoot" }

$settings = Get-Content $settingsPath | ConvertFrom-Json
$neon = ($settings.Values.NEON_DATABASE_URL -replace '&channel_binding=require', '')
if (-not $neon) { throw "NEON_DATABASE_URL vacío en local.settings.json" }

$env:NEON_DATABASE_URL = $neon
$env:AUTH_DATABASE_URL = $neon
$env:SOURCE_DATABASE_URL = $neon
$env:LANGLAB_DATABASE_URL = $neon
$env:ISADOC_DATABASE_URL = $neon

function Invoke-DbApply($app, $extra = @{}) {
  $dir = Join-Path $appsRoot $app "backend"
  Write-Host "`n=== $app ===" -ForegroundColor Cyan
  Push-Location $dir
  try {
    foreach ($k in $extra.Keys) { Set-Item -Path "env:$k" -Value $extra[$k] }
    if (-not (Test-Path node_modules\pg)) { npm install --silent 2>$null }
    npm run db:apply
  } finally { Pop-Location }
}

Invoke-DbApply "system-login"
Invoke-DbApply "flsjeff"
Invoke-DbApply "iatools"
Invoke-DbApply "conversations"

Write-Host "`n=== jagudeloe tk_* ===" -ForegroundColor Cyan
Push-Location (Join-Path $appsRoot "jagudeloe\backend")
try { node scripts/apply-tk-schema.mjs } finally { Pop-Location }

Write-Host "`n=== devops BD_LANGLAB ===" -ForegroundColor Cyan
Push-Location (Join-Path $appsRoot "scripts")
try {
  if (-not (Test-Path node_modules\pg)) { npm install --silent 2>$null }
  npm run db:apply-devops
  npm run db:seed-devops
} finally { Pop-Location }

if ($Migrate -and -not $SkipAuthMigrate) {
  Write-Host "`n=== system-login migrate + seed ===" -ForegroundColor Cyan
  Push-Location (Join-Path $appsRoot "system-login\backend")
  try {
    npm run db:migrate
    npm run db:seed-permissions
  } finally { Pop-Location }
}

Write-Host "`n=== verificación ===" -ForegroundColor Cyan
Push-Location (Join-Path $appsRoot "system-login\backend")
try { node scripts/verify-schemas.mjs } finally { Pop-Location }

Write-Host "`nListo." -ForegroundColor Green
