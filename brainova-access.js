/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.4.4 (Final corrigé)
   ===========================================================
   - Version: v2.4.4
   - Objectif: corriger définitivement la logique d'accès après paiement
     et résoudre le problème principal où les paiements réels étaient
     reçus (ex: 20 EUR) mais les jeux restaient verrouillés.

   - Comportements clés implémentés:
     • Avant abonnement (visiteur): jeux verrouillés, "Partager" ACTIF,
       Connexion/Inscription INACCESSIBLES, Premium VISIBLE, Déconnexion CACHÉ.
     • Après abonnement confirmé (via verify-premium API ou checkout session):
       jeux déverrouillés, "Partager" GRISÉ/INACCESSIBLE, Connexion/Inscription ACCESSIBLES,
       Premium CACHÉ, Déconnexion VISIBLE.

   - Principales améliorations techniques:
     1) Gestion robuste du cas où le client est redirigé depuis Stripe
        avant que le webhook (checkout.session.completed) ne soit traité.
        -> La page success déclenche un mécanisme de polling sécurisé vers
           /.netlify/functions/verify-premium pour confirmer l'activation.
     2) Meilleure détection du client: prise en charge d'un paramètre
        `session_id` (Checkout Session) et `customer_email` si disponibles.
     3) Déconnexion complète et claire: suppression de toutes les clés brainova_*.
     4) Fonctions globales d'aide au debug: forcePremium, forceFree, logout.

   - Déploiement recommandé:
     • Mettre success_url dans la création de Checkout à:
       https://brainovafirst.netlify.app/success.html?session_id={CHECKOUT_SESSION_ID}&premium=1
     • Vérifier que Stripe webhook endpoint pointe vers:
       https://brainovafirst.netlify.app/.netlify/functions/stripe-webhook
     • Assurer que le webhook écrit/active le statut côté backend (base ou cache)
       que verify-premium lit (par customer_email ou subscription id).

   =========================================================== */

console.log('🚀 Initialisation du module Brainova Access v2.4.4...');

// -----------------------------
// Utilitaires cookies / storage
// -----------------------------
function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=0; path=/';
}

// -----------------------------
// Déconnexion complète
// -----------------------------
function performLogout() {
  console.log('🔒 Exécution de la déconnexion complète...');
  try {
    // Remove known keys
    localStorage.removeItem('brainova_premium');
    localStorage.removeItem('brainova_premium_status');
    localStorage.removeItem('brainova_last_sync');
    sessionStorage.removeItem('brainova_user_status');
    sessionStorage.removeItem('bannerShown');

    // Remove all brainova_ keys
    Object.keys(localStorage).forEach(k => {
      if (k && k.startsWith('brainova_')) localStorage.removeItem(k);
    });

    // Clear session storage fully (safer)
    try { sessionStorage.clear(); } catch (e) { /* ignore */ }

    // Delete cookie
    deleteCookie('brainova_user_status');

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
    if (s.textContent && /let\s+isPremium\s*=\s*(true|false)\s*;?/.test(s.textContent)) {
      s.textContent = s.textContent.replace(/let\s+isPremium\s*=\s*(true|false)\s*;?/g, '');
      console.warn("⚙️ Neutralisation d'une variable isPremium locale dans un <script>.");
    }
  });
} catch (e) {
  console.warn('⚠️ Impossible de neutraliser certaines variables locales (cross-origin scripts?)', e);
}

// -----------------------------
// Détection du statut Premium
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

function detectPremiumFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('premium') && params.get('premium') === '1') return true;
  } catch (e) {
    // ignore
  }
  return false;
}

