/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.6-FINAL
   ===========================================================
   ✅ Corrigée pour compatibilité complète avec index.html Brainova
   ✅ Évite tout conflit global avec la variable `isPremium`
   ✅ Respecte la logique des boutons selon statut réel utilisateur
   ✅ Ne modifie pas d’autres scripts (Firebase / auth / index.html)
   ✅ Inclut une déconnexion complète + gestion cookies/sessions
   =========================================================== */

(function(window, document) {
  'use strict';
  console.log('🚀 Brainova Access v2.6-FINAL initialisé');

  // -----------------------------------------
  // 🔹 UTILITAIRES COOKIES / STORAGE
  // -----------------------------------------
  function setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value || '') + expires + '; path=/';
  }
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  function deleteCookie(name) {
    document.cookie = name + '=; Max-Age=0; path=/';
  }

  // Déconnexion complète
  function performLogout() {
    console.log('🔒 Déconnexion Brainova...');
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('brainova_')) localStorage.removeItem(k);
      });
      sessionStorage.clear();
      deleteCookie('brainova_user_status');
      window.location.href = '/';
    } catch (e) {
      console.error('❌ Erreur déconnexion :', e);
      window.location.reload();
    }
  }

  // -----------------------------------------
  // 🔹 DÉTECTION DU STATUT UTILISATEUR
  // -----------------------------------------
  function detectPremium() {
    // Vérifie si l’index.html ou Firebase a déjà défini un statut
    if (window.userIsPremium !== undefined) return !!window.userIsPremium;
    if (localStorage.getItem('brainova_premium') === 'true') return true;
    if (sessionStorage.getItem('brainova_user_status') === 'premium') return true;
    if (getCookie('brainova_user_status') === 'premium') return true;
    return false;
  }

  async function syncPremiumStatus() {
    try {
      const res = await fetch('/.netlify/functions/verify-premium', { cache: 'no-store' });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.active) {
        localStorage.setItem('brainova_premium', 'true');
        sessionStorage.setItem('brainova_user_status', 'premium');
        setCookie('brainova_user_status', 'premium', 365);
        return true;
      } else {
        localStorage.removeItem('brainova_premium');
        sessionStorage.setItem('brainova_user_status', 'free');
        setCookie('brainova_user_status', 'free', 365);
        return false;
      }
    } catch (e) {
      console.warn('⚠️ Erreur syncPremiumStatus:', e);
      return false;
    }
  }

  // -----------------------------------------
  // 🔹 UI HELPERS
  // -----------------------------------------
  function setElementState(el, { visible = true, enabled = true } = {}) {
    if (!el) return;
    el.style.display = visible ? 'inline-block' : 'none';
    el.style.pointerEvents = enabled ? 'auto' : 'none';
    el.style.opacity = enabled ? '1' : '0.5';
  }

  function lockCard(card) {
    if (!card) return;
    card.classList.add('locked');
    card.style.opacity = '0.7';
    if (!card.querySelector('.lock-icon')) {
      const lock = document.createElement('div');
      lock.className = 'lock-icon';
      lock.textContent = '🔒';
      lock.style.cssText = 'position:absolute;top:10px;right:10px;font-size:22px;color:#ff5252;z-index:5;';
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
    if (isPremiumGame) {
      card.style.outline = '3px solid #FFD700';
      card.style.boxShadow = '0 0 12px rgba(255,215,0,0.7)';
    }
  }

  // -----------------------------------------
  // 🔹 INITIALISATION PRINCIPALE
  // -----------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Brainova v2.6-FINAL — Initialisation DOM...');

    const cards = document.querySelectorAll('.card');
    const premiumBtn = document.getElementById('premiumBtn');
    const shareBtn = document.getElementById('shareBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Détection du statut (local ou depuis index)
    let isPremiumUser = detectPremium();

    // Vérifie si besoin de resynchroniser via Netlify
    const now = Date.now();
    const lastSync = parseInt(localStorage.getItem('brainova_last_sync') || '0');
    const hoursSince = (now - lastSync) / (1000 * 60 * 60);
    if (isNaN(hoursSince) || hoursSince > 2) {
      const verified = await syncPremiumStatus();
      if (verified) isPremiumUser = true;
      localStorage.setItem('brainova_last_sync', Date.now().toString());
    }

    console.log(isPremiumUser ? '💎 Mode Premium détecté' : '🟡 Mode non abonné — jeux verrouillés');

    // ----- GESTION DES JEUX -----
    cards.forEach((card, i) => {
      const num = i + 1;
      const isPremiumGame = num > 10;
      if (isPremiumGame && !isPremiumUser) lockCard(card); else unlockCard(card, isPremiumGame);
    });

    // ----- GESTION DES BOUTONS -----
    if (isPremiumUser) {
      // Après abonnement — jeux accessibles
      setElementState(premiumBtn, { visible: false });
      setElementState(shareBtn, { visible: true, enabled: false }); // Partager désactivé
      setElementState(loginBtn, { visible: true, enabled: true });
      setElementState(signupBtn, { visible: true, enabled: true });
      setElementState(logoutBtn, { visible: true, enabled: true });
    } else {
      // Avant abonnement — jeux verrouillés
      setElementState(premiumBtn, { visible: true, enabled: true });
      setElementState(shareBtn, { visible: true, enabled: true }); // Partager actif ✅
      setElementState(loginBtn, { visible: true, enabled: false });
      setElementState(signupBtn, { visible: true, enabled: false });
      setElementState(logoutBtn, { visible: false });
    }

    // ----- ACTIONS -----
    if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); performLogout(); });

    if (shareBtn) {
      shareBtn.addEventListener('click', e => {
        if (!shareBtn.style.pointerEvents || shareBtn.style.pointerEvents === 'none') return;
        try {
          if (navigator.share) {
            navigator.share({ title: 'Brainova', text: 'Découvrez Brainova', url: window.location.href });
          } else {
            navigator.clipboard.writeText(window.location.href).then(() => alert('Lien copié dans le presse-papiers ✅'));
          }
        } catch (err) {
          console.warn('⚠️ Erreur partage :', err);
        }
      });
    }

    if (premiumBtn) premiumBtn.addEventListener('click', e => { e.preventDefault(); window.location.href = '/pricing.html'; });

  });

  // Expose utilitaires debug
  window.__brainova = {
    logout: performLogout,
    detectPremium: detectPremium,
    syncPremiumStatus: syncPremiumStatus
  };

})(window, document);
