# Supprime les doublons par NOM : garde un seul projet par intitule (le plus petit id), supprime les autres.
# Par defaut : mode -DryRun (affiche ce qui serait supprime sans rien supprimer).
# Pour executer : -Execute
# Usage: .\remove-doublons-projets-api.ps1 -ApiBaseUrl "..." -Email "..." -Password "..." [-DryRun] [-Execute]

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$Email,
    [Parameter(Mandatory = $true)]
    [string]$Password,
    [int]$PageSize = 200,
    [switch]$DryRun = $true,
    [switch]$Execute = $false
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

function Normalize-Nom($v) {
    if ($null -eq $v) { return [string]::Empty }
    ([string]$v).Trim()
}

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

# Recuperer tous les projets
$all = [System.Collections.Generic.List[object]]::new()
$page = 0
do {
    $uri = "$ApiBaseUrl/api/projets?page=$page&size=$PageSize"
    $resp = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    $content = $resp.content
    if (-not $content -or $content.Count -eq 0) { break }
    foreach ($p in $content) { $all.Add($p) }
    $page++
} while ($content.Count -eq $PageSize)

# Grouper par nom normalise
$byNom = @{}
foreach ($p in $all) {
    $nom = Normalize-Nom $p.nom
    if (-not $byNom[$nom]) { $byNom[$nom] = [System.Collections.Generic.List[object]]::new() }
    $byNom[$nom].Add($p)
}

# Pour chaque groupe avec doublons : garder le plus petit id, marquer les autres pour suppression
$toDelete = [System.Collections.Generic.List[object]]::new()
foreach ($entry in $byNom.GetEnumerator()) {
    $list = $entry.Value
    if ($list.Count -le 1) { continue }
    $sorted = $list | Sort-Object { [long]$_.id }
    $keep = $sorted[0]
    for ($i = 1; $i -lt $sorted.Count; $i++) {
        $toDelete.Add($sorted[$i])
    }
}

if ($toDelete.Count -eq 0) {
    Write-Host "Aucun doublon a supprimer (un seul projet par nom)."
    exit 0
}

Write-Host ""
Write-Host "Projets en doublon a supprimer (on garde le plus ancien id par nom) : $($toDelete.Count)" -ForegroundColor Yellow
foreach ($p in $toDelete) {
    Write-Host "  id=$($p.id) | $($p.nom)"
}

if ($DryRun -and -not $Execute) {
    Write-Host ""
    Write-Host "Mode DRY-RUN : aucune suppression effectuee. Pour supprimer pour de vrai, relancez avec -Execute (et sans -DryRun si besoin)." -ForegroundColor Cyan
    exit 0
}

if (-not $Execute) {
    Write-Host "Ajoutez -Execute pour confirmer la suppression."
    exit 0
}

Write-Host ""
$ok = 0
$err = 0
foreach ($p in $toDelete) {
    try {
        Invoke-RestMethod -Uri "$ApiBaseUrl/api/projets/$($p.id)" -Headers $headers -Method Delete
        $ok++
        Write-Host "  [OK] Supprime id=$($p.id) | $($p.nom)"
    } catch {
        $err++
        Write-Host "  [ERREUR] id=$($p.id) : $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "Termine : $ok supprimes, $err erreur(s)." -ForegroundColor $(if ($err -gt 0) { "Red" } else { "Green" })
