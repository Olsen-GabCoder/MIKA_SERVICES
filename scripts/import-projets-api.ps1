# Import de projets en masse vers l'API MIKA Services (base vide : sans client ni responsable)
# Envoie uniquement : intitulé (nom), numéro de marché, types, statut, description, dates, montants, province, ville.
# Usage: .\import-projets-api.ps1 -CsvPath ".\scripts\projets-export.csv" -ApiBaseUrl "https://..." -Email "admin@..." -Password "..."

param(
    [Parameter(Mandatory = $true)]
    [string]$CsvPath,
    [Parameter(Mandatory = $true)]
    [string]$ApiBaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$Email,
    [Parameter(Mandatory = $true)]
    [string]$Password
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

# Valeurs enum valides (API)
$StatutsValides = @('EN_ATTENTE','PLANIFIE','EN_COURS','SUSPENDU','TERMINE','ABANDONNE','RECEPTION_PROVISOIRE','RECEPTION_DEFINITIVE')
$TypesValides   = @('VOIRIE','ROUTE','CHAUSSEE','PONT','OUVRAGE_ART','BATIMENT','ASSAINISSEMENT','TERRASSEMENT','MIXTE','GENIE_CIVIL','REHABILITATION','AMENAGEMENT','AUTRE')

function ToNull($v) {
    if ($null -eq $v) { return $null }
    $s = [string]$v
    if ([string]::IsNullOrWhiteSpace($s) -or $s -eq 'NULL') { return $null }
    return $s.Trim()
}

function ToIsoDate($v) {
    $s = ToNull $v
    if (-not $s) { return $null }
    if ($s -match '^\d{4}-\d{2}-\d{2}$') { return $s }
    return $null
}

# Normalise le numero de marche pour eviter 400 (caractere ° ou ? mal supporte par l'API)
function Normalize-NumeroMarche($v) {
    $s = ToNull $v
    if (-not $s) { return $null }
    $s = $s -replace 'N°', 'No '
    $s = $s -replace 'N\?', 'No '
    $s = $s.Trim()
    if ($s.Length -gt 100) { $s = $s.Substring(0, 100) }
    return $s
}

# Supprime caracteres de controle et caracteres problematiques pour JSON/API
function Sanitize-Text($v) {
    if ($null -eq $v) { return $null }
    $s = [string]$v
    $s = $s -replace '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', ''
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
    Write-Error "Le compte a la 2FA activee. Desactivez-la temporairement pour l'import."
    exit 1
}
$token = $loginResp.accessToken
if (-not $token) { Write-Error "Pas de accessToken."; exit 1 }

Write-Host "Connecte. Import SANS clientId et sans responsableProjetId (base vide)."
$rows = Import-Csv -Path $CsvPath -Encoding UTF8
$total = $rows.Count
$created = 0
$errors = 0

foreach ($row in $rows) {
    $nom = Sanitize-Text ((ToNull $row.nom) -replace '\s+', ' ')
    if ([string]::IsNullOrWhiteSpace($nom)) {
        Write-Host "  [IGNORE] Ligne sans intitule (nom), skip."
        continue
    }
    if ($nom.Length -gt 300) { $nom = $nom.Substring(0, 300) }

    $numeroMarche = Normalize-NumeroMarche $row.numeroMarche

    $typesStr = ToNull $row.types
    if ([string]::IsNullOrWhiteSpace($typesStr)) { $typesStr = "AUTRE" }
    $types = ($typesStr -split ',').Trim() | Where-Object { $_ -in $TypesValides }
    if (-not $types -or $types.Count -eq 0) { $types = @('AUTRE') }

    $statutVal = ToNull $row.statut
    if (-not $statutVal -or $statutVal -notin $StatutsValides) { $statutVal = "EN_ATTENTE" }

    $dateDebut = ToIsoDate $row.dateDebut
    $dateFin   = ToIsoDate $row.dateFin
    $desc      = Sanitize-Text (ToNull $row.description)
    if ($desc -and $desc.Length -gt 5000) { $desc = $desc.Substring(0, 5000) }

    $montantHT = $null; $montantTTC = $null
    $m1 = ToNull $row.montantHT;  if ($m1 -and [decimal]::TryParse($m1, [ref]$null)) { $montantHT = [decimal]$m1 }
    $m2 = ToNull $row.montantTTC; if ($m2 -and [decimal]::TryParse($m2, [ref]$null)) { $montantTTC = [decimal]$m2 }
    $province  = ToNull $row.province
    $ville     = ToNull $row.ville
    if ($province -and $province.Length -gt 100) { $province = $province.Substring(0, 100) }
    if ($ville -and $ville.Length -gt 100) { $ville = $ville.Substring(0, 100) }

    # Corps : uniquement champs possibles sans clients/utilisateurs en base (pas de clientId, pas de responsableProjetId)
    $bodyObj = @{
        nom          = $nom
        types        = @($types)
        statut       = $statutVal
        numeroMarche = $numeroMarche
        description  = $desc
        dateDebut    = $dateDebut
        dateFin      = $dateFin
        montantHT    = $montantHT
        montantTTC   = $montantTTC
        province     = $province
        ville        = $ville
    }
    $body = $bodyObj | ConvertTo-Json

    # Envoyer le corps en UTF-8 pour eviter "Invalid UTF-8" cote API (PowerShell envoie en encodage systeme sinon)
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    try {
        $wr = Invoke-WebRequest -Uri "$ApiBaseUrl/api/projets" -Method Post -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type"  = "application/json; charset=utf-8"
        } -Body $bodyBytes -UseBasicParsing
        $resp = $wr.Content | ConvertFrom-Json
        $created++
        Write-Host "  [OK] $created/$total - $nom (id: $($resp.id))"
    } catch {
        $errors++
        $bodyErr = $null
        if ($_.Exception.Response) {
            try {
                $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $bodyErr = $sr.ReadToEnd()
                $sr.Dispose()
            } catch { }
        }
        if ($bodyErr) { Write-Host "  [ERREUR] $nom - Reponse API: $bodyErr" } else { Write-Host "  [ERREUR] $nom - $($_.Exception.Message)" }
    }
}

Write-Host ""
Write-Host "Termine. Crees: $created | Erreurs: $errors"
