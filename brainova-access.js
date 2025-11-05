/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.2 (Production Stable)
   🔹 Gestion automatique des accès Jeux (Gratuits / Premium)
   🔹 Synchronisation automatique du statut utilisateur
   🔹 Séquencement DOM → Statut → Déverrouillage
   🔹 Empêche les incohérences de rendu (double sync / couleurs)
   🔹 Compatible Stripe + Netlify + Brevo
   🔹 Auteur : GPT-5 Assistant (Production Brainova)
   =========================================================== */

console.log("🚀 Initialisation du module Brainova Access v2.2...");

// 🧩 Neutralisation automatique des variables locales "isPremium" dans les jeux
try {
  const scripts = document.querySelectorAll("script");
  scripts.forEach(s => {
    if (s.textContent.includes("let isPremium")) {
      s.textContent = s.textContent.replace(/let\s+isPremium\s*=\s*(true|false)\s*;?/g, "");
      console.warn("⚙️ Neutralisation d'une variable isPremium locale (prévention de conflit).");
    }
  });
} catch (err) {
  console.error("❌ Erreur suppression isPremium :", err.message);
}

// ⚙️ Lecture du statut Premium local
let isPremiumUser =
  localStorage.getItem("brainova_premium") === "true" ||
  sessionStorage.getItem("brainova_user_status") === "premium" ||
  document.cookie.includes("brainova_user_status=premium");

// 🕒 Intervalle de resynchronisation (toutes les 2 heures)
const SYNC_INTERVAL_HOURS = 2;
const LAST_SYNC_KEY = "brainova_last_sync";

// 🔁 Synchronisation automatique avec API Netlify (mock / future réelle)
async function syncPremiumStatus() {
  console.log("🔄 Vérification du statut Premium via API...");

  try {
    const response = await fetch("/.netlify/functions/verify-premium", { method: "GET" });

    if (response.ok) {
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
    console.error("❌ Erreur lors de la synchronisation Premium :", err.message);
  }
}

// 🧭 Lancement à chaque chargement de page
document.addEventListener("DOMContentLoaded", async () => {
  console.log(isPremiumUser ? "🎮 Mode Premium détecté" : "🟡 Mode Gratuit détecté");

  // 🕒 Attendre que le DOM (grille de jeux) soit prêt avant déverrouillage
  await new Promise(r => setTimeout(r, 800));

  const cards = document.querySelectorAll(".card");
  if (!cards.length) {
    console.warn("⚠️ Aucune carte détectée dans la page.");
    return;
  }

  // 🔁 Resynchronisation si dernière vérification trop ancienne
  const now = Date.now();
  const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || "0", 10);
  const hoursSinceLastSync = (now - lastSync) / (1000 * 60 * 60);
  if (hoursSinceLastSync > SYNC_INTERVAL_HOURS) await syncPremiumStatus();

  // 🧱 Définir le statut global JS
  window.userPremiumStatus = isPremiumUser;

  // 🎮 Gestion des cartes (1–10 = gratuits / 11–36 = premium)
  cards.forEach((card, index) => {
    const num = index + 1;
    const isPremiumGame = num > 10;

    if (isPremiumGame && !isPremiumUser) {
      // 🔒 Verrouillage Premium
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
          font-size:22px;
          color:#ff5252;
          text-shadow:0 0 5px rgba(0,0,0,0.4);
        `;
        card.appendChild(lock);
      }

      card.addEventListener("click", (e) => {
        e.preventDefault();
        alert("🔒 Ce jeu est réservé aux abonnés Premium.\nAbonnez-vous pour y accéder !");
      });

      console.log(`🟣 Carte ${num} — Premium verrouillée`);
    } else {
      // ✅ Accès libre ou Premium actif
      card.classList.remove("locked");
      card.style.opacity = "1";
      const lock = card.querySelector(".lock-icon");
      if (lock) lock.remove();
      console.log(`🟢 Carte ${num} — ${isPremiumGame ? "Premium" : "Gratuit"} accessible`);
    }
  });

  // 🎛️ Gestion des boutons
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

    // 🔔 Bannière (affichée une seule fois)
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
        padding:12px 30px;
        border-radius:12px;
        font-weight:bold;
        box-shadow:0 4px 15px rgba(0,0,0,0.4);
        z-index:9999;
      `;
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 5000);
    }
  } else {
    console.log("🟠 Mode Gratuit : seuls les 10 premiers jeux sont disponibles.");
    if (shareBtn) {
      shareBtn.style.pointerEvents = "none";
      shareBtn.style.opacity = "0.5";
    }
  }
});
