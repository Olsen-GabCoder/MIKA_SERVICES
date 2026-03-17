# Affiche tous les projets depuis la BD locale avec tous leurs details.
# Usage: .\list-projets-complet-mysql.ps1 [-ExportJson "projets-bd.json"] [-Inactifs]
#   -ExportJson : exporte la liste en JSON (pour voir ce qu'on peut envoyer en prod).
#   -Inactifs   : inclure les projets actif=0 (par defaut : actif=1 uniquement).
# Connexion : localhost:3306, base mika_services_dev (identifiants modifiables en parametres).

param(
    [string]$MysqlUser = "root",
    [string]$MysqlPass = "olsenk2000#2000",
    [string]$Db = "mika_services_dev",
    [string]$ExportJson = "",
    [switch]$Inactifs
)

$ErrorActionPreference = "Stop"
$whereActif = if ($Inactifs) { "1=1" } else { "p.actif = 1" }

function NullOrVal($v) { if ($null -eq $v -or $v -eq "") { return "-" }; return $v }

# Requete : tous les champs projets + client + responsable
$query = @"
SELECT
  p.id,
  p.code_projet,
  p.numero_marche,
  p.nom,
  p.description,
  p.type,
  p.type_personnalise,
  p.statut,
  p.client_id,
  c.nom AS client_nom,
  p.source_financement,
  p.imputation_budgetaire,
  p.province,
  p.ville,
  p.quartier,
  p.adresse,
  p.latitude,
  p.longitude,
  p.superficie,
  p.condition_acces,
  p.zone_climatique,
  p.distance_depot_km,
  p.nombre_ouvriers_prevu,
  p.horaire_travail,
  p.montant_ht,
  p.montant_ttc,
  p.montant_initial,
  p.montant_revise,
  p.delai_mois,
  p.mode_suivi_mensuel,
  p.date_debut,
  p.date_fin,
  p.date_debut_reel,
  p.date_fin_reelle,
  p.avancement_global,
  p.avancement_physique_pct,
  p.avancement_financier_pct,
  p.delai_consomme_pct,
  p.besoins_materiel,
  p.besoins_humain,
  p.observations,
  p.propositions_amelioration,
  p.responsable_projet_id,
  CONCAT(u.prenom, ' ', u.nom) AS responsable_nom,
  u.email AS responsable_email,
  p.partenaire_principal,
  p.actif,
  p.created_at,
  p.updated_at,
  p.created_by,
  p.updated_by
FROM projets p
LEFT JOIN clients c ON c.id = p.client_id
LEFT JOIN users u ON u.id = p.responsable_projet_id
WHERE $whereActif
ORDER BY p.id;
"@

Write-Host "Connexion MySQL: $Db (localhost)..." -ForegroundColor Cyan
$env:MYSQL_PWD = $MysqlPass
try {
    $raw = & mysql -h localhost -P 3306 -u $MysqlUser $Db -N -e $query 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "MySQL: $raw"
        exit 1
    }
} finally {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}

if (-not $raw -or [string]::IsNullOrWhiteSpace($raw)) {
    Write-Host "Aucun projet trouve."
    exit 0
}

$lines = $raw -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
$total = $lines.Count
Write-Host "Projets trouves : $total" -ForegroundColor Green
Write-Host ""

# Parser les lignes (tab-separated) en objets
$allProjects = [System.Collections.Generic.List[object]]::new()
$colCount = 42

