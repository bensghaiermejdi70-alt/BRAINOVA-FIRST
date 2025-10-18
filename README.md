# 🎮 Jeux Brise-Glace

Une plateforme interactive de 37 jeux brise-glace pour animer vos événements, formations et rencontres.

## 🌟 Fonctionnalités

- **37 jeux différents** : Une collection complète de jeux pour toutes les occasions
- **Recherche rapide** : Trouvez le jeu parfait avec la barre de recherche
- **Filtres par catégorie** : Rapide, Grand Groupe, Créatif, Mouvement
- **Design responsive** : Fonctionne sur mobile, tablette et ordinateur
- **Interface intuitive** : Navigation simple et agréable
- **Détails complets** : Règles, durée, nombre de joueurs et matériel nécessaire

## 🚀 Déploiement

### GitHub Pages

Le site est configuré pour être déployé sur GitHub Pages. Pour activer l'hébergement :

1. Allez dans les **Settings** de votre repository
2. Dans la section **Pages** (menu de gauche)
3. Sous **Source**, sélectionnez la branche `copilot/add-new-icebreaker-games-site`
4. Cliquez sur **Save**
5. Votre site sera accessible à : `https://bensghaiermejdi70-alt.github.io/jeux-brise-glace-new/`

### Autres options d'hébergement

Le site est un site statique pur (HTML, CSS, JS) et peut être hébergé sur :

- **Netlify** : Glissez-déposez le dossier sur netlify.com/drop
- **Vercel** : Connectez votre repository GitHub
- **Firebase Hosting** : `firebase deploy`
- **Surge** : `surge .` depuis le dossier
- **N'importe quel serveur web** : Uploadez les fichiers via FTP

## 📁 Structure du projet

```
jeux-brise-glace-new/
├── index.html          # Page principale
├── styles.css          # Styles CSS
├── script.js           # Logique JavaScript
├── games-data.js       # Données des 37 jeux
├── 404.html           # Page d'erreur 404
├── .gitignore         # Fichiers à ignorer
└── README.md          # Ce fichier
```

## 🎯 Utilisation locale

Pour tester le site localement :

1. Clonez le repository
2. Ouvrez `index.html` dans votre navigateur
3. Ou utilisez un serveur local :
   ```bash
   # Avec Python 3
   python -m http.server 8000
   
   # Avec Node.js
   npx http-server
   ```
4. Accédez à `http://localhost:8000`

## 🎨 Personnalisation

### Modifier les couleurs

Éditez les variables CSS dans `styles.css` :

```css
:root {
    --primary-color: #4A90E2;
    --secondary-color: #50C878;
    --accent-color: #FF6B6B;
    /* ... */
}
```

### Ajouter des jeux

Ajoutez un nouvel objet dans le tableau `gamesData` dans `games-data.js` :

```javascript
{
    id: 38,
    title: "Nom du jeu",
    duration: "10-15 min",
    players: "5-20 personnes",
    category: "rapide", // rapide, groupe, creatif, mouvement
    description: "Description du jeu...",
    rules: ["Règle 1", "Règle 2", ...],
    materials: ["Matériel 1", "Matériel 2", ...]
}
```

## 📱 Compatibilité

- ✅ Chrome, Firefox, Safari, Edge (dernières versions)
- ✅ Mobile et tablette (responsive design)
- ✅ Pas de dépendances externes
- ✅ Fonctionne hors ligne (après première visite)

## 📄 Licence

Ce projet est libre d'utilisation pour des événements éducatifs, formations et rencontres.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ajouter de nouveaux jeux
- Améliorer l'interface
- Corriger des bugs
- Traduire dans d'autres langues

---

**Créé avec ❤️ pour faciliter les rencontres et créer des liens**

