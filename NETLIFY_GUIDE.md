# Brainova - Netlify Deployment Guide

## 🚀 Configuration Netlify

### 1. Variables d'environnement à configurer dans Netlify

Allez dans votre dashboard Netlify > Site settings > Environment variables et ajoutez :

```bash
STRIPE_SECRET_KEY=sk_live_votre_clé_secrète_stripe
STRIPE_PUBLISHABLE_KEY=pk_live_votre_clé_publique_stripe  
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
NODE_ENV=production
```

### 2. Configuration du Webhook Stripe

Dans votre dashboard Stripe > Webhooks, créez un nouveau webhook :

- **URL**: `https://votre-site.netlify.app/.netlify/functions/stripe-webhook`
- **Événements à écouter**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 3. Endpoints disponibles

- **Health Check**: `/.netlify/functions/health-check`
- **Créer session Stripe**: `/.netlify/functions/create-checkout-session`
- **Webhook Stripe**: `/.netlify/functions/stripe-webhook`

### 4. Déploiement

1. Connectez votre repository GitHub à Netlify
2. Configurez les variables d'environnement
3. Le déploiement se fait automatiquement à chaque push

### 5. Test des functions

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Lancer en local
netlify dev

# Tester les endpoints
curl https://votre-site.netlify.app/.netlify/functions/health-check
```

## 🔒 Sécurité

- ✅ CORS configuré
- ✅ Validation des webhooks Stripe
- ✅ Headers de sécurité
- ✅ Variables d'environnement protégées

## 📊 Monitoring

Les logs sont disponibles dans :
- Netlify Dashboard > Functions > Logs
- Stripe Dashboard > Webhooks > Logs