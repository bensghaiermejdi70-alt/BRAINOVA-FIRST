/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.4.3 (Final)
   ===========================================================
   - Version: v2.4.3
   - Objectif: finaliser la logique des boutons (Partager / Connexion / Inscription / Premium / Déconnexion)
   - Comportement attendu (résumé):
     • Visiteur gratuit (non abonné):
       - "Partager" : ACTIF
       - "Connexion" / "Inscription" : INACCESSIBLES (grisés)
       - "Premium" : VISIBLE
       - "Déconnexion" : CACHÉ

     • Abonné Premium (après paiement):
       - "Partager" : GRISÉ (inactif)
       - "Connexion" / "Inscription" : ACCESSIBLES
       - "Premium" : CACHÉ
       - "Déconnexion" : VISIBLE

   - Principales améliorations par rapport à v2.4.1:
     • Correction de la logique d'affichage des boutons pour respecter la matrice 🟡/💎
     • Ajout d'une fonction de déconnexion complète (nettoyage localStorage/sessionStorage/cookies)
     • Robustesse sur la détection du statut (query param, localStorage, sessionStorage, cookie, API verify-premium)
     • Neutralisation plus sûre des variables locales isPremium définies par d'autres scripts

   Déployez ce fichier à la racine publique (/brainova-access.js) et remplacez l'ancienne version.
   =========================================================== */

console.log("🚀 Initialisation du module Brainova Access v2.4.3...");

// -----------------------------
// Utilitaires cookies / storage
// -----------------------------
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=0; path=/';
}

// Clean logout: remove all Brainova related storage and reload to index
function performLogout() {
  console.log('🔒 Exécution de la déconnexion complète...');
  try {
    // Remove known keys
    localStorage.removeItem('brainova_premium');
    localStorage.removeItem('brainova_premium_status');
    localStorage.removeItem('brainova_last_sync');
    sessionStorage.removeItem('brainova_user_status');
    sessionStorage.removeItem('bannerShown');

    // Delete cookie if present
    deleteCookie('brainova_user_status');

    // Optionally clear other Brainova-related keys
    Object.keys(localStorage).forEach(k => {
      if (k && k.startsWith('brainova_')) localStorage.removeItem(k);
    });

    // Force reload to root (ensures UI is rebuilt as non-premium)
    window.location.href = '/';
  } catch (e) {
    console.error('❌ Erreur pendant la déconnexion :', e);
    window.location.reload();
  }
}

// -----------------------------
// Neutralisation de variables locales isPremium
// -----------------------------
try {
  document.querySelectorAll('script').forEach(s => {
    // retire les déclarations littérales `let isPremium = true/false;` pour éviter conflits
    if (s.textContent && /let\s+isPremium\s*=\s*(true|false)\s*;?/.test(s.textContent)) {
      s.textContent = s.textContent.replace(/let\s+isPremium\s*=\s*(true|false)\s*;?/g, '');
      console.warn('⚙️ Neutralisation d\'une variable isPremium locale dans un <script>.');
    }
  });
} catch (e) {
  console.warn('⚠️ Impossible de neutraliser certaines variables locales (cross-origin scripts?)', e);
}

// -----------------------------
// Détection initiale du statut Premium
// -----------------------------
let isPremiumUser = false;
const LAST_SYNC_KEY = 'brainova_last_sync';
const SYNC_INTERVAL_HOURS = 2; // synchroniser toutes les X heures

function detectPremiumFromStorages() {
  const fromLocal = localStorage.getItem('brainova_premium') === 'true';
  const fromSession = sessionStorage.getItem('brainova_user_status') === 'premium';
  const fromCookie = getCookie('brainova_user_status') === 'premium';
  return fromLocal || fromSession || fromCookie;
}

// Force activation via query param after redirection Stripe
function detectPremiumFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('premium') && params.get('premium') === '1') return true;
  } catch (e) {
    // ignore
  }
  return false;
}

