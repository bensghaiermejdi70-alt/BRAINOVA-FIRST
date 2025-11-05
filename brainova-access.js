/* ===========================================================
   🌐 BRAINOVA ACCESS CONTROL SYSTEM – v2.6
   - Fix global name conflicts (isPremium) and TDZ ReferenceError
   - Robust verify-premium polling & UI update
   =========================================================== */
(function(window, document){
  'use strict';
  console.log('🚀 brainova-access v2.6 init (isolated scope)');

  // Expose small API on window.__brainova
  window.__brainova = window.__brainova || {};

  // ---------- Helpers ----------
  function setCookie(name, value, days){
    let expires = '';
    if (typeof days === 'number'){
      const d = new Date(); d.setTime(d.getTime() + days*24*60*60*1000);
      expires = '; expires=' + d.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value || '') + expires + '; path=/';
  }
  function getCookie(name){
    const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  }
  function deleteCookie(name){
    document.cookie = name + '=; Max-Age=0; path=/';
  }

  // Local unique flag (no global 'isPremium' name)
  const LOCAL_KEY = '__brainova_isPremiumUser';
  const LAST_SYNC_KEY = 'brainova_last_sync';
  const SYNC_INTERVAL_HOURS = 2;

  function setLocalPremium(flag){
    try {
      if (flag){
        localStorage.setItem('brainova_premium','true');
        sessionStorage.setItem('brainova_user_status','premium');
        setCookie('brainova_user_status','premium',365);
        window[LOCAL_KEY] = true;
      } else {
        localStorage.removeItem('brainova_premium');
        localStorage.removeItem('brainova_premium_status');
        sessionStorage.setItem('brainova_user_status','free');
        setCookie('brainova_user_status','free',365);
        window[LOCAL_KEY] = false;
      }
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch(e){
      console.warn('⚠️ setLocalPremium error', e);
    }
  }

  function detectPremiumLocal(){
    try {
      return localStorage.getItem('brainova_premium') === 'true'
        || sessionStorage.getItem('brainova_user_status') === 'premium'
        || getCookie('brainova_user_status') === 'premium'
        || !!window[LOCAL_KEY];
    } catch(e){
      return false;
    }
  }

  // verify-premium API call (Netlify function)
  async function verifyPremiumApi({ session_id=null, customer_email=null } = {}) {
    try {
      const qs = new URLSearchParams();
      if (session_id) qs.set('session_id', session_id);
      if (customer_email) qs.set('customer_email', customer_email);
      const url = '/.netlify/functions/verify-premium' + (qs.toString() ? ('?' + qs.toString()) : '');
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return { active: false, status: res.status };
      const json = await res.json();
      return json || { active: false };
    } catch (e){
      console.warn('⚠️ verifyPremiumApi error', e);
      return { active: false, error: e };
    }
  }

  async function pollVerify({ session_id=null, customer_email=null, retries=12, intervalMs=2000 } = {}){
    for (let i=0;i<retries;i++){
      const r = await verifyPremiumApi({ session_id, customer_email });
      if (r && r.active) return true;
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
  }

  // UI helpers
  function setElementState(el, { visible=true, enabled=true, display='inline-block' } = {}){
    if (!el) return;
    el.style.display = visible ? display : 'none';
    el.style.pointerEvents = enabled ? 'auto' : 'none';
    el.style.opacity = enabled ? '1' : '0.5';
  }

  function applyPremiumBorder(card){
    if (!card || card.dataset.premiumStyled === 'true') return;
    card.style.outline = '3px solid #FFD700';
    card.style.outlineOffset = '2px';
    card.style.boxShadow = '0 0 12px rgba(255,215,0,0.7)';
    card.dataset.premiumStyled = 'true';
  }
  function lockCard(card){
    if (!card) return;
    card.classList.add('locked');
    card.style.opacity = '0.7';
    card.style.position = 'relative';
    if (!card.querySelector('.lock-icon')){
      const lock = document.createElement('div');
      lock.className = 'lock-icon';
      lock.textContent = '🔒';
      lock.style.cssText = 'position:absolute;top:10px;right:10px;font-size:22px;color:#ff5252;text-shadow:0 0 4px rgba(0,0,0,0.4);z-index:5;';
      card.appendChild(lock);
    }
    if (!card.dataset.clickBound){
      card.addEventListener('click', e => { e.preventDefault(); alert('🔒 Ce jeu est réservé aux abonnés Premium.\\nAbonnez-vous pour y accéder !'); });
      card.dataset.clickBound = 'true';
    }
  }
  function unlockCard(card, isPremiumGame){
    if (!card) return;
    card.classList.remove('locked');
    card.style.opacity = '1';
    const lock = card.querySelector('.lock-icon'); if (lock) lock.remove();
    if (isPremiumGame) applyPremiumBorder(card);
  }

  function updateButtonsUIFromFlag(isPremium){
    const premiumBtn = document.getElementById('premiumBtn');
    const shareBtn = document.getElementById('shareBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (isPremium){
      setElementState(premiumBtn, { visible:false });
      setElementState(shareBtn, { visible:true, enabled:false });
      setElementState(loginBtn, { visible:true, enabled:true });
      setElementState(signupBtn, { visible:true, enabled:true });
      setElementState(logoutBtn, { visible:true, enabled:true });
    } else {
      setElementState(premiumBtn, { visible:true, enabled:true });
      setElementState(shareBtn, { visible:true, enabled:true });
      setElementState(loginBtn, { visible:true, enabled:false });
      setElementState(signupBtn, { visible:true, enabled:false });
      setElementState(logoutBtn, { visible:false });
    }
  }

  function showBannerOnce(){
    try {
      if (sessionStorage.getItem('bannerShown')) return;
      const banner = document.createElement('div');
      banner.id = 'premium-banner';
      banner.textContent = '🎉 Mode Premium synchronisé — accès complet confirmé !';
      banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#00ff88,#00ccff);color:#000;padding:12px 24px;border-radius:12px;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.4);z-index:9999;';
      document.body.appendChild(banner);
      setTimeout(()=>banner.remove(), 4000);
      sessionStorage.setItem('bannerShown','true');
    } catch(e) {}
  }

  // Logout
  function performLogout(){
    try {
      Object.keys(localStorage).forEach(k => { if (k && k.startsWith('brainova_')) localStorage.removeItem(k); });
      try{ sessionStorage.clear(); } catch(e){}
      deleteCookie('brainova_user_status');
      window[LOCAL_KEY] = false;
      location.href = '/';
    } catch(e){ location.reload(); }
  }

  // Save API on global object for debug
  window.__brainova.setLocalPremium = setLocalPremium;
  window.__brainova.performLogout = performLogout;

  // Global error capture to surface other ReferenceErrors (helps debugging)
  window.addEventListener('error', function(ev){
    try {
      const msg = ev && ev.message ? ev.message : String(ev);
      if (msg && msg.includes('isPremium')) {
        console.error('🚨 Caught ReferenceError related to isPremium (source may be other script). Message:', msg, 'At', ev.filename, 'line', ev.lineno);
        // Show a gentle non-blocking notice for admins
        if (!document.getElementById('brainova-admin-error')) {
          const n = document.createElement('div');
          n.id = 'brainova-admin-error';
          n.textContent = 'Erreur JS détectée (isPremium conflict). Contact dev.';
          n.style.cssText = 'position:fixed;top:8px;right:8px;background:#ffdddd;color:#800;padding:8px;border-radius:6px;z-index:99999;font-size:12px;border:1px solid #f5c2c2;';
          document.body.appendChild(n);
          setTimeout(()=>{ try{ n.remove(); }catch(e){} }, 15000);
        }
      }
    } catch(e){}
  });

  // ---------- Main init ----------
  document.addEventListener('DOMContentLoaded', async function(){
    console.log('brainova v2.6 DOM ready');

    // small delay
    await new Promise(r => setTimeout(r, 200));

    // parse query params
    let session_id = null, customer_email = null, premiumParam = false;
    try {
      const p = new URLSearchParams(window.location.search);
      premiumParam = (p.get('premium') === '1');
      session_id = p.get('session_id') || null;
      customer_email = p.get('customer_email') || null;
    } catch(e){}

    // detection local
    const localDetected = detectPremiumLocal();
    if (localDetected) {
      window[LOCAL_KEY] = true;
      console.log('⚡ local premium detected');
    } else {
      window[LOCAL_KEY] = false;
    }

    // if premium param, poll verify-premium (race handler)
    if (premiumParam) {
      console.log('🎯 premium param detected — polling verify-premium');
      // user-friendly overlay
      const info = document.createElement('div');
      info.id = 'brainova-verify-info';
      info.textContent = 'Activation en cours — vérification du paiement...';
      info.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#fff;padding:10px 14px;border-radius:8px;border:1px solid #ddd;z-index:9999;';
      document.body.appendChild(info);

      const activated = await pollVerify({ session_id, customer_email, retries: 12, intervalMs: 2500 });
      try { info.remove(); } catch(e){}

      if (activated) {
        console.log('✅ activated via API');
        setLocalPremium(true);
      } else {
        console.warn('⚠️ activation NOT confirmed after polling; doing background sync');
        // background sync attempt
        verifyPremiumApi({ session_id, customer_email }).then(r => {
          if (r && r.active) setLocalPremium(true);
        }).catch(()=>{});
        // show temporary note
        const warn = document.createElement('div');
        warn.id = 'brainova-verify-warn';
        warn.innerHTML = 'Paiement reçu mais activation en attente. Si vos jeux ne se déverrouillent pas, contactez le support.';
        warn.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#fff3cd;padding:10px 14px;border-radius:8px;border:1px solid #ffeeba;color:#856404;z-index:9999;';
        document.body.appendChild(warn);
        setTimeout(()=>{ try{ warn.remove(); }catch(e){} }, 15000);
      }
    } else {
      // no premium param – try light sync if local data stale
      try {
        const now = Date.now();
        const last = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0', 10);
        const hoursSince = (now - last) / (1000*60*60);
        if (isNaN(hoursSince) || hoursSince > SYNC_INTERVAL_HOURS) {
          // non-blocking verify
          verifyPremiumApi({session_id, customer_email}).then(r => { if (r && r.active) setLocalPremium(true); });
        }
      } catch(e){}
    }

    // final flag
    const isPremium = detectPremiumLocal();
    console.log('brainova final isPremium =', !!isPremium);

    // cards logic
    const cards = document.querySelectorAll('.card');
    if (!cards.length) console.warn('⚠️ Aucune carte detectee');
    cards.forEach((card, i) => {
      const num = i + 1;
      const isPremiumGame = num > 10;
      if (isPremiumGame && !isPremium) lockCard(card); else unlockCard(card, isPremiumGame);
    });

    // buttons
    updateButtonsUIFromFlag(isPremium);
    if (isPremium) showBannerOnce();

    // attach behaviors (share, login, logout) — keep minimal and guarded
    const shareBtn = document.getElementById('shareBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const premiumBtn = document.getElementById('premiumBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (premiumBtn) premiumBtn.addEventListener('click', e => { e.preventDefault(); window.location.href='/pricing.html'; });
    if (shareBtn) shareBtn.addEventListener('click', e => {
      if (detectPremiumLocal()) { e.preventDefault(); return; }
      try { if (navigator.share) navigator.share({ title: document.title, text:'Découvrez Brainova', url: window.location.href }); else navigator.clipboard.writeText(window.location.href).then(()=>alert('Lien copié')); } catch(e){ console.warn(e); }
    });
    if (loginBtn) loginBtn.addEventListener('click', e => { if (!detectPremiumLocal()){ e.preventDefault(); alert('🔐 Accès réservé aux abonnés.'); }});
    if (signupBtn) signupBtn.addEventListener('click', e => { if (!detectPremiumLocal()){ e.preventDefault(); alert('🔐 Inscription disponible après abonnement.'); }});
    if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); performLogout(); });

  }); // DOMContentLoaded

  // expose some debug helpers
  window.__brainova.isPremiumFlag = function(){ return !!detectPremiumLocal(); };
  window.__brainova.forceLocalPremium = function(){ setLocalPremium(true); location.reload(); };
  window.__brainova.forceLocalFree = function(){ setLocalPremium(false); location.reload(); };

})(window, document);
