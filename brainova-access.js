/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.6.5-FINAL
   ===========================================================
   ✅ Corrige l'appel 404 à /api/check-premium (Netlify functions)
   ✅ Corrige "Cannot access 'isPremium' before initialization"
   ✅ Synchronisation propre du statut Premium
   ✅ Nettoyage complet des sessions à la déconnexion
   =========================================================== */

(function(window, document){
  'use strict';
  console.log('🚀 Brainova Access v2.6.5-FINAL initialisé');

  // --------------------------
  // 🔐 Utilitaires cookies
  // --------------------------
  function setCookie(name, value, days){
    let expires = '';
    if (days){
      const d = new Date();
      d.setTime(d.getTime() + days*24*60*60*1000);
      expires = '; expires=' + d.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value||'') + expires + '; path=/';
  }

  function getCookie(name){
    const m = document.cookie.match(new RegExp('(^| )'+name+'=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  }

  // --------------------------
  // 🔓 Déconnexion complète
  // --------------------------
  function performLogout(){
    try {
      Object.keys(localStorage).forEach(k=>{
        if(k.startsWith('brainova_')) localStorage.removeItem(k);
      });
      localStorage.removeItem('brainova_premium');
      localStorage.removeItem('brainova_expiry');
      localStorage.removeItem('brainova_premium_status');
      sessionStorage.clear();
      document.cookie = 'brainova_user_status=; Max-Age=0; path=/';
      console.log('👋 Déconnexion complète exécutée.');
      window.location.href = '/';
    } catch(e){
      console.error('❌ Erreur logout:', e);
      window.location.reload();
    }
  }

  // --------------------------
  // 💎 Détection & sync Premium
  // --------------------------
  async function syncPremiumStatus(){
    try {
      // ✅ Correction du chemin Netlify
      const res = await fetch('/.netlify/functions/check-premium', { cache: 'no-store' });
      if (!res.ok) throw new Error('Serveur non disponible');
      const data = await res.json();
      console.log('💎 isPremiumUser (backend) =', data.isPremium);
      if (data.isPremium){
        localStorage.setItem('brainova_premium', 'true');
        sessionStorage.setItem('brainova_user_status','premium');
        setCookie('brainova_user_status','premium',365);
        return true;
      } else {
        localStorage.removeItem('brainova_premium');
        sessionStorage.setItem('brainova_user_status','free');
        setCookie('brainova_user_status','free',365);
        return false;
      }
    } catch(e){
      console.warn('⚠️ Erreur syncPremiumStatus:', e);
      return false;
    }
  }

  function detectPremium(){
    if (window.userIsPremium !== undefined) return !!window.userIsPremium;
    if (localStorage.getItem('brainova_premium')==='true') return true;
    if (sessionStorage.getItem('brainova_user_status')==='premium') return true;
    if (getCookie('brainova_user_status')==='premium') return true;
    return false;
  }

  // --------------------------
  // 🎨 UI Helpers
  // --------------------------
  function enableShareButton(shareBtn){
    if (!shareBtn) return;
    shareBtn.style.display='inline-block';
    shareBtn.style.pointerEvents='auto';
    shareBtn.style.opacity='1';
  }

  function disableShareButton(shareBtn){
    if (!shareBtn) return;
    shareBtn.style.display='inline-block';
    shareBtn.style.pointerEvents='none';
    shareBtn.style.opacity='0.5';
  }

  function lockCard(card){
    if(!card) return;
    card.classList.add('locked');
    card.style.opacity='0.7';
    if(!card.querySelector('.lock-icon')){
      const lock=document.createElement('div');
      lock.className='lock-icon';
      lock.textContent='🔒';
      lock.style.cssText='position:absolute;top:10px;right:10px;font-size:22px;color:#ff5252;z-index:5;';
      card.appendChild(lock);
    }
    if(!card.dataset.clickBound){
      card.addEventListener('click', e=>{
        e.preventDefault();
        alert('🔒 Ce jeu est réservé aux abonnés Premium.\nAbonnez-vous pour y accéder !');
      });
      card.dataset.clickBound='true';
    }
  }

  function unlockCard(card,isPremiumGame){
    if(!card) return;
    card.classList.remove('locked');
    card.style.opacity='1';
    const lock=card.querySelector('.lock-icon');
    if(lock) lock.remove();
    if(isPremiumGame){
      card.style.outline='3px solid #FFD700';
      card.style.boxShadow='0 0 12px rgba(255,215,0,0.7)';
    }
  }

  // --------------------------
  // 🧠 Initialisation principale
  // --------------------------
  document.addEventListener('DOMContentLoaded', async ()=>{
    console.log('Brainova v2.6.5-FINAL DOM ready');

    const cards = document.querySelectorAll('.card');
    const premiumBtn = document.getElementById('premiumBtn');
    const shareBtn = document.getElementById('shareBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    let isPremiumUser = detectPremium();

    // ✅ Vérifie toutes les 2h
    const now = Date.now();
    const last = parseInt(localStorage.getItem('brainova_last_sync')||'0',10);
    const hoursSince = (now-last)/(1000*60*60);
    if (isNaN(hoursSince) || hoursSince > 2){
      const ok = await syncPremiumStatus();
      if (ok) isPremiumUser = true;
      localStorage.setItem('brainova_last_sync', Date.now().toString());
    }

    console.log('💎 Statut Premium détecté =', isPremiumUser);

    // 🔒 Gestion des jeux
    cards.forEach((card,i)=>{
      const num = i+1;
      const isPremiumGame = num > 10;
      if(isPremiumGame && !isPremiumUser) lockCard(card);
      else unlockCard(card,isPremiumGame);
    });

    // 🎛️ Boutons
    if (isPremiumUser){
      if (premiumBtn) premiumBtn.style.display='none';
      enableShareButton(shareBtn); // Partager accessible uniquement pour premium
      if (loginBtn){ loginBtn.style.opacity='1'; loginBtn.style.pointerEvents='auto'; }
      if (signupBtn){ signupBtn.style.opacity='1'; signupBtn.style.pointerEvents='auto'; }
      if (logoutBtn){ logoutBtn.style.display='inline-block'; }
    } else {
      if (premiumBtn) premiumBtn.style.display='inline-block';
      disableShareButton(shareBtn); // Partager désactivé pour non-premium
      if (loginBtn){ loginBtn.style.opacity='0.5'; loginBtn.style.pointerEvents='none'; }
      if (signupBtn){ signupBtn.style.opacity='0.5'; signupBtn.style.pointerEvents='none'; }
      if (logoutBtn){ logoutBtn.style.display='none'; }
    }

    // 🔗 Événements boutons
    if (premiumBtn) premiumBtn.addEventListener('click', ()=>{ window.scrollTo({top:0,behavior:'smooth'}); });
    if (shareBtn){
      shareBtn.addEventListener('click', ()=>{
        if (shareBtn.style.pointerEvents==='none') return;
        try{
          if (navigator.share){
            navigator.share({ title: document.title, text: 'Découvrez Brainova', url: window.location.href });
          } else {
            navigator.clipboard.writeText(window.location.href)
              .then(()=>alert('Lien copié dans le presse-papiers ✅'));
          }
        }catch(err){ console.warn('⚠️ Erreur partage:', err); }
      });
    }
    if (logoutBtn) logoutBtn.addEventListener('click', performLogout);

  });

  // --------------------------
  // 🧩 Debug manuel
  // --------------------------
  window.__brainova = window.__brainova || {};
  window.__brainova.forcePremium = function(){
    localStorage.setItem('brainova_premium','true');
    sessionStorage.setItem('brainova_user_status','premium');
    setCookie('brainova_user_status','premium',365);
    location.reload();
  };
  window.__brainova.forceFree = function(){
    localStorage.removeItem('brainova_premium');
    sessionStorage.setItem('brainova_user_status','free');
    setCookie('brainova_user_status','free',365);
    location.reload();
  };

})(window, document);