foreach ($line in $lines) {
    $cols = $line -split "`t", $colCount
    $allProjects.Add([PSCustomObject]@{
        id                      = $cols[0]
        code_projet             = $cols[1]
        numero_marche           = $cols[2]
        nom                     = $cols[3]
        description             = $cols[4]
        type                    = $cols[5]
        type_personnalise       = $cols[6]
        statut                  = $cols[7]
        client_id               = $cols[8]
        client_nom              = $cols[9]
        source_financement      = $cols[10]
        imputation_budgetaire   = $cols[11]
        province                = $cols[12]
        ville                   = $cols[13]
        quartier                = $cols[14]
        adresse                 = $cols[15]
        latitude                = $cols[16]
        longitude               = $cols[17]
        superficie              = $cols[18]
        condition_acces         = $cols[19]
        zone_climatique         = $cols[20]
        distance_depot_km       = $cols[21]
        nombre_ouvriers_prevu   = $cols[22]
        horaire_travail         = $cols[23]
        montant_ht              = $cols[24]
        montant_ttc             = $cols[25]
        montant_initial         = $cols[26]
        montant_revise          = $cols[27]
        delai_mois              = $cols[28]
        mode_suivi_mensuel      = $cols[29]
        date_debut              = $cols[30]
        date_fin                = $cols[31]
        date_debut_reel         = $cols[32]
        date_fin_reelle         = $cols[33]
        avancement_global       = $cols[34]
        avancement_physique_pct = $cols[35]
        avancement_financier_pct= $cols[36]
        delai_consomme_pct      = $cols[37]
        besoins_materiel        = $cols[38]
        besoins_humain          = $cols[39]
        observations            = $cols[40]
        propositions_amelioration = $cols[41]
        responsable_projet_id  = $cols[42]
        responsable_nom         = $cols[43]
        responsable_email       = $cols[44]
        partenaire_principal    = $cols[45]
        actif                   = $cols[46]
        created_at              = $cols[47]
        updated_at              = $cols[48]
        created_by              = $cols[49]
        updated_by              = $cols[50]
    })
}

# Export JSON optionnel
if ($ExportJson) {
    $allProjects | ConvertTo-Json -Depth 5 | Set-Content -Path $ExportJson -Encoding UTF8
    Write-Host "Export JSON : $ExportJson" -ForegroundColor Cyan
}

# ---------- RESUME EN CONSOLE ----------
Write-Host ""
Write-Host "========== RESUME ($total projets) ==========" -ForegroundColor Cyan
$sep = "-" * 150
Write-Host ("{0,-5} | {1,-20} | {2,-18} | {3,-45} | {4,-12} | {5,-10} | {6,-10} | {7,-14}" -f "Id", "Code projet", "N° Marché", "Nom", "Statut", "Début", "Fin", "Montant HT")
Write-Host $sep
foreach ($p in $allProjects) {
    $code = if ($p.code_projet) { $p.code_projet } else { "(vide)" }
    if ($code.Length -gt 20) { $code = $code.Substring(0, 17) + "..." }
    $num = if ($p.numero_marche) { $p.numero_marche } else { "(vide)" }
    if ($num.Length -gt 18) { $num = $num.Substring(0, 15) + "..." }
    $nom = if ($p.nom) { $p.nom } else { "" }
    if ($nom.Length -gt 45) { $nom = $nom.Substring(0, 42) + "..." }
    $statut = $p.statut
    $deb = if ($p.date_debut) { $p.date_debut } else { "" }
    $fin = if ($p.date_fin) { $p.date_fin } else { "" }
    $mt = if ($p.montant_ht) { [string]$p.montant_ht } else { "" }
    Write-Host ("{0,-5} | {1,-20} | {2,-18} | {3,-45} | {4,-12} | {5,-10} | {6,-10} | {7,-14}" -f $p.id, $code, $num, $nom, $statut, $deb, $fin, $mt)
}

