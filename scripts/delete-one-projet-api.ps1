# Supprime un seul projet par son ID (ex. doublon GABOIL id=9).
# Usage: .\delete-one-projet-api.ps1 -ApiBaseUrl "..." -Email "..." -Password "..." -ProjectId 9

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$Email,
    [Parameter(Mandatory = $true)]
    [string]$Password,
    [Parameter(Mandatory = $true)]
    [int]$ProjectId
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

Write-Host "Connexion..."
$loginBody = @{ email = $Email; password = $Password; rememberMe = $false } | ConvertTo-Json
try {
    $loginResp = Invoke-RestMethod -Uri "$ApiBaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json; charset=utf-8"
} catch {
    Write-Error "Erreur login: $($_.Exception.Message)"
    exit 1
}
$token = $loginResp.accessToken
if (-not $token) { Write-Error "Pas de accessToken."; exit 1 }

$headers = @{ "Authorization" = "Bearer $token"; "Accept" = "application/json" }

Write-Host "Suppression du projet id=$ProjectId..."
try {
    Invoke-RestMethod -Uri "$ApiBaseUrl/api/projets/$ProjectId" -Headers $headers -Method Delete
    Write-Host "Projet id=$ProjectId supprime." -ForegroundColor Green
} catch {
    Write-Error "Erreur: $($_.Exception.Message)"
    exit 1
}
