# Documentation d'Hébergement - Jeux Brise-Glace

Ce document explique comment héberger et déployer la plateforme de jeux brise-glace.

## 📋 Table des matières

- [Options d'hébergement](#options-dhébergement)
- [Déploiement sur GitHub Pages](#déploiement-sur-github-pages)
- [Déploiement sur Netlify](#déploiement-sur-netlify)
- [Déploiement sur Vercel](#déploiement-sur-vercel)
- [Hébergement traditionnel](#hébergement-traditionnel)

## 🚀 Options d'hébergement

Cette plateforme est un site web statique qui peut être hébergé sur plusieurs services :

### 1. GitHub Pages (Gratuit)
- ✅ Gratuit et simple
- ✅ Intégration directe avec GitHub
- ✅ HTTPS automatique
- ⚠️ Domaine : `username.github.io/repo-name`

### 2. Netlify (Gratuit)
- ✅ Gratuit pour projets personnels
- ✅ Déploiement automatique
- ✅ Domaine personnalisé gratuit
- ✅ HTTPS automatique

### 3. Vercel (Gratuit)
- ✅ Gratuit pour projets personnels
- ✅ Déploiement ultra-rapide
- ✅ Performance optimisée
- ✅ HTTPS automatique

### 4. Hébergement traditionnel
- Serveur web classique (Apache, Nginx)
- Hébergement partagé ou VPS

## 📦 Déploiement sur GitHub Pages

### Méthode 1 : Via les paramètres du repository

1. Allez dans **Settings** > **Pages**
2. Dans **Source**, sélectionnez la branche `main` ou `master`
3. Sélectionnez le dossier `/` (root)
4. Cliquez sur **Save**
5. Votre site sera disponible à : `https://username.github.io/jeux-brise-glace-new/`

### Méthode 2 : Via GitHub Actions

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .
```

## 🌐 Déploiement sur Netlify

### Méthode 1 : Déploiement via Git

1. Créez un compte sur [Netlify](https://netlify.com)
2. Cliquez sur **New site from Git**
3. Connectez votre repository GitHub
4. Sélectionnez votre repository `jeux-brise-glace-new`
5. Configurez :
   - **Build command**: (laisser vide)
   - **Publish directory**: `.`
6. Cliquez sur **Deploy site**

Le fichier `netlify.toml` est déjà configuré avec les en-têtes de sécurité appropriés.

### Méthode 2 : Déploiement manuel

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod
```

## ⚡ Déploiement sur Vercel

### Méthode 1 : Via l'interface web

1. Créez un compte sur [Vercel](https://vercel.com)
2. Cliquez sur **New Project**
3. Importez votre repository GitHub
4. Vercel détectera automatiquement la configuration
5. Cliquez sur **Deploy**

Le fichier `vercel.json` est déjà configuré.

### Méthode 2 : Via CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

## 🖥️ Hébergement traditionnel

### Configuration Apache

Créez un fichier `.htaccess` :

```apache
# Activer la compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

# Cache des fichiers statiques
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# En-têtes de sécurité
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

### Configuration Nginx

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/jeux-brise-glace;
    index index.html;

    # Compression
    gzip on;
    gzip_types text/css application/javascript text/html;

    # Cache des fichiers statiques
    location ~* \.(css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # En-têtes de sécurité
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "DENY";
    add_header X-XSS-Protection "1; mode=block";

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### Upload via FTP

1. Connectez-vous à votre serveur via FTP
2. Uploadez tous les fichiers :
   - `index.html`
   - `styles.css`
   - `script.js`
3. Assurez-vous que les permissions sont correctes (644 pour les fichiers)

## 🔧 Configuration du domaine personnalisé

### GitHub Pages

1. Ajoutez un fichier `CNAME` avec votre domaine
2. Configurez les DNS :
   ```
   Type: A
   Name: @
   Value: 185.199.108.153
          185.199.109.153
          185.199.110.153
          185.199.111.153
   ```

### Netlify

1. Allez dans **Domain settings**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS

### Vercel

1. Allez dans **Domains**
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions

## 🔒 HTTPS

Tous les services modernes (GitHub Pages, Netlify, Vercel) fournissent HTTPS automatiquement via Let's Encrypt.

Pour un serveur traditionnel, utilisez [Certbot](https://certbot.eff.org/) :

```bash
sudo certbot --nginx -d votre-domaine.com
```

## 📱 Test local

Pour tester localement avant le déploiement :

```bash
# Option 1 : Python
python3 -m http.server 8000

# Option 2 : Node.js (http-server)
npx http-server

# Option 3 : PHP
php -S localhost:8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez que tous les fichiers sont présents
2. Vérifiez les permissions des fichiers
3. Consultez la documentation du service d'hébergement
4. Vérifiez la console du navigateur pour les erreurs

## 📝 Notes importantes

- Le site est entièrement statique (HTML/CSS/JS)
- Aucune compilation n'est nécessaire
- Aucune dépendance externe
- Compatible avec tous les navigateurs modernes
- Responsive et mobile-friendly

---

**Bon déploiement ! 🚀**
