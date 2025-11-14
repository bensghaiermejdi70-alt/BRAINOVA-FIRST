// ✅ sendemail.js — Multilang PRO (Brainova Premium) — Palette C1
// Supports types: "activation", "pre_expiration", "expired"
// Languages: fr,en,es,ar,de,zh
// Usage webhook: await sendMailLang(email, "activation", "fr", { activateUrl })
// Usage HTTP POST: { to, type, lang, data }

import fetch from "node-fetch";

// Env: BREVO_API_KEY, BREVO_SENDER (optional, default noreply@brainova.online)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BREVO_SENDER || "noreply@brainova.online";
const SENDER_NAME = "Brainova Premium";

if (!BREVO_API_KEY) {
  console.error("Missing BREVO_API_KEY environment variable");
}

// --- Palette C1 ---
const COLORS = {
  primary: "#7b2ff7", // violet (button)
  accent: "#FCD34D",  // yellow
  danger: "#EF4444",  // red
  bg: "#ffffff",
  text: "#111827",
};

// --- Templates: each template is a function returning HTML string
const TEMPLATES = {
  activation: {
    fr: (data) => `
      <div style="font-family:Inter, system-ui, -apple-system, Arial, sans-serif; color:${COLORS.text};">
        <h2 style="color:${COLORS.primary}; margin-bottom:6px;">✨ Bienvenue dans Brainova Premium</h2>
        <p>Votre abonnement <strong>Brainova Premium</strong> a été activé avec succès.</p>
        <p>Cliquez ci-dessous pour activer votre appareil et démarrer les jeux :</p>
        <a href="${escapeHtml(data.activateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none; display:inline-block; margin-top:10px;">🚀 Activer mon accès Premium</a>
        <p style="margin-top:12px;color:#6b7280;">Si ce lien ne fonctionne pas, copiez-collez : ${escapeHtml(data.activateUrl)}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • Boostez votre cerveau 🧠</small>
      </div>`,

    en: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif; color:${COLORS.text};">
        <h2 style="color:${COLORS.primary}; margin-bottom:6px;">✨ Welcome to Brainova Premium</h2>
        <p>Your <strong>Brainova Premium</strong> subscription is active.</p>
        <p>Click below to activate your device and start playing:</p>
        <a href="${escapeHtml(data.activateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none; display:inline-block; margin-top:10px;">🚀 Activate my Premium access</a>
        <p style="margin-top:12px;color:#6b7280;">If the button doesn't work, copy/paste: ${escapeHtml(data.activateUrl)}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • Boost your brain 🧠</small>
      </div>`,

    es: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif; color:${COLORS.text};">
        <h2 style="color:${COLORS.primary}; margin-bottom:6px;">✨ Bienvenido a Brainova Premium</h2>
        <p>Tu suscripción <strong>Brainova Premium</strong> está activa.</p>
        <p>Haz clic abajo para activar tu dispositivo y comenzar:</p>
        <a href="${escapeHtml(data.activateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none; display:inline-block; margin-top:10px;">🚀 Activar mi acceso Premium</a>
        <p style="margin-top:12px;color:#6b7280;">Si no funciona, copia-pega: ${escapeHtml(data.activateUrl)}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • Mejora tu mente 🧠</small>
      </div>`,

    ar: (data) => `
      <div dir="rtl" style="font-family:Inter, system-ui, Arial, sans-serif; color:${COLORS.text};">
        <h2 style="color:${COLORS.primary}; margin-bottom:6px;">✨ مرحبًا بك في Brainova Premium</h2>
        <p>تم تفعيل اشتراك <strong>Brainova Premium</strong> بنجاح.</p>
        <p>انقر أدناه لتفعيل جهازك والبدء:</p>
        <a href="${escapeHtml(data.activateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none; display:inline-block; margin-top:10px;">🚀 تفعيل الوصول Premium</a>
        <p style="margin-top:12px;color:#6b7280;">إن لم يعمل الرابط انسخه هنا: ${escapeHtml(data.activateUrl)}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • درب عقلك 🧠</small>
      </div>`,

    de: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif; color:${COLORS.text};">
        <h2 style="color:${COLORS.primary}; margin-bottom:6px;">✨ Willkommen bei Brainova Premium</h2>
        <p>Ihr <strong>Brainova Premium</strong> Abo wurde aktiviert.</p>
        <p>Klicken Sie unten, um Ihr Gerät zu aktivieren und loszulegen:</p>
        <a href="${escapeHtml(data.activateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none; display:inline-block; margin-top:10px;">🚀 Premium-Zugang aktivieren</a>
        <p style="margin-top:12px;color:#6b7280;">Falls der Link nicht funktioniert: ${escapeHtml(data.activateUrl)}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • Trainieren Sie Ihr Gehirn 🧠</small>
      </div>`,

    zh: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif; color:${COLORS.text};">
        <h2 style="color:${COLORS.primary}; margin-bottom:6px;">✨ 欢迎使用 Brainova Premium</h2>
        <p>您的 <strong>Brainova Premium</strong> 订阅已激活。</p>
        <p>点击以下按钮在设备上激活并开始：</p>
        <a href="${escapeHtml(data.activateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none; display:inline-block; margin-top:10px;">🚀 激活 Premium 访问</a>
        <p style="margin-top:12px;color:#6b7280;">如果按钮无效，请复制链接： ${escapeHtml(data.activateUrl)}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • 提升你的大脑 🧠</small>
      </div>`,
  },

  pre_expiration: {
    fr: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">⏳ Votre abonnement expire bientôt</h2>
        <p>Bonjour ! Votre abonnement <strong>Brainova Premium</strong> arrivera à expiration dans 15 jours.</p>
        <p>Si votre paiement passe normalement, vous n'avez rien à faire. Sinon, cliquez ici pour réactiver :</p>
        <a href="${escapeHtml(data.accountUrl)}" style="background:${COLORS.primary}; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;">🔁 Gérer mon abonnement</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • On s'occupe de votre entrainement</small>
      </div>`,

    en: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">⏳ Your subscription expires soon</h2>
        <p>Hello — your <strong>Brainova Premium</strong> subscription will expire in 15 days.</p>
        <p>If your payment goes through, no action is needed. Otherwise click below to manage:</p>
        <a href="${escapeHtml(data.accountUrl)}" style="background:${COLORS.primary}; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;">🔁 Manage my subscription</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • Keep training your brain</small>
      </div>`,

    es: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">⏳ Tu suscripción vencerá pronto</h2>
        <p>Hola — tu suscripción <strong>Brainova Premium</strong> expirará en 15 días.</p>
        <p>Si el pago se procesa, no hace falta nada. Si no, haz clic abajo:</p>
        <a href="${escapeHtml(data.accountUrl)}" style="background:${COLORS.primary}; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;">🔁 Gestionar mi suscripción</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • Mejora tu mente</small>
      </div>`,

    ar: (data) => `
      <div dir="rtl" style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">⏳ اشتراكك سينتهي قريبًا</h2>
        <p>مرحبًا — اشتراك <strong>Brainova Premium</strong> سينتهي بعد 15 يومًا.</p>
        <p>إذا تم تحصيل الدفع، لا يلزمك أي إجراء. وإلا اضغط لإدارة الاشتراك:</p>
        <a href="${escapeHtml(data.accountUrl)}" style="background:${COLORS.primary}; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;">🔁 إدارة الاشتراك</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • نحن نهتم بتدريبك</small>
      </div>`,

    de: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">⏳ Ihr Abo läuft bald ab</h2>
        <p>Hallo — Ihr <strong>Brainova Premium</strong> Abo läuft in 15 Tagen ab.</p>
        <p>Wenn die Zahlung durchgeht, ist nichts zu tun. Andernfalls hier verwalten:</p>
        <a href="${escapeHtml(data.accountUrl)}" style="background:${COLORS.primary}; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;">🔁 Abo verwalten</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • Trainieren Sie Ihr Gehirn</small>
      </div>`,

    zh: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">⏳ 您的订阅即将到期</h2>
        <p>您好 — 您的 <strong>Brainova Premium</strong> 订阅将在 15 天后到期。</p>
        <p>如果付款成功，无需操作。否则请点击下方管理：</p>
        <a href="${escapeHtml(data.accountUrl)}" style="background:${COLORS.primary}; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;">🔁 管理我的订阅</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • 持续训练你的大脑</small>
      </div>`,
  },

  expired: {
    fr: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">❌ Votre abonnement Brainova a expiré</h2>
        <p>Votre accès Premium a été désactivé. Vous pouvez le réactiver à tout moment :</p>
        <a href="${escapeHtml(data.reactivateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none;">🔁 Réactiver mon abonnement</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • On espère vous revoir bientôt</small>
      </div>`,

    en: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">❌ Your Brainova subscription expired</h2>
        <p>Your Premium access has been disabled. Reactivate anytime:</p>
        <a href="${escapeHtml(data.reactivateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none;">🔁 Reactivate my subscription</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • We hope to see you back</small>
      </div>`,

    es: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">❌ Tu suscripción Brainova ha expirado</h2>
        <p>Tu acceso Premium ha sido desactivado. Reactívalo aquí:</p>
        <a href="${escapeHtml(data.reactivateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none;">🔁 Reactivar mi suscripción</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • Te esperamos de nuevo</small>
      </div>`,

    ar: (data) => `
      <div dir="rtl" style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">❌ لقد انتهت اشتراكك في Brainova</h2>
        <p>تم إيقاف وصولك إلى Premium. يمكنك إعادة التفعيل هنا:</p>
        <a href="${escapeHtml(data.reactivateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none;">🔁 إعادة تفعيل الاشتراك</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • نأمل أن نراك مجددًا</small>
      </div>`,

    de: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">❌ Ihr Brainova-Abo ist abgelaufen</h2>
        <p>Ihr Premium-Zugang wurde deaktiviert. Reaktivieren Sie hier:</p>
        <a href="${escapeHtml(data.reactivateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none;">🔁 Abo reaktivieren</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • Wir hoffen, Sie bald wiederzusehen</small>
      </div>`,

    zh: (data) => `
      <div style="font-family:Inter, system-ui, Arial, sans-serif;color:${COLORS.text};">
        <h2 style="color:${COLORS.danger};">❌ 您的 Brainova 订阅已过期</h2>
        <p>您的 Premium 访问已被禁用。点击下面重新激活：</p>
        <a href="${escapeHtml(data.reactivateUrl)}" style="background:${COLORS.primary}; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none;">🔁 重新激活订阅</a>
        <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
        <small style="color:#6b7280;">Brainova • 期待您再次回来</small>
      </div>`,
  },
};

// --- Utility: escape simple HTML (to avoid injection in URLs/text)
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Main send function used by webhook or other code
export async function sendMailLang(to, type = "activation", lang = "en", data = {}) {
  try {
    if (!to) throw new Error("Missing recipient");
    lang = (lang || "en").toLowerCase();
    if (!["fr","en","es","ar","de","zh"].includes(lang)) lang = "en";

    // default data
    data = Object.assign(
      {
        activateUrl: `https://brainovafirst.netlify.app/activate?email=${encodeURIComponent(to)}`,
        accountUrl: `https://brainovafirst.netlify.app/account?email=${encodeURIComponent(to)}`,
        reactivateUrl: `https://brainovafirst.netlify.app`,
      },
      data || {}
    );

    const tplGroup = TEMPLATES[type] || TEMPLATES.activation;
    const tplFn = tplGroup[lang] || tplGroup["en"];
    const html = tplFn(data);

    const payload = {
      sender: { name: SENDER_NAME, email: BREVO_SENDER },
      to: [{ email: to }],
      subject:
        type === "activation"
          ? "Brainova Premium – Activation"
          : type === "pre_expiration"
          ? "Brainova Premium – Votre abonnement expire bientôt"
          : "Brainova Premium – Abonnement expiré",
      htmlContent: html,
    };

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("Brevo error", result);
      throw new Error(result.message || "Brevo API error");
    }

    return { ok: true, result };
  } catch (err) {
    console.error("sendMailLang error:", err);
    return { ok: false, error: err.message || String(err) };
  }
}

// --- Netlify function handler (POST)
export const handler = async (event) => {
  try {
    if (!BREVO_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: "BREVO_API_KEY missing" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const to = body.to || body.email;
    const type = body.type || "activation";
    const lang = (body.lang || "fr").toLowerCase();
    const data = body.data || {};

    const allowedTypes = ["activation","pre_expiration","expired"];
    if (!allowedTypes.includes(type)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Invalid type" }) };
    }

    const r = await sendMailLang(to, type, lang, data);
    if (!r.ok) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: r.error }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, result: r.result }) };
  } catch (err) {
    console.error("sendemail handler error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
