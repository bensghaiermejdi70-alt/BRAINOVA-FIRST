// ✅ Brainova Webhook – Version PREMIUM COMPLETE 2025
// - Activation Premium
// - Email d’activation
// - Email 15 jours avant expiration
// - Email après expiration
// - Aucune gestion d’appareil ici (activate-device s’en occupe)

import Stripe from "stripe";
import fetch from "node-fetch";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BNV_SENDER || "noreply@brainova.online";

// --- Firebase ---
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
export const config = { bodyParser: false };

// --- Email sender ---
async function sendEmail(to, subject, html) {
  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER, name: "Brainova" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
  } catch (e) {
    console.error("❌ Email error:", e.message);
  }
}

// --- Premium sync ---
async function updatePremium(email, status) {
  await db.collection("premium_users").doc(email).set(
    {
      email,
      premium: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: "Method Not Allowed" };

  // Verify signature
  const sig = event.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;
  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "", "utf8");

    stripeEvent = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid signature: " + err.message }),
    };
  }

  try {
    switch (stripeEvent.type) {

      // ----------------------------------------------------
      // 🔥 1) Paiement réussi = Activation Premium
      // ----------------------------------------------------
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const email = session.customer_email || session.customer_details?.email;

        if (email) {
          await updatePremium(email, true);

          await sendEmail(
            email,
            "🎉 Activation Brainova Premium",
            `
            <div style="font-family:sans-serif;">
              <h2 style="color:#7b2ff7;">✨ Bienvenue dans Brainova Premium</h2>
              <p>Votre abonnement est confirmé !</p>
              <p>Cliquez ci-dessous pour activer votre premier appareil :</p>
              <a href="https://brainovafirst.netlify.app/activate?email=${encodeURIComponent(
                email
              )}"
                style="display:inline-block;margin-top:15px;padding:14px 24px;background:#7b2ff7;color:#fff;border-radius:10px;text-decoration:none;">
                🚀 Activer mon accès Premium
              </a>
            </div>
            `
          );
        }
        break;
      }

      // ----------------------------------------------------
      // 🔥 2) Notification 15 jours avant expiration
      // ----------------------------------------------------
      case "invoice.upcoming": {
        const invoice = stripeEvent.data.object;
        const email = invoice.customer_email;

        if (email) {
          await sendEmail(
            email,
            "⏳ Votre abonnement Brainova expire bientôt",
            `
            <div style="font-family:sans-serif;">
              <h2 style="color:#7b2ff7;">Votre abonnement expire bientôt</h2>
              <p>Votre accès Premium expire dans les prochains jours.</p>
              <p>Si votre paiement passe correctement, rien à faire.</p>
            </div>
            `
          );
        }
        break;
      }

      // ----------------------------------------------------
      // 🔥 3) Abonnement expiré (non payé)
      // ----------------------------------------------------
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;
        const email = sub.customer_email;

        if (email) {
          await updatePremium(email, false);

          await sendEmail(
            email,
            "❌ Votre abonnement Brainova a expiré",
            `
            <div style="font-family:sans-serif;">
              <h2 style="color:#ff3b3b;">Votre abonnement a expiré</h2>
              <p>Votre accès Premium est maintenant désactivé.</p>
              <p>Vous pouvez le réactiver ici :</p>
              <a href="https://brainovafirst.netlify.app"
                style="display:inline-block;margin-top:15px;padding:14px 24px;background:#7b2ff7;color:#fff;border-radius:10px;text-decoration:none;">
                🔁 Réactiver mon abonnement
              </a>
            </div>
            `
          );
        }
        break;
      }

      // ----------------------------------------------------
      // 🔥 4) Paiement échoué → désactiver premium
      // ----------------------------------------------------
      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object;
        const email = invoice.customer_email;

        if (email) await updatePremium(email, false);
        break;
      }

      default:
        break;
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
