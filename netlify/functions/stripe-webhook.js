// ✅ Brainova Webhook – Version PRODUCTION 2025
// Premium + Email Activation – Aucun appareil ajouté ici

import Stripe from "stripe";
import fetch from "node-fetch";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BNV_SENDER || "noreply@brainova.online";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
export const config = { bodyParser: false };

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: "Method Not Allowed" };

  const sig = event.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;
  try {
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "", "utf8");

    stripeEvent = stripe.webhooks.constructEvent(bodyBuffer, sig, endpointSecret);
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid signature: " + err.message }),
    };
  }

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
      console.error("Email error:", e.message);
    }
  }

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

  try {
    switch (stripeEvent.type) {

      // 🔥 Paiement premium réussi
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const email = session.customer_email || session.customer_details?.email;

        if (email) {
          // 1️⃣ Activer premium
          await updatePremium(email, true);

          // 2️⃣ Envoyer l’email d’activation
          await sendEmail(
            email,
            "🎉 Activation Brainova Premium",
            `
            <div style="font-family:sans-serif;">
              <h2 style="color:#7b2ff7;">✨ Bienvenue dans Brainova Premium</h2>
              <p>Votre abonnement est confirmé !</p>
              <p>Cliquez ci-dessous pour activer votre premier appareil :</p>
              <a href="https://brainovafirst.netlify.app/activate?email=${encodeURIComponent(email)}"
                style="display:inline-block;margin-top:15px;padding:14px 24px;background:#7b2ff7;color:#fff;border-radius:10px;text-decoration:none;">
                🚀 Activer mon accès Premium
              </a>
            </div>
          `
          );
        }
        break;
      }

      // 🔥 Paiement échoué → désactiver premium
      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object;
        const email = invoice.customer_email || invoice.customer_details?.email;
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
