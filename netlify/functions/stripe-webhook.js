// stripe-webhook-v7.js
// ✅ Brainova Webhook Stripe – v7.0 (Premium immédiat + anti-transfert email)

import Stripe from "stripe";
import fetch from "node-fetch";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BNV_SENDER || "noreply@brainova.online";

// --- Init Firebase depuis FIREBASE_KEY ---
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase initialisé via FIREBASE_KEY");
  } catch (err) {
    console.error("❌ Erreur init Firebase :", err);
  }
}
const db = admin.firestore();

export const config = { bodyParser: false };

// === Fonction email anti-transfert ===
const sendEmail = async (to) => {
  try {
    const html = `
      <div style="font-family:sans-serif;color:#333">
        <h2 style="color:#7b2ff7;">Merci pour votre abonnement Brainova Premium !</h2>
        <p>Votre paiement est confirmé ✅</p>

        <p><b>Important :</b> cet email est lié à votre compte personnel.</p>
        <p style="color:red;font-weight:bold">Il ne peut pas être transféré.</p>

        <p style="margin-top:14px;font-size:15px;">
          Pour accéder à vos jeux Premium, rendez-vous directement sur :
        </p>

        <a href="https://brainovafirst.netlify.app"
           style="display:inline-block;margin-top:10px;padding:14px 26px;
           background:#7b2ff7;color:#fff;border-radius:10px;text-decoration:none;">
           🚀 Accéder à Brainova
        </a>

        <p style="margin-top:12px;font-size:12px;color:#666">
          Si le bouton ne fonctionne pas, copiez-collez l'adresse manuellement.
        </p>
      </div>
    `;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER, name: "Brainova" },
        to: [{ email: to }],
        subject: "🎉 Votre accès Brainova Premium",
        htmlContent: html,
      }),
    });

    console.log(res.ok ? `📧 Email envoyé à ${to}` : `❌ Email non envoyé`);
  } catch (err) {
    console.error("❌ Erreur envoi email :", err);
  }
};

// === Handler webhook principal ===
export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: "Méthode non autorisée" };

  // Vérification Stripe signature
  const sig = event.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent;

  try {
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "", "utf8");

    stripeEvent = stripe.webhooks.constructEvent(bodyBuffer, sig, secret);
    console.log("🎯 Stripe event :", stripeEvent.type);
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: err.message }) };
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        let email = session.customer_email || session.customer_details?.email;

        if (!email) break;
        email = email.trim().toLowerCase();

        // === Activation premium immédiate ===
        await db.collection("premium_users").doc(email).set(
          {
            email,
            premium: true,
            activated: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            source: "stripe",
          },
          { merge: true }
        );

        // === Envoi e-mail anti-transfert ===
        await sendEmail(email);

        console.log("🎉 Premium activé pour", email);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object;
        const email = (invoice.customer_email || invoice.customer_details?.email)
          ?.trim()
          ?.toLowerCase();

        if (email) {
          await db.collection("premium_users").doc(email).set(
            {
              premium: false,
              activated: false,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              source: "payment_failed",
            },
            { merge: true }
          );
          console.log("⚠️ Premium désactivé pour", email);
        }
        break;
      }

      default:
        console.log("ℹ️ Event ignoré :", stripeEvent.type);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("❌ Webhook error :", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
