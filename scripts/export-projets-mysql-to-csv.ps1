# Export des projets actifs depuis MySQL local vers un CSV pour import API
# Usage: .\export-projets-mysql-to-csv.ps1 [-OutputPath "projets-export.csv"]

param(
    [string]$OutputPath = "projets-export.csv",
    [string]$MysqlUser = "root",
    [string]$MysqlPass = "olsenk2000#2000",
    [string]$Db = "mika_services_dev"
)

$query = @"
SELECT
  p.nom,
  COALESCE(p.description, ''),
  COALESCE((SELECT GROUP_CONCAT(pt.type_value) FROM projet_types pt WHERE pt.projet_id = p.id), p.type),
  p.statut,
  COALESCE(p.numero_marche, ''),
  IFNULL(p.client_id, ''),
  p.date_debut,
  p.date_fin,
  IFNULL(p.montant_ht, ''),
  IFNULL(p.montant_ttc, ''),
  COALESCE(p.province, ''),
  COALESCE(p.ville, ''),
  IFNULL(p.responsable_projet_id, '')
FROM projets p
WHERE p.actif = 1
ORDER BY p.id;
"@

function Escape-CsvField($v) {
    if ($null -eq $v) { return '""' }
    $s = [string]$v
    if ($s -match '["\r\n,]') { return '"' + ($s -replace '"', '""') + '"' }
    return $s
}

$header = "nom,description,types,statut,numeroMarche,clientId,dateDebut,dateFin,montantHT,montantTTC,province,ville,responsableProjetId"
$rows = @()
$rows += $header

# Eviter que # dans le mot de passe soit interprete par PowerShell : utiliser MYSQL_PWD
$env:MYSQL_PWD = $MysqlPass
try {
    $raw = & mysql -h localhost -P 3306 -u $MysqlUser $Db -N -e $query 2>$null
} finally {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}
if (-not $raw) {
    Write-Error "Aucune donnee ou erreur MySQL. Verifiez identifiants et base $Db."
    exit 1
}

foreach ($line in ($raw -split "`n")) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $cols = $line -split "`t", -1
    $nom      = Escape-CsvField($cols[0])
    $desc     = Escape-CsvField($cols[1])
    $types    = Escape-CsvField($cols[2])
    $statut   = Escape-CsvField($cols[3])
    $numMarche= Escape-CsvField($cols[4])
    $clientId = Escape-CsvField($cols[5])
    $dateDebut= Escape-CsvField($cols[6])
    $dateFin  = Escape-CsvField($cols[7])
    $montantHT= Escape-CsvField($cols[8])
    $montantTTC=Escape-CsvField($cols[9])
    $province = Escape-CsvField($cols[10])
    $ville    = Escape-CsvField($cols[11])
    $respId   = Escape-CsvField($cols[12])
    $rows += "$nom,$desc,$types,$statut,$numMarche,$clientId,$dateDebut,$dateFin,$montantHT,$montantTTC,$province,$ville,$respId"
}

$outDir = Split-Path -Parent $OutputPath
if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
$rows | Out-File -FilePath $OutputPath -Encoding UTF8
Write-Host "Export OK: $($rows.Count - 1) projets -> $OutputPath"
