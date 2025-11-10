
// ===========================================================
// 🧩 BRAINOVA ACCESS CONTROL – CENTRALIZED PREMIUM SYSTEM v2.7
// ===========================================================
// ✅ Stripe + Email + Premium centralisés ici (Netlify compatible)
// ✅ Correction double chargement / bordures / boutons (stabilité complète)
// ===========================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Brainova Access v2.7 loaded — Mode centralisé");

  const premiumBtn = document.getElementById("premiumBtn");
  const shareBtn = document.getElementById("shareBtn");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const isPremium = localStorage.getItem("brainova_premium") === "true";
  const userEmail = localStorage.getItem("brainova_user_email");

  if (isPremium) {
    console.log("💎 Premium local détecté");
    activerModePremium();
  } else {
    console.log("🟡 Mode gratuit — jeux Premium verrouillés");
    verrouillerJeux();
  }

  premiumBtn?.addEventListener("click", async () => {
    if (!userEmail) {
      alert("Veuillez vous connecter avant de vous abonner.");
      return;
    }
    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "price_1SQPWLP5iQ9gRxAtJ6zvc3fa",
          successUrl: window.location.origin + "/?premium=1",
          cancelUrl: window.location.origin + "/?canceled=1",
          customerEmail: userEmail,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("❌ Erreur lors de la création de la session Stripe.");
    } catch (e) {
      console.error("⚠️ Erreur Stripe:", e);
      alert("Impossible de contacter Stripe.");
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("premium") === "1") {
    console.log("🎉 Activation automatique du mode Premium");
    localStorage.setItem("brainova_premium", "true");
    localStorage.setItem("brainova_premium_status", "active");
    localStorage.setItem("brainova_premium_source", "stripe_payment");
    activerModePremium();
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  shareBtn?.addEventListener("click", () => {
    if (!navigator.share) {
      navigator.clipboard.writeText(window.location.href);
      alert("🔗 Lien copié !");
    } else {
      navigator.share({
        title: "Brainova – Jeux intelligents",
        text: "Découvre Brainova Premium 🎮",
        url: window.location.href,
      });
    }
  });

  logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    alert("Déconnexion réussie !");
    window.location.reload();
  });

  function activerModePremium() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, i) => {
      const lock = card.querySelector(".lock-icon");
      if (lock) lock.remove();
      card.style.opacity = "1";
      if (i >= 10) {
        card.style.outline = "3px solid #FFD700";
        card.style.boxShadow = "0 0 12px rgba(255,215,0,0.7)";
      }
    });

    if (premiumBtn) premiumBtn.style.display = "none";
    if (shareBtn) shareBtn.style.pointerEvents = "none";
    if (loginBtn) loginBtn.style.opacity = "1";
    if (signupBtn) signupBtn.style.opacity = "1";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    afficherBanniere("💎 Accès Premium activé — Tous les jeux sont débloqués !");
  }

  function verrouillerJeux() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, i) => {
      if (i >= 10) {
        card.style.opacity = "0.6";
        if (!card.querySelector(".lock-icon")) {
          const lock = document.createElement("div");
          lock.className = "lock-icon";
          lock.textContent = "🔒";
          lock.style.cssText =
            "position:absolute;top:10px;right:10px;font-size:22px;color:#ff5252;z-index:5;";
          card.appendChild(lock);
        }
      }
    });
    if (logoutBtn) logoutBtn.style.display = "none";
  }

  function afficherBanniere(message) {
    const banner = document.createElement("div");
    banner.textContent = message;
    banner.style.cssText =
      "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#ffe259,#ffa751);color:#111;font-weight:bold;padding:12px 20px;border-radius:22px;box-shadow:0 0 15px rgba(255,215,0,0.5);z-index:9999;";
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
  }
});
