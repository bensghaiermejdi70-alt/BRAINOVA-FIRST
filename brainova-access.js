/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.6.2
   ===========================================================
   ✅ Correctif demandé : lorsque la page affiche le "mode Premium" (jeux verrouillés),
     le bouton "Partager" DOIT être ACCESSIBLE (actif) et indiquer que les jeux sont verrouillés.
   ✅ Contexte : sur Brainova, "mode Premium" affiché AVANT abonnement signifie que les jeux
     sont verrouillés — le bouton Partager doit rester actif pour permettre la promotion.

   - Cette version :
     • Force le bouton "share" à être activé quand les jeux sont verrouillés.
     • Ne change pas le comportement du bouton après abonnement (il restera grisé).
     • N'introduit aucune variable globale nouvelle et reste compatible avec index.html/pricing.html.

   Déployer en remplacement de /brainova-access.js
   =========================================================== */

(function(window, document){
  'use strict';
  console.log('🚀 Brainova Access v2.6.2 initialisé (fix share active when locked)');

  function setCookie(name, value, days){
    let expires = '';
    if (days){ const d = new Date(); d.setTime(d.getTime() + days*24*60*60*1000); expires = '; expires=' + d.toUTCString(); }
    document.cookie = name + '=' + encodeURIComponent(value||'') + expires + '; path=/';
  }
  function getCookie(name){ const m = document.cookie.match(new RegExp('(^| )'+name+'=([^;]+)')); return m ? decodeURIComponent(m[2]) : null; }

  function performLogout(){ try{ Object.keys(localStorage).forEach(k=>{ if(k.startsWith('brainova_')) localStorage.removeItem(k); }); sessionStorage.clear(); document.cookie = 'brainova_user_status=; Max-Age=0; path=/'; window.location.href = '/'; } catch(e){ window.location.reload(); } }

  function detectPremium(){ if (window.userIsPremium !== undefined) return !!window.userIsPremium; if (localStorage.getItem('brainova_premium')==='true') return true; if (sessionStorage.getItem('brainova_user_status')==='premium') return true; if (getCookie('brainova_user_status')==='premium') return true; return false; }

  async function syncPremiumStatus(){ try{ const res = await fetch('/.netlify/functions/verify-premium',{cache:'no-store'}); if (!res.ok) return false; const data = await res.json(); if (data.active){ localStorage.setItem('brainova_premium','true'); sessionStorage.setItem('brainova_user_status','premium'); setCookie('brainova_user_status','premium',365); return true; } else { localStorage.removeItem('brainova_premium'); sessionStorage.setItem('brainova_user_status','free'); setCookie('brainova_user_status','free',365); return false; } } catch(e){ console.warn('sync err',e); return false; } }

  function enableShareButton(shareBtn){ if (!shareBtn) return; shareBtn.style.display = 'inline-block'; shareBtn.style.pointerEvents = 'auto'; shareBtn.style.opacity = '1'; }
  function disableShareButton(shareBtn){ if (!shareBtn) return; shareBtn.style.display = 'inline-block'; shareBtn.style.pointerEvents = 'none'; shareBtn.style.opacity = '0.5'; }

  function lockCard(card){ if(!card) return; card.classList.add('locked'); card.style.opacity='0.7'; if(!card.querySelector('.lock-icon')){ const lock=document.createElement('div'); lock.className='lock-icon'; lock.textContent='🔒'; lock.style.cssText='position:absolute;top:10px;right:10px;font-size:22px;color:#ff5252;z-index:5;'; card.appendChild(lock);} if(!card.dataset.clickBound){ card.addEventListener('click', e=>{ e.preventDefault(); alert('🔒 Ce jeu est réservé aux abonnés Premium. Abonnez-vous pour y accéder !'); }); card.dataset.clickBound='true'; } }
  function unlockCard(card,isPremiumGame){ if(!card) return; card.classList.remove('locked'); card.style.opacity='1'; const lock=card.querySelector('.lock-icon'); if(lock) lock.remove(); if(isPremiumGame){ card.style.outline='3px solid #FFD700'; card.style.boxShadow='0 0 12px rgba(255,215,0,0.7)'; } }

  document.addEventListener('DOMContentLoaded', async ()=>{
    console.log('Brainova v2.6.2 DOM ready');
    const cards = document.querySelectorAll('.card');
    const premiumBtn = document.getElementById('premiumBtn');
    const shareBtn = document.getElementById('shareBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    let isPremiumUser = detectPremium();
    // quick sync if stale
    const now = Date.now(); const last = parseInt(localStorage.getItem('brainova_last_sync')||'0',10); const hoursSince = (now-last)/(1000*60*60);
    if (isNaN(hoursSince) || hoursSince > 2){ const ok = await syncPremiumStatus(); if (ok) isPremiumUser = true; localStorage.setItem('brainova_last_sync', Date.now().toString()); }

    console.log('isPremiumUser=', isPremiumUser);

    // cards
    cards.forEach((card,i)=>{ const num=i+1; const isPremiumGame = num>10; if(isPremiumGame && !isPremiumUser) lockCard(card); else unlockCard(card,isPremiumGame); });

    // Buttons logic: CRITICAL CHANGE -> share active when games locked
    if (isPremiumUser){
      if (premiumBtn) premiumBtn.style.display='none';
      // user is subscribed -> share DISABLED
      disableShareButton(shareBtn);
      if (loginBtn) { loginBtn.style.opacity='1'; loginBtn.style.pointerEvents='auto'; }
      if (signupBtn) { signupBtn.style.opacity='1'; signupBtn.style.pointerEvents='auto'; }
      if (logoutBtn) { logoutBtn.style.display='inline-block'; }
    } else {
      // games locked (mode premium displayed) -> share MUST be ACTIVE
      if (premiumBtn) premiumBtn.style.display='inline-block';
      enableShareButton(shareBtn); // <<<< ensure active when locked
      if (loginBtn) { loginBtn.style.opacity='0.5'; loginBtn.style.pointerEvents='none'; }
      if (signupBtn) { signupBtn.style.opacity='0.5'; signupBtn.style.pointerEvents='none'; }
      if (logoutBtn) { logoutBtn.style.display='none'; }
    }

    // attach share behavior
    if (shareBtn) shareBtn.addEventListener('click', e=>{ if (shareBtn.style.pointerEvents === 'none') return; try{ if (navigator.share) navigator.share({ title: document.title, text: 'Découvrez Brainova', url: window.location.href }); else navigator.clipboard.writeText(window.location.href).then(()=>alert('Lien copié')); } catch(e){ console.warn(e); } });

    if (premiumBtn) premiumBtn.addEventListener('click', e=>{ e.preventDefault(); window.location.href='/pricing.html'; });
    if (logoutBtn) logoutBtn.addEventListener('click', e=>{ e.preventDefault(); performLogout(); });

  });

  // expose debug
  window.__brainova = window.__brainova || {};
  window.__brainova.forcePremium = function(){ localStorage.setItem('brainova_premium','true'); sessionStorage.setItem('brainova_user_status','premium'); setCookie('brainova_user_status','premium',365); location.reload(); };
  window.__brainova.forceFree = function(){ localStorage.removeItem('brainova_premium'); sessionStorage.setItem('brainova_user_status','free'); setCookie('brainova_user_status','free',365); location.reload(); };

})(window, document);