// API verify-premium (Netlify Functions) -> attend { active: true|false }
async function syncPremiumStatus() {
  console.log('🔄 Vérification du statut Premium via API...');
  try {
    const res = await fetch('/.netlify/functions/verify-premium', { cache: 'no-store' });
    if (!res.ok) {
      console.warn('⚠️ verify-premium non OK:', res.status);
      return; // ne change rien si échec
    }
    const data = await res.json();
    if (data && data.active) {
      localStorage.setItem('brainova_premium', 'true');
      localStorage.setItem('brainova_premium_status', 'confirmed');
      sessionStorage.setItem('brainova_user_status', 'premium');
      setCookie('brainova_user_status', 'premium', 365);
      isPremiumUser = true;
      console.log('✅ Statut Premium confirmé via API.');
    } else {
      localStorage.removeItem('brainova_premium');
      localStorage.removeItem('brainova_premium_status');
      sessionStorage.setItem('brainova_user_status', 'free');
      setCookie('brainova_user_status', 'free', 365);
      isPremiumUser = false;
      console.log('ℹ️ Statut non-Premium confirmé via API.');
    }
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (e) {
    console.warn('⚠️ Erreur de synchronisation verify-premium :', e.message || e);
  }
}

// -----------------------------
// UI helpers (boutons & cards)
// -----------------------------
function setElementState(el, { visible = true, enabled = true, display = 'inline-block' } = {}) {
  if (!el) return;
  el.style.display = visible ? display : 'none';
  el.style.pointerEvents = enabled ? 'auto' : 'none';
  el.style.opacity = enabled ? '1' : '0.5';
}

function applyPremiumBorder(card) {
  if (!card) return;
  if (card.dataset.premiumStyled === 'true') return;
  card.style.outline = '3px solid #FFD700';
  card.style.outlineOffset = '2px';
  card.style.boxShadow = '0 0 12px rgba(255,215,0,0.7)';
  card.dataset.premiumStyled = 'true';
}

function lockCard(card) {
  if (!card) return;
  card.classList.add('locked');
  card.style.opacity = '0.7';
  card.style.position = 'relative';
  if (!card.querySelector('.lock-icon')) {
    const lock = document.createElement('div');
    lock.className = 'lock-icon';
    lock.textContent = '🔒';
    lock.style.cssText = `position:absolute;top:10px;right:10px;font-size:22px;color:#ff5252;text-shadow:0 0 4px rgba(0,0,0,0.4);font-family:sans-serif;z-index:5;`;
    card.appendChild(lock);
  }
  if (!card.dataset.clickBound) {
    card.addEventListener('click', e => {
      e.preventDefault();
      alert('🔒 Ce jeu est réservé aux abonnés Premium.\nAbonnez-vous pour y accéder !');
    });
    card.dataset.clickBound = 'true';
  }
}

function unlockCard(card, isPremiumGame) {
  if (!card) return;
  card.classList.remove('locked');
  card.style.opacity = '1';
  const lock = card.querySelector('.lock-icon');
  if (lock) lock.remove();
  if (isPremiumGame) applyPremiumBorder(card);
}

// Met à jour l'UI des boutons selon isPremiumUser
function updateButtonsUI() {
  const premiumBtn = document.getElementById('premiumBtn');
  const shareBtn = document.getElementById('shareBtn');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (isPremiumUser) {
    // 💎 Abonné Premium
    setElementState(premiumBtn, { visible: false }); // Premium caché
    // "Partager" grisé
    setElementState(shareBtn, { visible: true, enabled: false });
    // Connexion/Inscription accessibles
    setElementState(loginBtn, { visible: true, enabled: true });
    setElementState(signupBtn, { visible: true, enabled: true });
    // Déconnexion visible
    setElementState(logoutBtn, { visible: true, enabled: true });
  } else {
    // 🟡 Visiteur Gratuit
    setElementState(premiumBtn, { visible: true, enabled: true }); // Premium visible
    // "Partager" actif
    setElementState(shareBtn, { visible: true, enabled: true });
    // Connexion/Inscription inaccessibles (grisés)
    setElementState(loginBtn, { visible: true, enabled: false });
    setElementState(signupBtn, { visible: true, enabled: false });
    // Déconnexion caché
    setElementState(logoutBtn, { visible: false });
  }
}

// Affiche une bannière Premium (une seule fois par session)
function showPremiumBannerOnce() {
  try {
    if (sessionStorage.getItem('bannerShown')) return;
    const banner = document.createElement('div');
    banner.id = 'premium-banner';
    banner.textContent = '🎉 Mode Premium synchronisé — accès complet confirmé !';
    banner.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#00ff88,#00ccff);color:#000;padding:12px 24px;border-radius:12px;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.4);z-index:9999;`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 4000);
    sessionStorage.setItem('bannerShown', 'true');
  } catch (e) {
    // ignore
  }
}

// -----------------------------
// Initialisation principale
// -----------------------------
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔧 Initialisation DOM — détection statut utilisateur...');

  // slight delay to ensure page elements exist
  await new Promise(r => setTimeout(r, 200));

  // 1) Détection locale
  isPremiumUser = detectPremiumFromStorages();

  // 2) Détection query param (retour Stripe) -> priorité: force premium
  if (detectPremiumFromQuery()) {
    console.log('🎯 Détection de retour paiement via query param : activation Premium forcée');
    localStorage.setItem('brainova_premium', 'true');
    sessionStorage.setItem('brainova_user_status', 'premium');
    setCookie('brainova_user_status', 'premium', 365);
    isPremiumUser = true;
  }

  // 3) Synchronisation périodique via API si nécessaire
  const now = Date.now();
  const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0', 10);
  const hoursSince = (now - lastSync) / (1000 * 60 * 60);
  if (isNaN(hoursSince) || hoursSince > SYNC_INTERVAL_HOURS) {
    await syncPremiumStatus();
  } else {
    // si sync locale indique premium mise à jour isPremiumUser
    isPremiumUser = detectPremiumFromStorages();
  }

  // If still detect premium from query or sync set it
  if (detectPremiumFromQuery()) isPremiumUser = true;

  console.log(isPremiumUser ? '🎮 Mode Premium détecté' : '🟡 Mode Gratuit détecté');

  // Gestion des cartes (jeux)
  const cards = document.querySelectorAll('.card');
  if (!cards.length) console.warn('⚠️ Aucune carte détectée sur la page.');

  cards.forEach((card, i) => {
    const num = i + 1;
    const isPremiumGame = num > 10; // 1-10 gratuits, 11+ premium
    if (isPremiumGame && !isPremiumUser) {
      lockCard(card);
      console.log(`🟣 Carte ${num} verrouillée (Premium)`);
    } else {
      unlockCard(card, isPremiumGame);
      console.log(`🟢 Carte ${num} ${isPremiumGame ? 'Premium' : 'Gratuit'} accessible`);
    }
  });

  // Mise à jour des boutons UI
  updateButtonsUI();

  // Afficher la bannière Premium si premium
  if (isPremiumUser) showPremiumBannerOnce();

  // Attacher actions aux boutons (si présents)
  const premiumBtn = document.getElementById('premiumBtn');
  const shareBtn = document.getElementById('shareBtn');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (premiumBtn) {
    premiumBtn.addEventListener('click', e => {
      // redirection vers checkout (utilisateur doit configurer create-checkout-session.js)
      // on recommande la page de pricing / checkout
      e.preventDefault();
      // Example: redirect to checkout creation endpoint
      window.location.href = '/pricing.html';
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', e => {
      if (isPremiumUser) {
        // si premium, bouton grisé -> on bloque
        e.preventDefault();
        return;
      }
      // comportement de partage (ex: Web Share API ou fallback)
      try {
        if (navigator.share) {
          navigator.share({
            title: document.title,
            text: 'Découvrez Brainova — plateforme de jeux et apprentissage !',
            url: window.location.href
          }).catch(() => {});
        } else {
          // fallback: copie du lien
          navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Lien copié dans le presse-papiers — partagez-le !');
          });
        }
      } catch (err) {
        console.warn('⚠️ Erreur partage :', err);
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', e => {
      if (!isPremiumUser) {
        // bloquer l'accès si inactif
        e.preventDefault();
        alert('🔐 L\'accès à cette fonction est réservé aux utilisateurs inscrits.');
        return;
      }
      // comportement normal (ex: ouvrir modal login)
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener('click', e => {
      if (!isPremiumUser) {
        e.preventDefault();
        alert('🔐 Inscription limitée depuis la plateforme pour les visiteurs non abonnés.');
        return;
      }
      // comportement normal pour inscription
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      performLogout();
    });
  }

});

// -----------------------------
// Expose helpers globalement pour debug (optionnel)
// -----------------------------
window.__brainova = window.__brainova || {};
window.__brainova.forcePremium = function () {
  localStorage.setItem('brainova_premium', 'true');
  sessionStorage.setItem('brainova_user_status', 'premium');
  setCookie('brainova_user_status', 'premium', 365);
  location.reload();
};
window.__brainova.forceFree = function () {
  localStorage.removeItem('brainova_premium');
  sessionStorage.setItem('brainova_user_status', 'free');
  setCookie('brainova_user_status', 'free', 365);
  location.reload();
};
window.__brainova.logout = performLogout;

console.log('✅ brainova-access v2.4.3 chargé.');
