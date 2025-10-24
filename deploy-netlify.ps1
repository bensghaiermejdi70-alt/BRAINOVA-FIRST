# Script de déploiement Netlify pour Brainova (Windows PowerShell)
Write-Host "🚀 Déploiement de Brainova sur Netlify..." -ForegroundColor Green

# Vérifier si Netlify CLI est installé
try {
    netlify --version | Out-Null
    Write-Host "✅ Netlify CLI détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Netlify CLI n'est pas installé. Installation..." -ForegroundColor Yellow
    npm install -g netlify-cli
}

# Vérifier si on a un site Netlify configuré
Write-Host "🔐 Vérification de la configuration Netlify..." -ForegroundColor Cyan

try {
    $status = netlify status 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "🔗 Première connexion à Netlify..." -ForegroundColor Yellow
        netlify login
        netlify init
    }
} catch {
    Write-Host "🔗 Configuration Netlify..." -ForegroundColor Yellow
    netlify login
    netlify init
}

# Installer les dépendances si nécessaire
if (Test-Path "package.json") {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Cyan
    npm install
}

# Déployer en production
Write-Host "🚀 Déploiement en production..." -ForegroundColor Green
netlify deploy --prod --dir=. --functions=netlify/functions

# Vérifier le déploiement
Write-Host "✅ Ouverture du site..." -ForegroundColor Green
netlify open:site

Write-Host ""
Write-Host "🎉 Déploiement terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Configurez vos variables d'environnement dans Netlify Dashboard"
Write-Host "2. Testez: https://votre-site.netlify.app/.netlify/functions/health-check"
Write-Host "3. Configurez les webhooks Stripe"
Write-Host ""
Write-Host "📚 Guide complet: voir NETLIFY_GUIDE.md" -ForegroundColor Cyan