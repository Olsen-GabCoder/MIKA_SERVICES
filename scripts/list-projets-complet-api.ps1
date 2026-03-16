# Affiche tous les projets restants sur l'API avec toutes leurs informations.
# Option : -ExportJson "projets.json" pour sauvegarder le detail en JSON.
# Usage: .\list-projets-complet-api.ps1 -ApiBaseUrl "..." -Email "..." -Password "..." [-ExportJson "projets.json"]

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$Email,
    [Parameter(Mandatory = $true)]
    [string]$Password,
    [int]$PageSize = 200,
    [string]$ExportJson = ""
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

# Connexion
Write-Host "Connexion avec $Email..."
$loginBody = @{ email = $Email; password = $Password; rememberMe = $false } | ConvertTo-Json
try {
    $loginResp = Invoke-RestMethod -Uri "$ApiBaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json; charset=utf-8"
} catch {
    Write-Error "Erreur login: $($_.Exception.Message)"
    exit 1
}
if ($loginResp.requires2FA) {
    Write-Error "Le compte a la 2FA activee. Desactivez-la temporairement."
    exit 1
}
$token = $loginResp.accessToken
if (-not $token) { Write-Error "Pas de accessToken."; exit 1 }

$headers = @{
    "Authorization" = "Bearer $token"
    "Accept"        = "application/json"
}

# Liste des ids
$allIds = [System.Collections.Generic.List[long]]::new()
$page = 0
do {
    $uri = "$ApiBaseUrl/api/projets?page=$page&size=$PageSize"
    $resp = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    $content = $resp.content
    if (-not $content -or $content.Count -eq 0) { break }
    foreach ($p in $content) { $allIds.Add([long]$p.id) }
    $page++
} while ($content.Count -eq $PageSize)

$total = $allIds.Count
Write-Host "Projets trouves : $total"
if ($total -eq 0) {
    Write-Host "Aucun projet."
    exit 0
}

