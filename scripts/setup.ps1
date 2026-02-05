Set-StrictMode -Version Latest

Write-Host "==> Ativando venv e instalando dependencias..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\backend"

if (!(Test-Path ".\.venv")) {
  Write-Host "ERRO: .venv nao encontrado em backend/.venv" -ForegroundColor Red
  exit 1
}

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
if (Test-Path ".\requirements-dev.txt") {
  pip install -r requirements-dev.txt
}

Write-Host "OK: Dependencias instaladas." -ForegroundColor Green
