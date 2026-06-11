# Configura secretos GitHub para todos los backends Jeff-Aporta
# Requiere: $env:CLOUDFLARE_API_TOKEN — template **Edit Cloudflare Workers** (NO FILESTORE_API_TOKEN / R2)
param(
  [string]$LanglabSettings = "..\apps\langlab\local.settings.json"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$v = (Get-Content (Join-Path $root $LanglabSettings) -Raw | ConvertFrom-Json).Values

if (-not $env:CLOUDFLARE_API_TOKEN) {
  Write-Host "Define CLOUDFLARE_API_TOKEN (Workers Edit, igual que flsjeff-back)." -ForegroundColor Yellow
  exit 1
}

$cf = $env:CLOUDFLARE_API_TOKEN
$acc = $v.FILESTORE_ACCOUNT_ID
$neon = $v.NEON_DATABASE_URL
$jwt = $v.LAB_JWT_SECRET

$repos = @(
  @{ R = "Jeff-Aporta/main-orchestrator-back"; Extra = @{} },
  @{ R = "Jeff-Aporta/system-login-back"; Extra = @{ AUTH_DATABASE_URL = $neon } },
  @{ R = "Jeff-Aporta/jagudeloe-back"; Extra = @{ ISADOC_DATABASE_URL = $neon } },
  @{ R = "Jeff-Aporta/jagudeloe-tks-back"; Extra = @{ ISADOC_DATABASE_URL = $neon } },
  @{ R = "Jeff-Aporta/iatools-back"; Extra = @{ NEON_DATABASE_URL = $neon } },
  @{ R = "Jeff-Aporta/conversations-back"; Extra = @{ NEON_DATABASE_URL = $neon } },
  @{ R = "Jeff-Aporta/flsjeff-back"; Extra = @{ NEON_DATABASE_URL = $neon } }
)

foreach ($item in $repos) {
  $cf | gh secret set CLOUDFLARE_API_TOKEN -R $item.R
  $acc | gh secret set CLOUDFLARE_ACCOUNT_ID -R $item.R
  $jwt | gh secret set LAB_JWT_SECRET -R $item.R
  foreach ($kv in $item.Extra.GetEnumerator()) {
    $kv.Value | gh secret set $kv.Key -R $item.R
  }
  Write-Host "OK $($item.R)"
}
