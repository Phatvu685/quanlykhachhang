param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$BackupFile
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\customer-crm-backend')).Path
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
    Write-Error "Khong tim thay DATABASE_URL trong '$envPath' hoac '$exampleEnvPath'."
    exit 1
}

if (-not (Test-Path $BackupFile)) {
    Write-Error "File backup khong ton tai: $BackupFile"
    exit 1
}

$fullBackupPath = (Resolve-Path $BackupFile).Path
$hasPsql = [bool](Get-Command psql -ErrorAction SilentlyContinue)
$hasDocker = [bool](Get-Command docker -ErrorAction SilentlyContinue)

Write-Host "Restore database tu: $fullBackupPath"

if ($hasDocker) {
    $backupDir = (Split-Path $fullBackupPath -Parent) -replace '\\', '/'
    $fileName = Split-Path $fullBackupPath -Leaf
    & docker run --rm -i -v "${backupDir}:/backups" postgres:latest psql "$databaseUrl" -f "/backups/$fileName"
} elseif ($hasPsql) {
    Get-Content $fullBackupPath | & psql "$databaseUrl"
} else {
    Write-Error "psql va Docker chua co san tren may. Hay cai PostgreSQL client hoac bat Docker truoc khi chay restore."
    exit 1
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Restore that bai."
    exit $LASTEXITCODE
}

Write-Host "Restore thanh cong."
