$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '..\backend\.env'
$sqlPath = Join-Path $PSScriptRoot '_bareme_db_analysis_full.sql'
$mysql = 'C:\mysql-9.5.0-winx64\bin\mysql.exe'

foreach ($line in Get-Content $envPath) {
    if ($line.StartsWith('DATABASE_PASSWORD=')) {
        $env:MYSQL_PWD = $line.Substring('DATABASE_PASSWORD='.Length)
        break
    }
}
if (-not $env:MYSQL_PWD) { throw 'DATABASE_PASSWORD not found in .env' }

Get-Content $sqlPath -Raw | & $mysql -u root -h 127.0.0.1 -P 3306 mika_services_dev -t
