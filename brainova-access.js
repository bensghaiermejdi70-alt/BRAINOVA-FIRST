/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.4.1 (Stable Fix Access)
   🔹 Même design que v2.4 (bordure jaune Premium)
   🔹 Correction du déverrouillage automatique après paiement
   🔹 Synchronisation fiable avec success.html + localStorage
   🔹 Aucune modification visuelle
   =========================================================== */

console.log("🚀 Initialisation du module Brainova Access v2.4.1...");

// --- Neutralisation des variables locales "isPremium" ---
try {
  document.querySelectorAll("script").forEach(s => {
    if (s.textContent.includes("let isPremium")) {
      s.textContent = s.textContent.replace(/let\s+isPremium\s*=\s*(true|false)\s*;?/g, "");
      console.warn("⚙️ Neutralisation d'une variable isPremium locale.");
    }
  });
} catch (e) {
  console.error("❌ Erreur neutralisation isPremium :", e.message);
}

// --- Détection du statut Premium ---
let isPremiumUser =
  localStorage.getItem("brainova_premium") === "true" ||
  sessionStorage.getItem("brainova_user_status") === "premium" ||
  document.cookie.includes("brainova_user_status=premium");

// --- Synchronisation auto toutes les 2h ---
const SYNC_INTERVAL_HOURS = 2;
const LAST_SYNC_KEY = "brainova_last_sync";

// --- Vérification via Netlify ---
async function syncPremiumStatus() {
  console.log("🔄 Vérification du statut Premium via API...");
  try {
    const res = await fetch("/.netlify/functions/verify-premium");
    if (!res.ok) return;
    const data = await res.json();

    if (data.active) {
      localStorage.setItem("brainova_premium", "true");
      localStorage.setItem("brainova_premium_status", "confirmed");
      sessionStorage.setItem("brainova_user_status", "premium");
      document.cookie = "brainova_user_status=premium; path=/; max-age=31536000";
      isPremiumUser = true;
    } else {
      localStorage.removeItem("brainova_premium");
      localStorage.removeItem("brainova_premium_status");
      sessionStorage.removeItem("brainova_user_status");
      document.cookie = "brainova_user_status=free; path=/; max-age=31536000";
      isPremiumUser = false;
    }

    localStorage.setItem(LAST_SYNC_KEY, Date.now());
  } catch (e) {
    console.warn("⚠️ Erreur de synchronisation :", e.message);
  }
}

// --- Bordure jaune Premium ---
function applyPremiumBorder(card) {
  if (!card) return;
  card.style.outline = "3px solid #FFD700";
  card.style.outlineOffset = "2px";
  card.style.boxShadow = "0 0 12px rgba(255,215,0,0.7)";
  card.dataset.premiumStyled = "true";
}

// --- Verrouillage ---
function lockCard(card) {
  if (!card) return;
  card.classList.add("locked");
  card.style.opacity = "0.7";
  card.style.position = "relative";

  if (!card.querySelector(".lock-icon")) {
    const lock = document.createElement("div");
    lock.className = "lock-icon";
    lock.textContent = "🔒";
    lock.style.cssText = `
      position:absolute;top:10px;right:10px;
      font-size:22px;color:#ff5252;
      text-shadow:0 0 4px rgba(0,0,0,0.4);
      font-family:sans-serif;z-index:5;
    `;
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

// --- Déverrouillage ---
function unlockCard(card, isPremiumGame) {
  if (!card) return;
  card.classList.remove("locked");
  card.style.opacity = "1";
  const lock = card.querySelector(".lock-icon");
  if (lock) lock.remove();
  if (isPremiumGame) applyPremiumBorder(card);
}

// --- Initialisation principale ---
document.addEventListener("DOMContentLoaded", async () => {
  console.log(isPremiumUser ? "🎮 Mode Premium détecté" : "🟡 Mode Gratuit détecté");

  // Petit délai pour garantir le rendu complet
  await new Promise(r => setTimeout(r, 1000));

  const cards = document.querySelectorAll(".card");
  if (!cards.length) {
    console.warn("⚠️ Aucune carte détectée.");
    return;
  }

  // Synchronisation périodique
  const now = Date.now();
  const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || "0");
  const hoursSince = (now - lastSync) / (1000 * 60 * 60);
  if (hoursSince > SYNC_INTERVAL_HOURS) await syncPremiumStatus();

  // 🧩 Correction clé : forcer le statut Premium après paiement
  const queryParams = new URLSearchParams(window.location.search);
  if (queryParams.has("premium=1")) {
    console.log("🎯 Détection de retour paiement : activation Premium forcée");
    localStorage.setItem("brainova_premium", "true");
    sessionStorage.setItem("brainova_user_status", "premium");
    document.cookie = "brainova_user_status=premium; path=/; max-age=31536000";
    isPremiumUser = true;
  }

  // Gestion des cartes
  cards.forEach((card, i) => {
    const num = i + 1;
    const isPremiumGame = num > 10;
    if (isPremiumGame && !isPremiumUser) {
      lockCard(card);
      console.log(`🟣 Carte ${num} verrouillée (Premium)`);
    } else {
      unlockCard(card, isPremiumGame);
      console.log(`🟢 Carte ${num} ${isPremiumGame ? "Premium" : "Gratuit"} accessible`);
    }
  });

  // Boutons
  const premiumBtn = document.getElementById("premiumBtn");
  const shareBtn = document.getElementById("shareBtn");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  if (isPremiumUser) {
    if (premiumBtn) premiumBtn.style.display = "none";
    if (shareBtn) {
      shareBtn.style.display = "inline-block";
      shareBtn.style.pointerEvents = "auto";
      shareBtn.style.opacity = "1";
    }
    [loginBtn, signupBtn].forEach(btn => {
      if (btn) {
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
      }
    });

    if (!sessionStorage.getItem("bannerShown")) {
      const banner = document.createElement("div");
      banner.id = "premium-banner";
      banner.textContent = "🎉 Mode Premium synchronisé — accès complet confirmé !";
      banner.style.cssText = `
        position:fixed;bottom:20px;left:50%;
        transform:translateX(-50%);
        background:linear-gradient(90deg,#00ff88,#00ccff);
        color:#000;padding:12px 24px;border-radius:12px;
        font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.4);
        z-index:9999;
      `;
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 4000);
      sessionStorage.setItem("bannerShown", "true");
    }
  } else {
    if (shareBtn) {
      shareBtn.style.pointerEvents = "none";
      shareBtn.style.opacity = "0.5";
    }
    if (premiumBtn) premiumBtn.style.display = "inline-block";
    console.log("🟠 Mode Gratuit actif — 10 jeux accessibles.");
  }
});
