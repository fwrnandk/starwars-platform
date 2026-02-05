Set-StrictMode -Version Latest

Set-Location "$PSScriptRoot\.."

.\backend\.venv\Scripts\Activate.ps1

$env:PYTHONPATH = (Get-Location).Path

pytest -q
