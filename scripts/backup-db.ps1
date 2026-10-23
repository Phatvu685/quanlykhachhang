$ErrorActionPreference = 'Stop'

$projectRoot = if (Test-Path (Join-Path $PSScriptRoot '..\customer-crm-backend\.env')) {
    (Resolve-Path (Join-Path $PSScriptRoot '..\customer-crm-backend')).Path
} else {
    (Resolve-Path (Join-Path $PSScriptRoot '..\customer-crm-backend')).Path
}

$envPath = Join-Path $projectRoot '.env'
$exampleEnvPath = Join-Path $projectRoot '.env.example'

function Get-DatabaseUrl {
    param(
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        return $null
    }

    foreach ($line in Get-Content $Path) {
        if ($line -match '^\s*DATABASE_URL\s*=\s*"?(.*?)(?:"\s*)?$') {
            return $Matches[1].Trim()
        }
    }

    return $null
}

$databaseUrl = Get-DatabaseUrl -Path $envPath
if (-not $databaseUrl) {
    $databaseUrl = Get-DatabaseUrl -Path $exampleEnvPath
}

if (-not $databaseUrl) {
    Write-Error "Không tìm thấy DATABASE_URL trong '$envPath' hoặc '$exampleEnvPath'."
    exit 1
}

$backupDir = Join-Path $projectRoot 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupFileName = "crm_backup_$timestamp.sql"
$backupFile = Join-Path $backupDir $backupFileName

$hasPgDump = [bool](Get-Command pg_dump -ErrorAction SilentlyContinue)
$hasDocker = [bool](Get-Command docker -ErrorAction SilentlyContinue)

if ($hasDocker) {
    Write-Host "Backup database vào: $backupFile (sử dụng docker postgres:latest)"
    $dockerBackupDir = $backupDir -replace '\\', '/'
    & docker run --rm -v "${dockerBackupDir}:/backups" postgres:latest pg_dump $databaseUrl --clean --if-exists --format=plain --file "/backups/$backupFileName"
} elseif ($hasPgDump) {
    Write-Host "Backup database vào: $backupFile (sử dụng pg_dump local)"
    & pg_dump $databaseUrl --clean --if-exists --format=plain --file $backupFile
} else {
    Write-Error "pg_dump chưa được cài đặt và không có Docker. Hãy cài PostgreSQL client hoặc bật Docker trước khi chạy backup."
    exit 1
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Backup thất bại."
    exit $LASTEXITCODE
}

Write-Host "Backup thành công: $backupFile"
