# Corrige les fautes d'orthographe dans les noms des projets (liste etablie manuellement).
# Envoie PUT /api/projets/{id} avec uniquement le champ nom corrige (UTF-8).
# Usage: .\corriger-orthographe-projets-api.ps1 -ApiBaseUrl "..." -Email "..." -Password "..." [-DryRun]

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$Email,
    [Parameter(Mandatory = $true)]
    [string]$Password,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

# Accents en Unicode (evite probleme d'encodage du fichier .ps1 sous Windows)
$Eaigu = [char]0x00C9   # E
$Egrave = [char]0x00C8   # E
$Ocirc = [char]0x00D4    # O

# Liste id -> nom corrige (orthographe complete, construit en ASCII + accents)
# Bug corrige : AMENAGEMENT doit etre "AM" + Eaigu + "NAGEMENT" (pas "A" + Eaigu qui donnait AENAGEMENT)
$corrections = @{
    1  = "TRAVAUX D'AM" + $Eaigu + "NAGEMENT ET DE R" + $Eaigu + "HABILITATION DE L'ENA"
    2  = "AM" + $Eaigu + "NAGEMENT DE LA VOIE DE BEL AIR"
    5  = "MARCH" + $Eaigu + " MUNICIPAL D'OWENDO"
    7  = "TR" + $Eaigu + "SOR PUBLIC"
    9  = "GABOIL EXTENSION D" + $Eaigu + "P" + $Ocirc + "T P" + $Eaigu + "TROLIER"
    17 = "GABOIL EXTENSION D" + $Eaigu + "P" + $Ocirc + "T P" + $Eaigu + "TROLIER"
    18 = "CONSTRUCTION ROUTE D'ACC" + $Egrave + "S AU CET DE NKOLTANG + AVENANT"
    19 = "PROJET D'AM" + $Eaigu + "NAGEMENT DE VOIRIES DE DESSERTE CAMP DE GAULLE/JARDIN BOTANIQUE"
    21 = "TRAVAUX DE R" + $Eaigu + "HABILITATION DE L'EPCA"
    22 = "TRAVAUX PRIORITAIRES DES VOIRIES DE LIBREVILLE"
    23 = "TRAVAUX D'AM" + $Eaigu + "NAGEMENT DES VOIRIES DE DESSERTE DU QUARTIER AKEMIDJONGONI"
    24 = "EXTENSION VOIRIES AKEMIDJONGONI"
    25 = "NOUVELLES VOIES JB-CAMP DE GAULLE + AM" + $Eaigu + "NAGEMENT BORD DE MER"
    27 = "TRAVAUX DE R" + $Eaigu + "HABILITATION ET D'AM" + $Eaigu + "NAGEMENT DES VOIRIES DE KANGO"
    28 = "USTM-TRAVAUX DE R" + $Eaigu + "HABILITATION /TRAVAUX SUPPL" + $Eaigu + "MENTAIRES"
    33 = "R" + $Eaigu + "HABILITATION EXTENSION INTERNAT DU LYC" + $Eaigu + "E CHARLES"
    34 = "TRAVAUX DE R" + $Eaigu + "A" + "M" + $Eaigu + "NAGEMENT DES VOIRIES DU CINQUI" + $Egrave + "ME ARRONDISSEMENT, QUARTIER LALALA."
    36 = "AM" + $Eaigu + "NAGEMENT DU BASSIN VERSANT DE GU" + $Eaigu + "-GU" + $Eaigu + " AVAL/SECTION PRIX-IMPORT BAS GU" + $Eaigu + "-GU" + $Eaigu + "-PONT EXUTOIRE GU" + $Eaigu + "-GU" + $Eaigu
    37 = "TRAVAUX D'AM" + $Eaigu + "NAGEMENT DU CARREFOUR CHARBONNAGES"
    38 = "TRAVAUX D'URGENCE DU CTRI KANGO"
    41 = "TRAVAUX D'AM" + $Eaigu + "NAGEMENT DE LA VOIE EXPRESS OWENDO : CARREFOUR POMPIER/CARREFOUR RAZEL"
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
$token = $loginResp.accessToken
if (-not $token) { Write-Error "Pas de accessToken."; exit 1 }

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json; charset=utf-8"
    "Accept"        = "application/json"
}

$ok = 0
$err = 0
foreach ($id in ($corrections.Keys | Sort-Object)) {
    $nom = $corrections[$id].ToUpper([System.Globalization.CultureInfo]::InvariantCulture)
    $body = @{ nom = $nom } | ConvertTo-Json
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

    if ($DryRun) {
        Write-Host "  [DRY-RUN] id=$id -> $nom"
        $ok++
        continue
    }

    try {
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/api/projets/$id" -Headers $headers -Method Put -Body $bodyBytes
        $ok++
        Write-Host "  [OK] id=$id -> $nom"
    } catch {
        $err++
        Write-Host "  [ERREUR] id=$id : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
if ($DryRun) {
    Write-Host "Mode DRY-RUN : $ok correction(s) affichees. Relancez sans -DryRun pour appliquer." -ForegroundColor Cyan
} else {
    Write-Host "Termine : $ok corrige(s), $err erreur(s)." -ForegroundColor $(if ($err -gt 0) { "Red" } else { "Green" })
}
