/**
 * 🧠 Brainova - Gestion Automatique des Accès & Cartes
 * Version 5.1 - Simplifiée (affiche uniquement "Carte N°x")
 * ✅ Aucun changement dans les fichiers de jeux
 * ✅ Compatible Netlify Production
 */

(function() {
  console.log("🚀 Initialisation du module Brainova Access (mode cartes simples)...");

  // 🧭 Récupère le numéro du jeu depuis l’URL (ex: jeu12.html → 12)
  const url = window.location.href;
  const match = url.match(/jeu(\d+)\.html/i);
  const gameNumber = match ? parseInt(match[1]) : null;

  // 🧮 Détermine la catégorie
  const isPremiumGame = gameNumber && gameNumber >= 11 && gameNumber <= 36;
  const category = isPremiumGame ? "Premium" : "Gratuit";

  // 🧠 Vérifie le statut utilisateur
  const userIsPremium =
    localStorage.getItem("brainova_premium") === "true" ||
    sessionStorage.getItem("brainova_user_status") === "premium" ||
    document.cookie.includes("brainova_user_status=premium");

  // 🏷️ Affiche le titre automatique “Carte N°x”
  if (gameNumber) {
    const title = document.createElement("div");
    title.textContent = `🎮 Carte N°${gameNumber} — ${category}`;
    title.style.cssText = `
      position:fixed;top:15px;left:50%;transform:translateX(-50%);
      background:rgba(255,255,255,0.08);
      padding:8px 22px;border-radius:12px;color:#fff;
      font-family:Poppins,Arial,sans-serif;font-weight:bold;
      z-index:9999;backdrop-filter:blur(6px);
      box-shadow:0 2px 10px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(title);
  }

  // 🟢 Mode Premium
  if (userIsPremium) {
    console.log("🎮 Utilisateur Premium — accès total autorisé.");
    showBanner("✅ Mode Premium activé", "#00ff88");
    return;
  }

  // 🟡 Mode gratuit
  console.log("🟡 Mode gratuit détecté.");

  // 🔒 Si le jeu est Premium → bloquer
  if (isPremiumGame) {
    console.warn("⛔ Accès refusé — jeu Premium détecté.");

    const overlay = document.createElement("div");
    overlay.innerHTML = `
      <div style="
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.9);
        display:flex;flex-direction:column;justify-content:center;align-items:center;
        color:#fff;text-align:center;z-index:9999;padding:20px;
      ">
        <h2 style="color:#00ccff;">🔒 Jeu réservé aux abonnés Brainova Premium</h2>
        <p style="max-width:420px;">
          Cette carte fait partie des 26 jeux Premium exclusifs Brainova.<br>
          Abonnez-vous pour les débloquer dès maintenant !
        </p>
        <a href="https://brainovafirst.netlify.app" style="
          margin-top:20px;padding:12px 24px;background:#00ccff;
          color:#000;text-decoration:none;border-radius:10px;font-weight:bold;">
          🔓 Devenir Premium
        </a>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    console.log("🆓 Jeu gratuit — accès libre.");
    showBanner("🆓 Jeu gratuit - profitez-en !");                      
  }

  // 🎨 Fonction bannière en bas de page
  function showBanner(msg, color = "#00ccff") {
    const banner = document.createElement("div");
    banner.textContent = msg;
    banner.style.cssText = `
      position:fixed;bottom:15px;right:15px;
      background:${color};color:#000;
      padding:10px 18px;border-radius:10px;
      font-weight:bold;z-index:9999;
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 3000);
  }
})();
