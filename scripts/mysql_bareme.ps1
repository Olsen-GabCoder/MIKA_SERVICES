# Connexion MySQL - base mika_services_dev (barème)
# Usage: .\scripts\mysql_bareme.ps1
#        .\scripts\mysql_bareme.ps1 -Script docs\bareme_dump_complet_et_espaces_vides.sql
# À lancer depuis la racine du projet (c:\Projet_Mika_Services)

param(
    [string]$Script = $null   # Si fourni, exécute ce fichier SQL au lieu d'ouvrir une session
)

$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysql)) {
    $mysql = "C:\mysql-9.5.0-winx64\bin\mysql.exe"
}
if (-not (Test-Path $mysql)) {
    Write-Host "MySQL non trouvé. Vérifiez le chemin dans ce script." -ForegroundColor Red
    exit 1
}

$db = "mika_services_dev"
$user = "root"
# Mot de passe : lire depuis application-dev.yml ou demander
$pass = "olsenk2000#2000"

if ($Script) {
    $fullPath = Join-Path (Get-Location) $Script
    if (Test-Path $fullPath) {
        Get-Content $fullPath -Raw | & $mysql -u $user -p$pass $db 2>$null
    } else {
        Write-Host "Fichier introuvable: $fullPath" -ForegroundColor Red
        exit 1
    }
} else {
    & $mysql -u $user -p$pass $db
}