# ---------- DETAIL DE CHAQUE PROJET ----------
Write-Host ""
Write-Host "========== DETAIL DE CHAQUE PROJET (BD locale) ==========" -ForegroundColor Cyan
foreach ($p in $allProjects) {
    Write-Host ""
    Write-Host ("--- Projet id={0} | code={1} ---" -f $p.id, $(if ($p.code_projet) { $p.code_projet } else { "(vide)" })) -ForegroundColor Yellow
    Write-Host "  Nom                     : $($p.nom)"
    Write-Host "  Code projet             : $(NullOrVal $p.code_projet)"
    Write-Host "  N° Marché               : $(NullOrVal $p.numero_marche)"
    Write-Host "  Statut                  : $($p.statut)"
    Write-Host "  Type                    : $($p.type)"
    Write-Host "  Type personnalise       : $(NullOrVal $p.type_personnalise)"
    $descVal = if ($p.description) { $p.description } else { "-" }; if ($descVal -ne "-" -and $descVal.Length -gt 80) { $descVal = $descVal.Substring(0, 77) + "..." }
    Write-Host "  Description             : $descVal"
    Write-Host "  Client (id/nom)         : $(NullOrVal $p.client_id) / $(NullOrVal $p.client_nom)"
    Write-Host "  Province / Ville / Quartier : $(NullOrVal $p.province) / $(NullOrVal $p.ville) / $(NullOrVal $p.quartier)"
    $adr = if ($p.adresse) { $p.adresse } else { "-" }; if ($adr -ne "-" -and $adr.Length -gt 60) { $adr = $adr.Substring(0, 57) + "..." }
    Write-Host "  Adresse                 : $adr"
    Write-Host "  Latitude / Longitude    : $(NullOrVal $p.latitude) / $(NullOrVal $p.longitude)"
    Write-Host "  Superficie              : $(NullOrVal $p.superficie)"
    Write-Host "  Condition acces         : $(NullOrVal $p.condition_acces)"
    Write-Host "  Zone climatique         : $(NullOrVal $p.zone_climatique)"
    Write-Host "  Distance depot (km)     : $(NullOrVal $p.distance_depot_km)"
    Write-Host "  Nombre ouvriers prevu   : $(NullOrVal $p.nombre_ouvriers_prevu)"
    Write-Host "  Horaire travail         : $(NullOrVal $p.horaire_travail)"
    Write-Host "  Date debut / fin        : $(NullOrVal $p.date_debut) / $(NullOrVal $p.date_fin)"
    Write-Host "  Date debut reel / fin r.: $(NullOrVal $p.date_debut_reel) / $(NullOrVal $p.date_fin_reelle)"
    Write-Host "  Montant HT / TTC        : $(NullOrVal $p.montant_ht) / $(NullOrVal $p.montant_ttc)"
    Write-Host "  Montant initial / revise: $(NullOrVal $p.montant_initial) / $(NullOrVal $p.montant_revise)"
    Write-Host "  Delai (mois)            : $(NullOrVal $p.delai_mois)"
    Write-Host "  Mode suivi mensuel      : $(NullOrVal $p.mode_suivi_mensuel)"
    Write-Host "  Avancement global       : $($p.avancement_global)"
    Write-Host "  Av. physique / fin. / delai % : $(NullOrVal $p.avancement_physique_pct) / $(NullOrVal $p.avancement_financier_pct) / $(NullOrVal $p.delai_consomme_pct)"
    Write-Host "  Source financement      : $(NullOrVal $p.source_financement)"
    Write-Host "  Imputation budgetaire   : $(NullOrVal $p.imputation_budgetaire)"
    Write-Host "  Responsable (id/nom)    : $(NullOrVal $p.responsable_projet_id) / $(NullOrVal $p.responsable_nom)"
    Write-Host "  Responsable email      : $(NullOrVal $p.responsable_email)"
    Write-Host "  Partenaire principal    : $(NullOrVal $p.partenaire_principal)"
    Write-Host "  Actif                   : $($p.actif)"
    Write-Host "  Created_at / Updated_at : $(NullOrVal $p.created_at) / $(NullOrVal $p.updated_at)"
    if ($p.observations) { $o = $p.observations; if ($o.Length -gt 100) { $o = $o.Substring(0, 97) + "..." }; Write-Host "  Observations             : $o" }
    if ($p.besoins_materiel) { $b = $p.besoins_materiel; if ($b.Length -gt 80) { $b = $b.Substring(0, 77) + "..." }; Write-Host "  Besoins materiel         : $b" }
    if ($p.besoins_humain) { $b = $p.besoins_humain; if ($b.Length -gt 80) { $b = $b.Substring(0, 77) + "..." }; Write-Host "  Besoins humain           : $b" }
    if ($p.propositions_amelioration) { $a = $p.propositions_amelioration; if ($a.Length -gt 80) { $a = $a.Substring(0, 77) + "..." }; Write-Host "  Propositions amelioration: $a" }
}

Write-Host ""
Write-Host "Fin de la liste ($total projets)." -ForegroundColor Green
</think>
Vérifiant le nombre exact de colonnes et corrigeant le script.
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace