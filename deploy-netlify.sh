#!/bin/bash

# Script de déploiement Netlify pour Brainova
echo "🚀 Déploiement de Brainova sur Netlify..."

# Vérifier si Netlify CLI est installé
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI n'est pas installé. Installation..."
    npm install -g netlify-cli
fi

# Login Netlify (si pas déjà connecté)
echo "🔐 Vérification de l'authentification Netlify..."
netlify status || netlify login

# Déployer en production
echo "📦 Déploiement en production..."
netlify deploy --prod --dir=. --functions=netlify/functions

# Vérifier le déploiement
echo "✅ Vérification du déploiement..."
netlify open:site

echo "🎉 Déploiement terminé!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Configurez vos variables d'environnement dans Netlify Dashboard"
echo "2. Testez les endpoints: /.netlify/functions/health-check"
echo "3. Configurez les webhooks Stripe"
echo ""
echo "📚 Guide complet: voir NETLIFY_GUIDE.md"