// API verify-premium (Netlify Functions) -> attends { active: true|false }
async function syncPremiumStatus({ session_id = null, customer_email = null } = {}) {
  console.log('🔄 Vérification du statut Premium via API...');
  try {
    // Build query string to help server identify the customer/session
    const qs = new URLSearchParams();
    if (session_id) qs.set('session_id', session_id);
    if (customer_email) qs.set('customer_email', customer_email);

    const url = '/.netlify/functions/verify-premium' + (qs.toString() ? ('?' + qs.toString()) : '');
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn('⚠️ verify-premium non OK:', res.status);
      return { active: false, error: res.status };
    }
    const data = await res.json();
    if (data && data.active) {
      localStorage.setItem('brainova_premium', 'true');
      localStorage.setItem('brainova_premium_status', 'confirmed');
      sessionStorage.setItem('brainova_user_status', 'premium');
      setCookie('brainova_user_status', 'premium', 365);
      isPremiumUser = true;
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      console.log('✅ Statut Premium confirmé via API.');
      return { active: true };
    }
    // not active
    localStorage.removeItem('brainova_premium');
    localStorage.removeItem('brainova_premium_status');
    sessionStorage.setItem('brainova_user_status', 'free');
    setCookie('brainova_user_status', 'free', 365);
    isPremiumUser = false;
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    console.log('ℹ️ Statut non-Premium confirmé via API.');
    return { active: false };
  } catch (e) {
    console.warn('⚠️ Erreur de synchronisation verify-premium :', e.message || e);
    return { active: false, error: e };
  }
}

