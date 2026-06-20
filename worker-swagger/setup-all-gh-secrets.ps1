# Configura secretos GitHub para todos los backends Jeff-Aporta
# Requiere: $env:CLOUDFLARE_API_TOKEN — template **Edit Cloudflare Workers** (NO FILESTORE_API_TOKEN / R2)
param(
  [string]$AppsSettings = ""
)

$ErrorActionPreference = "Stop"
$appsRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
if (-not $AppsSettings) {
  $AppsSettings = Join-Path $appsRoot "local.settings.json"
}
$v = (Get-Content $AppsSettings -Raw | ConvertFrom-Json).Values

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
  @{ R = "Jeff-Aporta/flsjeff-back"; Extra = @{ NEON_DATABASE_URL = $neon } },
  @{ R = "Jeff-Aporta/cf-ai-back"; Extra = @{} },
  @{ R = "Jeff-Aporta/scrum-back"; Extra = @{ SCRUM_DATABASE_URL = $neon; NEON_DATABASE_URL = $neon } },
  @{ R = "Jeff-Aporta/tree-msgs-back"; Extra = @{ TREE_MSGS_DATABASE_URL = $neon; NEON_DATABASE_URL = $neon } }
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
