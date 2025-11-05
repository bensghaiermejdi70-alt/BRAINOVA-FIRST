/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.3 (Production Stable)
   🔹 Ajout de gardes null-safe, idempotence, bordure jaune premium
   🔹 Empêche les erreurs "Cannot read properties of null"
   🔹 Compatible Stripe + Netlify + Brevo
   🔹 Auteur : GPT-5 Assistant (Production Brainova)
   =========================================================== */

console.log("🚀 Initialisation du module Brainova Access v2.3...");

// --------------------
// Neutralisation isPremium (prévention conflit)
try {
  const scripts = document.querySelectorAll("script");
  scripts.forEach(s => {
    if (s && s.textContent && s.textContent.includes("let isPremium")) {
      s.textContent = s.textContent.replace(/let\s+isPremium\s*=\s*(true|false)\s*;?/g, "");
      console.warn("⚙️ Neutralisation d'une variable isPremium locale (prévention de conflit).");
    }
  });
} catch (err) {
  console.error("❌ Erreur suppression isPremium :", err?.message || err);
}

// --------------------
// Lecture du statut Premium local
let isPremiumUser =
  localStorage.getItem("brainova_premium") === "true" ||
  sessionStorage.getItem("brainova_user_status") === "premium" ||
  document.cookie.includes("brainova_user_status=premium");

// Intervalle de resync
const SYNC_INTERVAL_HOURS = 2;
const LAST_SYNC_KEY = "brainova_last_sync";

// Fonction de synchronisation
async function syncPremiumStatus() {
  console.log("🔄 Vérification du statut Premium via API...");
  try {
    const response = await fetch("/.netlify/functions/verify-premium", { method: "GET" });
    if (response && response.ok) {
      const data = await response.json();
      if (data.active) {
        console.log("✅ Synchronisation : abonnement Premium actif.");
        localStorage.setItem("brainova_premium", "true");
        localStorage.setItem("brainova_premium_status", "confirmed");
        document.cookie = "brainova_user_status=premium; path=/; max-age=31536000";
        isPremiumUser = true;
      } else {
        console.log("🟡 Synchronisation : abonnement expiré ou inactif.");
        localStorage.removeItem("brainova_premium");
        localStorage.removeItem("brainova_premium_status");
        document.cookie = "brainova_user_status=free; path=/; max-age=31536000";
        isPremiumUser = false;
      }
      localStorage.setItem(LAST_SYNC_KEY, Date.now());
    } else {
      console.warn("⚠️ API Premium non atteinte (aucune mise à jour).");
    }
  } catch (err) {
    console.error("❌ Erreur lors de la synchronisation Premium :", err?.message || err);
  }
}

// Fonction utilitaire : applique le style "bordure jaune premium" quand accès donné
function applyPremiumBorder(card) {
  if (!card) return;
  // Eviter de ré-appliquer plusieurs fois
  if (card.dataset.brainovaBorderApplied === "true") return;
  // applique un contour/ombre jaune vif pour cartes premium accessibles
  card.style.boxShadow = "0 0 0 3px rgba(255, 200, 55, 0.9), 0 6px 18px rgba(0,0,0,0.15)";
  card.style.borderRadius = card.style.borderRadius || "12px";
  card.dataset.brainovaBorderApplied = "true";
}

// Fonction utilitaire : verrouille une carte (mode non-premium)
function lockCard(card) {
  if (!card) return;
  if (card.dataset.brainovaProcessed === "true") {
    // déjà initialisée : mettre à jour visuel seulement
    card.classList.add("locked");
    card.style.opacity = "0.7";
    return;
  }
  card.classList.add("locked");
  card.style.opacity = "0.7";
  card.style.position = "relative";
  if (!card.querySelector(".lock-icon")) {
    const lock = document.createElement("div");
    lock.className = "lock-icon";
    lock.textContent = "🔒";
    lock.style.cssText = `
      position:absolute;
      top:10px;
      right:10px;
      font-size:20px;
      color:#ff5252;
      text-shadow:0 0 5px rgba(0,0,0,0.4);
      z-index:10;
    `;
    card.appendChild(lock);
  }
  // Bloquer clic en ajoutant un handler idempotent
  if (!card.dataset.brainovaClickBound) {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      alert("🔒 Ce jeu est réservé aux abonnés Premium.\nAbonnez-vous pour y accéder !");
    });
    card.dataset.brainovaClickBound = "true";
  }
  card.dataset.brainovaProcessed = "true";
}

// Fonction utilitaire : unlock card
function unlockCard(card) {
  if (!card) return;
  card.classList.remove("locked");
  card.style.opacity = "1";
  const lock = card.querySelector(".lock-icon");
  if (lock) lock.remove();
  // applique bordure jaune premium (visuel)
  applyPremiumBorder(card);
  card.dataset.brainovaProcessed = "true";
}

// --------------------
// Main
document.addEventListener("DOMContentLoaded", async () => {
  console.log(isPremiumUser ? "🎮 Mode Premium détecté" : "🟡 Mode Gratuit détecté");

  // attendre rendu initial de la grille (sécurité contre renderGrid asynchrone)
  await new Promise(r => setTimeout(r, 750));

  const cards = document.querySelectorAll(".card");
  if (!cards || cards.length === 0) {
    console.warn("⚠️ Aucune carte détectée dans la page (grid non rendue).");
    return;
  }

  // Resynchronisation si nécessaire
  const now = Date.now();
  const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || "0", 10);
  const hoursSinceLastSync = (now - lastSync) / (1000 * 60 * 60);
  if (hoursSinceLastSync > SYNC_INTERVAL_HOURS) {
    await syncPremiumStatus();
  }

  // Mettre le statut global pour les autres scripts
  window.userPremiumStatus = isPremiumUser;

  // Parcours des cartes (1..N) — règles : 1-10 gratuit, 11-36 premium (adaptable)
  cards.forEach((card, index) => {
    if (!card) return; // garde safe
    const num = index + 1;
    const isPremiumGame = num > 10;

    try {
      if (isPremiumGame && !isPremiumUser) {
        lockCard(card);
        console.log(`🟣 Carte ${num} — Premium verrouillée`);
      } else {
        unlockCard(card);
        console.log(`🟢 Carte ${num} — ${isPremiumGame ? "Premium" : "Gratuit"} accessible`);
      }
    } catch (err) {
      console.error("❌ Erreur traitement carte:", err?.message || err);
    }
  });

  // Gestion boutons (safe checks)
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
    [loginBtn, signupBtn].forEach((btn) => {
      if (btn) {
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
      }
    });

    // Bannière unique (protection contre répétition)
    if (!document.querySelector("#premium-banner")) {
      const banner = document.createElement("div");
      banner.id = "premium-banner";
      banner.textContent = "🎉 Mode Premium synchronisé — accès complet confirmé !";
      banner.style.cssText = `
        position:fixed;
        bottom:20px;
        left:50%;
        transform:translateX(-50%);
        background:linear-gradient(90deg,#00ff88,#00ccff);
        color:#000;
        padding:12px 24px;
        border-radius:12px;
        font-weight:700;
        box-shadow:0 4px 15px rgba(0,0,0,0.4);
        z-index:9999;
      `;
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 5000);
    }
  } else {
    // mode gratuit
    console.log("🟠 Mode Gratuit : seuls les 10 premiers jeux sont disponibles.");
    if (shareBtn) {
      shareBtn.style.pointerEvents = "none";
      shareBtn.style.opacity = "0.5";
    }
    if (premiumBtn) premiumBtn.style.display = "inline-block";
  }
});
