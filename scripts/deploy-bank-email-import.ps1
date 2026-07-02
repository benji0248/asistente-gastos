# Deploy bank-email-import Edge Function to Supabase
# Usage:
#   $env:SUPABASE_ACCESS_TOKEN="sbp_..." ; .\scripts\deploy-bank-email-import.ps1
# Or paste token when prompted.

param(
  [string]$ProjectRef = "qpacnsgzxnaxfoylbpuq"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) {
  $token = Read-Host "Supabase Access Token (dashboard Account Access Tokens)"
}

$secretFile = Join-Path $PWD ".env.supabase.local"
if (-not (Test-Path $secretFile)) {
  Write-Error "Missing .env.supabase.local - generate secret first."
}

$webhookSecret = $null
Get-Content $secretFile | ForEach-Object {
  if ($_ -match '^BANK_IMPORT_WEBHOOK_SECRET=(.+)$') {
    $webhookSecret = $matches[1].Trim()
  }
}

if (-not $webhookSecret) {
  Write-Error "BANK_IMPORT_WEBHOOK_SECRET not found in .env.supabase.local"
}

Write-Host "Logging in to Supabase CLI..."
npx supabase login --token $token

Write-Host "Setting BANK_IMPORT_WEBHOOK_SECRET..."
npx supabase secrets set "BANK_IMPORT_WEBHOOK_SECRET=$webhookSecret" --project-ref $ProjectRef

Write-Host "Deploying bank-email-import..."
npx supabase functions deploy bank-email-import --project-ref $ProjectRef

Write-Host ""
Write-Host "Done. Edge Function URL:"
Write-Host "https://$ProjectRef.supabase.co/functions/v1/bank-email-import"
Write-Host ""
Write-Host "Use BANK_IMPORT_WEBHOOK_SECRET from .env.supabase.local in Apps Script (WEBHOOK_SECRET)."
