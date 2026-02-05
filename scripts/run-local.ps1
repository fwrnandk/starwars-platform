Set-StrictMode -Version Latest

Set-Location "$PSScriptRoot\..\backend"

.\.venv\Scripts\Activate.ps1

$env:JWT_SECRET="local-chave-super-forte-com-mais-de-32-caracteres-123!123!123!"

functions-framework --target entrypoint --signature-type http --port 8080 --debug
