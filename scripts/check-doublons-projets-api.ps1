# Verifie parmi les projets sur l'API (Render) s'il existe des doublons
# Criteres : meme numero de marche (apres normalisation) ou meme nom
# Usage: .\check-doublons-projets-api.ps1 -ApiBaseUrl "https://..." -Email "admin@..." -Password "..."

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$Email,
    [Parameter(Mandatory = $true)]
    [string]$Password,
    [int]$PageSize = 200
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

function Normalize-NumeroMarche($v) {
    if ($null -eq $v) { return [string]::Empty }
    $s = [string]$v
    $s = $s -replace 'N°', 'No '
    $s = $s -replace 'N\?', 'No '
    $s = $s.Trim()
    return $s
}

function Normalize-Nom($v) {
    if ($null -eq $v) { return [string]::Empty }
    $s = [string]$v
    $s = $s.Trim()
    return $s
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

# Recuperer tous les projets (pagination)
$all = [System.Collections.Generic.List[object]]::new()
$page = 0
do {
    $uri = "$ApiBaseUrl/api/projets?page=$page&size=$PageSize"
    try {
        $resp = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    } catch {
        Write-Error "Erreur GET $uri : $($_.Exception.Message)"
        exit 1
    }
    $content = $resp.content
    if (-not $content -or $content.Count -eq 0) { break }
    foreach ($p in $content) {
        $all.Add($p)
    }
    $page++
    Write-Host "  Page $page : $($content.Count) projets (total cumule: $($all.Count))"
} while ($content.Count -eq $PageSize)

$total = $all.Count
Write-Host "Total projets sur l'API : $total"

if ($total -eq 0) {
    Write-Host "Aucun projet. Rien a verifier."
    exit 0
}

# Doublons par numero de marche (normalise)
$byNumero = @{}
foreach ($p in $all) {
    $num = Normalize-NumeroMarche $p.numeroMarche
    if (-not $num) { $num = "(vide)" }
    if (-not $byNumero[$num]) { $byNumero[$num] = [System.Collections.Generic.List[object]]::new() }
    $byNumero[$num].Add($p)
}

$doublonsNumero = $byNumero.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }
# Doublons par nom (normalise)
$byNom = @{}
foreach ($p in $all) {
    $nom = Normalize-Nom $p.nom
    if (-not $byNom[$nom]) { $byNom[$nom] = [System.Collections.Generic.List[object]]::new() }
    $byNom[$nom].Add($p)
}
$doublonsNom = $byNom.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }

# Rapport
$hasDoublons = $false
if ($doublonsNumero) {
    $hasDoublons = $true
    Write-Host ""
    Write-Host "=== Doublons par NUMERO DE MARCHE ===" -ForegroundColor Yellow
    foreach ($entry in $doublonsNumero) {
        $num = $entry.Key
        $list = $entry.Value
        Write-Host "  Numero: '$num' -> $($list.Count) projet(s):"
        foreach ($proj in $list) {
            Write-Host "    id=$($proj.id) | $($proj.nom)"
        }
    }
}
if ($doublonsNom) {
    $hasDoublons = $true
    Write-Host ""
    Write-Host "=== Doublons par NOM (intitule) ===" -ForegroundColor Yellow
    foreach ($entry in $doublonsNom) {
        $nom = $entry.Key
        $list = $entry.Value
        Write-Host "  Nom: '$nom' -> $($list.Count) projet(s):"
        foreach ($proj in $list) {
            Write-Host "    id=$($proj.id) | numeroMarche=$($proj.numeroMarche)"
        }
    }
}

if (-not $hasDoublons) {
    Write-Host ""
    Write-Host "Aucun doublon detecte (ni par numero de marche, ni par nom)." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Resume: $($doublonsNumero.Count) numero(s) de marche en doublon, $($doublonsNom.Count) nom(s) en doublon." -ForegroundColor Yellow
exit 1