// Polling helper: tente de vérifier plusieurs fois si nécessaire
async function pollVerifyPremium({ session_id = null, customer_email = null, retries = 8, intervalMs = 2000 } = {}) {
  for (let i = 0; i < retries; i++) {
    const result = await syncPremiumStatus({ session_id, customer_email });
    if (result && result.active) return true;
    console.log('⏳ Vérification premium attempt ' + (i + 1) + '/' + retries + ' — encore en attente...');
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

// -----------------------------
// UI helpers
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
    lock.style.cssText = 'position:absolute;top:10px;right:10px;font-size:22px;color:#ff5252;text-shadow:0 0 4px rgba(0,0,0,0.4);font-family:sans-serif;z-index:5;';
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

function updateButtonsUI() {
  const premiumBtn = document.getElementById('premiumBtn');
  const shareBtn = document.getElementById('shareBtn');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (isPremiumUser) {
    // After confirmed subscription
    setElementState(premiumBtn, { visible: false }); // Premium hidden
    setElementState(shareBtn, { visible: true, enabled: false }); // share grayed
    setElementState(loginBtn, { visible: true, enabled: true });
    setElementState(signupBtn, { visible: true, enabled: true });
    setElementState(logoutBtn, { visible: true, enabled: true });
  } else {
    // Before subscription
    setElementState(premiumBtn, { visible: true, enabled: true });
    setElementState(shareBtn, { visible: true, enabled: true }); // share active
    setElementState(loginBtn, { visible: true, enabled: false });
    setElementState(signupBtn, { visible: true, enabled: false });
    setElementState(logoutBtn, { visible: false });
  }
}

function showPremiumBannerOnce() {
  try {
    if (sessionStorage.getItem('bannerShown')) return;
    const banner = document.createElement('div');
    banner.id = 'premium-banner';
    banner.textContent = '🎉 Mode Premium synchronisé — accès complet confirmé !';
    banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#00ff88,#00ccff);color:#000;padding:12px 24px;border-radius:12px;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.4);z-index:9999;';
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 4000);
    sessionStorage.setItem('bannerShown', 'true');
  } catch (e) { /* ignore */ }
}

// -----------------------------
// Initialisation principale
// -----------------------------
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔧 Initialisation DOM — détection statut utilisateur...');
  await new Promise(r => setTimeout(r, 200));

  // 1) detection local
  isPremiumUser = detectPremiumFromStorages();

  // 2) detect query param
  const params = new URLSearchParams(window.location.search);
  const forcedPremium = detectPremiumFromQuery();
  const session_id = params.get('session_id') || null;
  const customer_email = params.get('customer_email') || null;

  if (forcedPremium) {
    console.log("🎯 Détection de retour paiement via query param : tentative d'activation Premium");
    // Tentative immédiate: set tentative flags and poll verify endpoint
    localStorage.setItem('brainova_premium_attempt', 'true');

    // Poll verify-premium for a short time to allow webhook processing
    const activated = await pollVerifyPremium({ session_id, customer_email, retries: 10, intervalMs: 2000 });
    if (!activated) {
      console.warn('⚠️ Activation non confirmée immédiatement — état en attente. Le webhook peut prendre quelques secondes.');
      // Afficher message informatif et laisser verifyPremium sync plus tard
      const info = document.createElement('div');
      info.id = 'premium-wait-info';
      info.textContent = 'Activation en cours... Si vos jeux ne se déverrouillent pas dans 30s, contactez le support.';
      info.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#fff3cd;padding:10px 16px;border-radius:8px;border:1px solid #ffeeba;color:#856404;z-index:9999;';
      document.body.appendChild(info);
      setTimeout(() => { try { info.remove(); } catch (e) {} }, 30000);
    }
  }

  // 3) If last sync is old, do a background sync (non-blocking)
  const now = Date.now();
  const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0', 10);
  const hoursSince = (now - lastSync) / (1000 * 60 * 60);
  if (isNaN(hoursSince) || hoursSince > SYNC_INTERVAL_HOURS) {
    // background but we await quickly (short timeout)
    syncPremiumStatus({ session_id, customer_email }).catch(() => {});
  } else {
    // keep existing detection
    isPremiumUser = detectPremiumFromStorages();
  }

  // Ensure detection reflects latest
  isPremiumUser = detectPremiumFromStorages() || (forcedPremium && localStorage.getItem('brainova_premium') === 'true');

  console.log(isPremiumUser ? '🎮 Mode Premium détecté' : '🟡 Mode verrouillé détecté');

  // Gestion des cartes
  const cards = document.querySelectorAll('.card');
  if (!cards.length) console.warn('⚠️ Aucune carte détectée sur la page.');
  cards.forEach((card, i) => {
    const num = i + 1;
    const isPremiumGame = num > 10; // si tu utilises autre découpage, ajuste ici
    if (isPremiumGame && !isPremiumUser) {
      lockCard(card);
      console.log('🟣 Carte ' + num + ' verrouillée (Premium)');
    } else {
      unlockCard(card, isPremiumGame);
      console.log('🟢 Carte ' + num + ' ' + (isPremiumGame ? 'Premium' : 'Gratuit') + ' accessible');
    }
  });

  // update buttons
  updateButtonsUI();
  if (isPremiumUser) showPremiumBannerOnce();

  // Attach button handlers
  const premiumBtn = document.getElementById('premiumBtn');
  const shareBtn = document.getElementById('shareBtn');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (premiumBtn) {
    premiumBtn.addEventListener('click', e => {
      e.preventDefault();
      window.location.href = '/pricing.html';
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', e => {
      if (isPremiumUser) { e.preventDefault(); return; }
      try {
        if (navigator.share) {
          navigator.share({ title: document.title, text: 'Découvrez Brainova — plateforme de jeux et apprentissage !', url: window.location.href }).catch(() => {});
        } else {
          navigator.clipboard.writeText(window.location.href).then(() => alert('Lien copié dans le presse-papiers — partagez-le !'));
        }
      } catch (err) { console.warn('⚠️ Erreur partage :', err); }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', e => {
      if (!isPremiumUser) { e.preventDefault(); alert('🔐 L\'accès à cette fonction est réservé aux utilisateurs inscrits.'); return; }
      // normal login flow
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener('click', e => {
      if (!isPremiumUser) { e.preventDefault(); alert('🔐 Inscription limitée depuis la plateforme pour les visiteurs non abonnés.'); return; }
      // normal signup flow
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => { e.preventDefault(); performLogout(); });
  }

});

// -----------------------------
// Expose helpers globalement pour debug
// -----------------------------
window.__brainova = window.__brainova || {};
window.__brainova.forcePremium = function () { localStorage.setItem('brainova_premium', 'true'); sessionStorage.setItem('brainova_user_status', 'premium'); setCookie('brainova_user_status', 'premium', 365); location.reload(); };
window.__brainova.forceFree = function () { localStorage.removeItem('brainova_premium'); sessionStorage.setItem('brainova_user_status', 'free'); setCookie('brainova_user_status', 'free', 365); location.reload(); };
window.__brainova.logout = performLogout;

console.log('✅ brainova-access v2.4.4 chargé.');
