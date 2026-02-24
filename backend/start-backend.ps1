# ============================================
# Script de Demarrage Backend - MIKA SERVICES
# ============================================
# Ce script charge les variables d'environnement depuis .env
# et demarre l'application Spring Boot
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MIKA SERVICES - Demarrage Backend" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verifier que le fichier .env existe
if (-Not (Test-Path ".env")) {
    Write-Host "ERREUR: Le fichier .env n'existe pas !" -ForegroundColor Red
    Write-Host "Creez le fichier .env a la racine du dossier backend." -ForegroundColor Yellow
    exit 1
}

Write-Host "Chargement des variables d'environnement depuis .env..." -ForegroundColor Green
Write-Host ""

# Charger les variables d'environnement depuis .env
Get-Content ".env" | ForEach-Object {

    $line = $_.Trim()

    # Ignorer lignes vides ou commentaires
    if ($line -eq "" -or $line.StartsWith("#")) {
        return
    }

    # Extraire KEY=VALUE
    if ($line -match "^(.*?)=(.*)$") {

        $key = $matches[1].Trim()
        $value = $matches[2].Trim()

        # Supprimer guillemets simples ou doubles
        if (
        ($value.StartsWith('"') -and $value.EndsWith('"')) -or
                ($value.StartsWith("'") -and $value.EndsWith("'"))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        # Definir variable pour le processus courant
        [Environment]::SetEnvironmentVariable($key, $value, "Process")

        Write-Host "  -> $key charge" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Variables d'environnement chargees avec succes." -ForegroundColor Green
Write-Host ""

# Verification JWT_SECRET
if (-Not $env:JWT_SECRET) {
    Write-Host "ERREUR: JWT_SECRET n'est pas defini dans .env !" -ForegroundColor Red
    exit 1
}

if ($env:JWT_SECRET.Length -lt 32) {
    Write-Host "ATTENTION: JWT_SECRET devrait faire au moins 32 caracteres." -ForegroundColor Yellow
    Write-Host "Longueur actuelle: $($env:JWT_SECRET.Length)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Configuration actuelle:" -ForegroundColor Cyan
Write-Host "  JWT_SECRET (partiel): $($env:JWT_SECRET.Substring(0, [Math]::Min(20, $env:JWT_SECRET.Length)))..." -ForegroundColor Gray
Write-Host "  JWT_EXPIRATION_MS: $env:JWT_EXPIRATION_MS" -ForegroundColor Gray
Write-Host "  CORS_ALLOWED_ORIGINS: $env:CORS_ALLOWED_ORIGINS" -ForegroundColor Gray
Write-Host ""

Write-Host "Demarrage de l'application Spring Boot..." -ForegroundColor Green
Write-Host ""

# Lancer Spring Boot via Maven Wrapper ou Maven global
if (Test-Path ".\mvnw.cmd") {
    cmd.exe /c "mvnw.cmd spring-boot:run"
}
elseif (Get-Command mvn -ErrorAction SilentlyContinue) {
    mvn spring-boot:run
}
else {
    Write-Host "ERREUR: Ni Maven Wrapper ni Maven global introuvable." -ForegroundColor Red
    exit 1
}