# Recuperer le detail de chaque projet
$fullList = [System.Collections.Generic.List[object]]::new()
$i = 0
foreach ($id in $allIds) {
    $i++
    Write-Host "  Chargement $i/$total (id=$id)..."
    try {
        $p = Invoke-RestMethod -Uri "$ApiBaseUrl/api/projets/$id" -Headers $headers -Method Get
        $fullList.Add($p)
    } catch {
        Write-Host "    [ERREUR] $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Export JSON optionnel
if ($ExportJson) {
    $fullList | ConvertTo-Json -Depth 10 | Set-Content -Path $ExportJson -Encoding UTF8
    Write-Host "Export JSON : $ExportJson"
}

# Tableau resume en console
Write-Host ""
Write-Host "========== RESUME ($total projets) ==========" -ForegroundColor Cyan
$sep = "-" * 140
Write-Host ("{0,-6} | {1,-18} | {2,-45} | {3,-12} | {4,-10} | {5,-10} | {6,-12}" -f "Id", "N° Marché", "Nom", "Statut", "Début", "Fin", "Montant HT")
Write-Host $sep
foreach ($p in $fullList) {
    $num = if ($p.numeroMarche) { $p.numeroMarche } else { "(vide)" }
    if ($num.Length -gt 18) { $num = $num.Substring(0, 15) + "..." }
    $nom = $p.nom
    if ($nom.Length -gt 45) { $nom = $nom.Substring(0, 42) + "..." }
    $statut = $p.statut
    $deb = if ($p.dateDebut) { $p.dateDebut } else { "" }
    $fin = if ($p.dateFin) { $p.dateFin } else { "" }
    $mt = if ($p.montantHT -ne $null) { [string]$p.montantHT } else { "" }
    Write-Host ("{0,-6} | {1,-18} | {2,-45} | {3,-12} | {4,-10} | {5,-10} | {6,-12}" -f $p.id, $num, $nom, $statut, $deb, $fin, $mt)
}

# Detail complet de chaque projet
Write-Host ""
Write-Host "========== DETAIL DE CHAQUE PROJET ==========" -ForegroundColor Cyan
foreach ($p in $fullList) {
    Write-Host ""
    Write-Host ("--- Projet id={0} ---" -f $p.id) -ForegroundColor Yellow
    Write-Host "  Nom              : $($p.nom)"
    Write-Host "  N° Marché        : $(if ($p.numeroMarche) { $p.numeroMarche } else { '(vide)' })"
    Write-Host "  Statut           : $($p.statut)"
    Write-Host "  Type (principal) : $($p.type)"
    Write-Host "  Types            : $(if ($p.types) { $p.types -join ', ' } else { '-' })"
    Write-Host "  Type personnalisé: $(if ($p.typePersonnalise) { $p.typePersonnalise } else { '-' })"
    Write-Host "  Description      : $(if ($p.description) { $p.description.Substring(0, [Math]::Min(80, $p.description.Length)) + $(if ($p.description.Length -gt 80) { '...' } else { '' }) } else { '-' })"
    Write-Host "  Client           : $(if ($p.client) { $p.client.nom } else { '-' })"
    Write-Host "  Province         : $(if ($p.province) { $p.province } else { '-' })"
    Write-Host "  Ville            : $(if ($p.ville) { $p.ville } else { '-' })"
    Write-Host "  Quartier         : $(if ($p.quartier) { $p.quartier } else { '-' })"
    Write-Host "  Date début       : $(if ($p.dateDebut) { $p.dateDebut } else { '-' })"
    Write-Host "  Date fin         : $(if ($p.dateFin) { $p.dateFin } else { '-' })"
    Write-Host "  Date début réelle: $(if ($p.dateDebutReel) { $p.dateDebutReel } else { '-' })"
    Write-Host "  Date fin réelle  : $(if ($p.dateFinReelle) { $p.dateFinReelle } else { '-' })"
    Write-Host "  Montant HT       : $(if ($p.montantHT -ne $null) { $p.montantHT } else { '-' })"
    Write-Host "  Montant TTC      : $(if ($p.montantTTC -ne $null) { $p.montantTTC } else { '-' })"
    Write-Host "  Montant initial  : $(if ($p.montantInitial -ne $null) { $p.montantInitial } else { '-' })"
    Write-Host "  Montant révisé   : $(if ($p.montantRevise -ne $null) { $p.montantRevise } else { '-' })"
    Write-Host "  Délai (mois)     : $(if ($p.delaiMois -ne $null) { $p.delaiMois } else { '-' })"
    Write-Host "  Avancement global: $($p.avancementGlobal)"
    Write-Host "  Responsable      : $(if ($p.responsableProjet) { "$($p.responsableProjet.prenom) $($p.responsableProjet.nom) ($($p.responsableProjet.email))" } else { '-' })"
    Write-Host "  Partenaire princ.: $(if ($p.partenairePrincipal) { $p.partenairePrincipal } else { '-' })"
    Write-Host "  Source financement: $(if ($p.sourceFinancement) { $p.sourceFinancement } else { '-' })"
    Write-Host "  Actif            : $($p.actif)"
    Write-Host "  Sous-projets     : $($p.nombreSousProjets)"
    Write-Host "  Points bloquants : $($p.nombrePointsBloquantsOuverts)"
    if ($p.observations) { Write-Host "  Observations     : $($p.observations)" }
    if ($p.besoinsMateriel) { Write-Host "  Besoins matériel : $($p.besoinsMateriel)" }
    if ($p.besoinsHumain) { Write-Host "  Besoins humain   : $($p.besoinsHumain)" }
    Write-Host "  Créé le          : $(if ($p.createdAt) { $p.createdAt } else { '-' })"
    Write-Host "  Modifié le       : $(if ($p.updatedAt) { $p.updatedAt } else { '-' })"
}

Write-Host ""
Write-Host "Fin de la liste ($total projets)." -ForegroundColor Green
