/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.4.4 (Fix Share Button)
   ===========================================================
   🔧 Correction principale :
   → Le bouton “Partager” reste accessible lorsque les jeux sont verrouillés (avant abonnement)
   → Le bouton “Partager” devient inactif une fois l’utilisateur abonné Premium
   =========================================================== */

console.log("🚀 Initialisation du module Brainova Access v2.4.4 (Fix Share Button)...");

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
function performLogout() {
  console.log('🔒 Déconnexion complète...');
  localStorage.removeItem('brainova_premium');
  localStorage.removeItem('brainova_premium_status');
  localStorage.removeItem('brainova_last_sync');
  sessionStorage.removeItem('brainova_user_status');
  deleteCookie('brainova_user_status');
  window.location.href = '/';
}

// -----------------------------
// Détection du statut Premium
// -----------------------------
let isPremiumUser = false;
const LAST_SYNC_KEY = 'brainova_last_sync';
const SYNC_INTERVAL_HOURS = 2;

function detectPremiumFromStorages() {
  return localStorage.getItem('brainova_premium') === 'true' ||
         sessionStorage.getItem('brainova_user_status') === 'premium' ||
         getCookie('brainova_user_status') === 'premium';
}
function detectPremiumFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has('premium') && params.get('premium') === '1';
  } catch { return false; }
}
async function syncPremiumStatus() {
  try {
    const res = await fetch('/.netlify/functions/verify-premium', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (data.active) {
      localStorage.setItem('brainova_premium', 'true');
      sessionStorage.setItem('brainova_user_status', 'premium');
      setCookie('brainova_user_status', 'premium', 365);
      isPremiumUser = true;
    } else {
      localStorage.removeItem('brainova_premium');
      sessionStorage.setItem('brainova_user_status', 'free');
      setCookie('brainova_user_status', 'free', 365);
      isPremiumUser = false;
    }
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (e) {
    console.warn('⚠️ Erreur de sync verify-premium :', e.message);
  }
}

// -----------------------------
// UI helpers
// -----------------------------
function setElementState(el, { visible = true, enabled = true } = {}) {
  if (!el) return;
  el.style.display = visible ? "inline-block" : "none";
  el.style.pointerEvents = enabled ? "auto" : "none";
  el.style.opacity = enabled ? "1" : "0.5";
}
function applyPremiumBorder(card) {
  if (!card) return;
  card.style.outline = "3px solid #FFD700";
  card.style.boxShadow = "0 0 12px rgba(255,215,0,0.7)";
}
function lockCard(card) {
  if (!card) return;
  card.classList.add("locked");
  card.style.opacity = "0.7";
  if (!card.querySelector(".lock-icon")) {
    const lock = document.createElement("div");
    lock.className = "lock-icon";
    lock.textContent = "🔒";
    lock.style.cssText = `position:absolute;top:10px;right:10px;font-size:22px;color:#ff5252;z-index:5;`;
    card.appendChild(lock);
  }
  if (!card.dataset.clickBound) {
    card.addEventListener("click", e => {
      e.preventDefault();
      alert("🔒 Ce jeu est réservé aux abonnés Premium.\nAbonnez-vous pour y accéder !");
    });
    card.dataset.clickBound = "true";
  }
}
function unlockCard(card, isPremiumGame) {
  if (!card) return;
  card.classList.remove("locked");
  card.style.opacity = "1";
  const lock = card.querySelector(".lock-icon");
  if (lock) lock.remove();
  if (isPremiumGame) applyPremiumBorder(card);
}

// -----------------------------
// Initialisation principale
// -----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔧 Initialisation DOM — statut utilisateur...");

  await new Promise(r => setTimeout(r, 200));
  isPremiumUser = detectPremiumFromStorages() || detectPremiumFromQuery();

  const now = Date.now();
  const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || "0");
  const hoursSince = (now - lastSync) / (1000 * 60 * 60);
  if (hoursSince > SYNC_INTERVAL_HOURS) await syncPremiumStatus();

  console.log(isPremiumUser ? "🎮 Mode Premium détecté" : "🟡 Mode verrouillé — jeux non accessibles");

  // Jeux
  document.querySelectorAll(".card").forEach((card, i) => {
    const num = i + 1;
    const isPremiumGame = num > 10;
    if (isPremiumGame && !isPremiumUser) lockCard(card); else unlockCard(card, isPremiumGame);
  });

  // Boutons
  const premiumBtn = document.getElementById("premiumBtn");
  const shareBtn = document.getElementById("shareBtn");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (isPremiumUser) {
    // Après abonnement (jeux accessibles)
    setElementState(premiumBtn, { visible: false });
    setElementState(shareBtn, { visible: true, enabled: false }); // Partager grisé
    setElementState(loginBtn, { visible: true, enabled: true });
    setElementState(signupBtn, { visible: true, enabled: true });
    setElementState(logoutBtn, { visible: true, enabled: true });
  } else {
    // Avant abonnement (jeux verrouillés)
    setElementState(premiumBtn, { visible: true, enabled: true });
    setElementState(shareBtn, { visible: true, enabled: true }); // ✅ Partager actif
    setElementState(loginBtn, { visible: true, enabled: false });
    setElementState(signupBtn, { visible: true, enabled: false });
    setElementState(logoutBtn, { visible: false });
  }

  // Déconnexion
  if (logoutBtn) logoutBtn.addEventListener("click", e => {
    e.preventDefault();
    performLogout();
  });

  // Bouton Partager (comportement réel)
  if (shareBtn) {
    shareBtn.addEventListener("click", e => {
      try {
        if (navigator.share) {
          navigator.share({ title: document.title, text: "Découvrez Brainova", url: window.location.href });
        } else {
          navigator.clipboard.writeText(window.location.href).then(() => alert("Lien copié dans le presse-papiers ✅"));
        }
      } catch (err) {
        console.warn("⚠️ Erreur partage :", err);
      }
    });
  }
});
