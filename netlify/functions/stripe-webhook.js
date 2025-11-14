// ✅ Brainova Webhook – Version PREMIUM COMPLETE 2025
// - Activation Premium
// - Email d’activation multilingue
// - Email 15 jours avant expiration
// - Email après expiration
// - Pas de gestion d’appareils ici → handled by activate-device.js

import Stripe from "stripe";
import fetch from "node-fetch";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BNV_SENDER || "noreply@brainova.online";

// 🔥 Firebase Init
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
export const config = { bodyParser: false };

// 🌍 Traductions multilingues
const LANGS = {
  fr: {
    activation_subject: "🎉 Activation Brainova Premium",
    activation_msg: "Votre abonnement est confirmé ! Cliquez ci-dessous pour activer votre accès Premium.",
    upcoming_subject: "⏳ Votre abonnement Brainova expire bientôt",
    upcoming_msg: "Votre accès Premium expirera dans les prochains jours.",
    expired_subject: "❌ Votre abonnement Brainova a expiré",
    expired_msg: "Votre accès Premium est désormais désactivé.",
    activate_btn: "🚀 Activer mon accès Premium",
    renew_btn: "🔁 Réactiver mon abonnement"
  },

  en: {
    activation_subject: "🎉 Brainova Premium Activation",
    activation_msg: "Your subscription is confirmed! Click below to activate your Premium access.",
    upcoming_subject: "⏳ Your Brainova subscription expires soon",
    upcoming_msg: "Your Premium access will expire in the next days.",
    expired_subject: "❌ Your Brainova subscription has expired",
    expired_msg: "Your Premium access is now disabled.",
    activate_btn: "🚀 Activate Premium Access",
    renew_btn: "🔁 Renew Subscription"
  },

  es: {
    activation_subject: "🎉 Activación de Brainova Premium",
    activation_msg: "¡Tu suscripción está confirmada! Activa tu acceso Premium abajo.",
    upcoming_subject: "⏳ Tu suscripción de Brainova expira pronto",
    upcoming_msg: "Tu acceso Premium expirará en los próximos días.",
    expired_subject: "❌ Tu suscripción de Brainova ha expirado",
    expired_msg: "Tu acceso Premium está desactivado.",
    activate_btn: "🚀 Activar acceso Premium",
    renew_btn: "🔁 Renovar suscripción"
  },

  ar: {
    activation_subject: "🎉 تفعيل بريـنوفـا بريميوم",
    activation_msg: "تم تأكيد اشتراكك! اضغط أدناه لتفعيل الوصول المميز.",
    upcoming_subject: "⏳ اشتراكك في Brainova سينتهي قريبًا",
    upcoming_msg: "سيتم إيقاف الوصول المميز خلال الأيام القادمة.",
    expired_subject: "❌ انتهى اشتراك Brainova الخاص بك",
    expired_msg: "تم تعطيل حسابك المميز.",
    activate_btn: "🚀 تفعيل الدخول المميز",
    renew_btn: "🔁 إعادة تفعيل الاشتراك"
  },

  de: {
    activation_subject: "🎉 Brainova Premium aktiviert",
    activation_msg: "Ihr Abonnement wurde bestätigt. Premium jetzt aktivieren:",
    upcoming_subject: "⏳ Ihr Brainova-Abo läuft bald ab",
    upcoming_msg: "Ihr Premiumzugang läuft in den nächsten Tagen ab.",
    expired_subject: "❌ Ihr Brainova-Abo ist abgelaufen",
    expired_msg: "Ihr Premiumzugang wurde deaktiviert.",
    activate_btn: "🚀 Premiumzugang aktivieren",
    renew_btn: "🔁 Abo erneuern"
  },

  zh: {
    activation_subject: "🎉 Brainova 高级版已激活",
    activation_msg: "您的订阅已确认！点击下方激活高级访问权限。",
    upcoming_subject: "⏳ 您的 Brainova 订阅即将到期",
    upcoming_msg: "您的高级访问权限将在几天内过期。",
    expired_subject: "❌ 您的 Brainova 订阅已到期",
    expired_msg: "您的高级访问权限已被停用。",
    activate_btn: "🚀 激活高级访问权限",
    renew_btn: "🔁 重新订阅"
  }
};

// 🌍 Sélection automatique de la langue
function getLangFromEmail(email) {
  if (email.endsWith(".fr")) return "fr";
  if (email.endsWith(".es")) return "es";
  if (email.endsWith(".de")) return "de";
  if (email.endsWith(".cn") || email.endsWith(".zh")) return "zh";
  if (email.endsWith(".tn") || email.endsWith(".dz") || email.endsWith(".ma")) return "ar";

  return "en"; // fallback
}

// 📧 Send multilang email
async function sendMailLang(email, type) {
  const lang = getLangFromEmail(email);
  const t = LANGS[lang] || LANGS.en;

  let subject = "";
  let message = "";
  let button = "";
  let button_link = "";

  if (type === "activation") {
    subject = t.activation_subject;
    message = t.activation_msg;
    button = t.activate_btn;
    button_link = `https://brainovafirst.netlify.app/activate?email=${encodeURIComponent(email)}`;
  }

  if (type === "upcoming") {
    subject = t.upcoming_subject;
    message = t.upcoming_msg;
  }

  if (type === "expired") {
    subject = t.expired_subject;
    message = t.expired_msg;
    button = t.renew_btn;
    button_link = "https://brainovafirst.netlify.app";
  }

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": BREVO_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { email: BREVO_SENDER, name: "Brainova" },
      to: [{ email }],
      subject,
      htmlContent: `
        <div style="font-family:sans-serif;">
          <h2 style="color:#7b2ff7;">${subject}</h2>
          <p>${message}</p>
          ${
            button
              ? `<a href="${button_link}" style="margin-top:15px;display:inline-block;padding:14px 24px;background:#7b2ff7;color:#fff;border-radius:10px;text-decoration:none;">${button}</a>`
              : ""
          }
        </div>`
    })
  });
}

// 🔥 Update premium status
async function updatePremium(email, status) {
  await db.collection("premium_users").doc(email).set(
    {
      email,
      premium: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

// ------------------------------------------------------
// 🎯 MAIN HANDLER
// ------------------------------------------------------

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  const sig = event.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;
  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "", "utf8");

    stripeEvent = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: err.message }) };
  }

  try {
    switch (stripeEvent.type) {

      // ----------------------------------------------------
      // ✔️ Activation Premium
      // ----------------------------------------------------
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const email = session.customer_email || session.customer_details?.email;

        if (email) {
          await updatePremium(email, true);
          await sendMailLang(email, "activation");
        }
        break;
      }

      // ----------------------------------------------------
      // ✔️ Email 15 jours avant expiration
      // ----------------------------------------------------
      case "invoice.upcoming": {
        const email = stripeEvent.data.object.customer_email;
        if (email) await sendMailLang(email, "upcoming");
        break;
      }

      // ----------------------------------------------------
      // ✔️ Abonnement expiré
      // ----------------------------------------------------
      case "customer.subscription.deleted": {
        const email = stripeEvent.data.object.customer_email;
        if (email) {
          await updatePremium(email, false);
          await sendMailLang(email, "expired");
        }
        break;
      }

      // ----------------------------------------------------
      // ✔️ Paiement échoué
      // ----------------------------------------------------
      case "invoice.payment_failed": {
        const email = stripeEvent.data.object.customer_email;
        if (email) await updatePremium(email, false);
        break;
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
