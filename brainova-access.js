/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v1.0
   🔹 Gestion automatique des accès Jeux (Gratuits / Premium)
   🔹 Compatible Stripe + Netlify
   🔹 Auteur : GPT-5 Assistant
   =========================================================== */

console.log("🚀 Initialisation du module Brainova Access...");

// 🎯 Détection du statut Premium
const isPremiumUser =
  localStorage.getItem("brainova_premium") === "true" ||
  sessionStorage.getItem("brainova_user_status") === "premium" ||
  document.cookie.includes("brainova_user_status=premium");

document.addEventListener("DOMContentLoaded", () => {
  console.log(isPremiumUser ? "🎮 Mode Premium actif" : "🟡 Mode Gratuit");

  // Sélection de toutes les cartes de jeux
  const cards = document.querySelectorAll(".card");

  if (!cards.length) {
    console.warn("⚠️ Aucune carte détectée dans la page.");
    return;
  }

  // 🔁 Boucle sur les cartes
  cards.forEach((card, index) => {
    const num = index + 1; // numéro de la carte (1 à 36)

    // Définition automatique du type de jeu
    const isPremiumGame = num > 10; // Jeux 1 à 10 = gratuit ; 11 à 36 = premium

    if (isPremiumGame && !isPremiumUser) {
      // 🔒 Verrouiller les jeux Premium
      card.classList.add("locked");
      card.style.opacity = "0.7";
      card.style.position = "relative";

      // Ajouter l'icône de verrouillage si absente
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

      // Bloquer le clic
      card.addEventListener("click", (e) => {
        e.preventDefault();
        alert("🔒 Ce jeu est réservé aux abonnés Premium.\nAbonnez-vous pour y accéder !");
      });

      console.log(`🟣 Carte ${num} — Premium verrouillée`);
    } else {
      // ✅ Débloquer les jeux gratuits ou Premium (si abonné)
      card.classList.remove("locked");
      card.style.opacity = "1";
      const lock = card.querySelector(".lock-icon");
      if (lock) lock.remove();

      console.log(`🟢 Carte ${num} — ${isPremiumGame ? "Premium" : "Gratuit"} accessible`);
    }
  });

  // 🎛️ Gestion des boutons selon le statut
  const premiumBtn = document.getElementById("premiumBtn");
  const shareBtn = document.getElementById("shareBtn");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  if (isPremiumUser) {
    // Cache les boutons inutiles pour Premium
    if (premiumBtn) premiumBtn.style.display = "none";
    if (shareBtn) shareBtn.style.display = "none";

    // Rendre accessibles les boutons Connexion / Inscription
    [loginBtn, signupBtn].forEach((btn) => {
      if (btn) {
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
      }
    });

    // Afficher une bannière de confirmation
    const banner = document.createElement("div");
    banner.textContent = "🎉 Mode Premium activé — tous les jeux sont débloqués !";
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
      animation:fadeIn 1s ease-in-out;
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 4000);
  } else {
    console.log("🟠 Mode Gratuit : seuls les 10 premiers jeux sont disponibles.");
  }
});
