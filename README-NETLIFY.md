# 🧠 Brainova - Configuration Netlify Complète

## ✅ Système Netlify Restauré

### 📁 Structure des fichiers ajoutés

```
/
├── netlify.toml                 # Configuration Netlify
├── package.json                 # Dépendances et scripts
├── netlify/functions/           # Functions serverless
│   ├── create-checkout-session.js
│   ├── stripe-webhook.js
│   └── health-check.js
├── deploy-netlify.ps1          # Script déploiement Windows
├── deploy-netlify.sh           # Script déploiement Linux/Mac
├── .env.example                # Template variables d'environnement
└── NETLIFY_GUIDE.md            # Guide détaillé
```

### 🚀 Déploiement rapide

#### Option 1: Script automatique (Windows)
```powershell
.\deploy-netlify.ps1
```

#### Option 2: Commandes manuelles
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod --dir=. --functions=netlify/functions
```

### 🔧 Configuration requise

1. **Variables d'environnement Netlify** :
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
   - `NODE_ENV=production`

2. **Webhook Stripe** :
   - URL: `https://votre-site.netlify.app/.netlify/functions/stripe-webhook`
   - Événements: `checkout.session.completed`, `customer.subscription.*`

### 🔗 Endpoints disponibles

- **Health Check**: `/.netlify/functions/health-check`
- **Stripe Checkout**: `/.netlify/functions/create-checkout-session`
- **Stripe Webhook**: `/.netlify/functions/stripe-webhook`

### ✨ Avantages du système Netlify

- ✅ **Functions serverless** pour Stripe
- ✅ **Déploiement automatique** depuis GitHub
- ✅ **HTTPS gratuit** et CDN global
- ✅ **Variables d'environnement** sécurisées
- ✅ **Logs et monitoring** intégrés
- ✅ **Fallback** vers URL Stripe directe

### 🧪 Test local

```bash
# Développement local
netlify dev

# Tester les functions
curl http://localhost:8888/.netlify/functions/health-check
```

Le système Netlify est maintenant **complètement restauré** et prêt pour la production ! 🎉