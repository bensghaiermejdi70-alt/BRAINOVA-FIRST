// ✅ netlify/functions/stripe-webhook.js
// Brainova Webhook Stripe – Firebase via FIREBASE_KEY (Production)
// Correction : enregistrement device PC à la 1ère activation + envoi lien d'activation vers brainova.online

import Stripe from "stripe";
import fetch from "node-fetch";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BNV_SENDER || "noreply@brainova.online";

// --- Firebase Initialisation ---
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase initialisé via FIREBASE_KEY");
  } catch (e) {
    console.error("❌ Erreur initialisation Firebase :", e);
  }
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
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  const sig = event.headers?.["stripe-signature"] || event.headers?.["Stripe-Signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent;

  try {
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "", "utf8");

    stripeEvent = stripe.webhooks.constructEvent(bodyBuffer, sig, endpointSecret);
    console.log(`✅ Événement Stripe reçu : ${stripeEvent.type}`);
  } catch (err) {
    console.error("❌ Signature Stripe invalide :", err?.message || err);
    return { statusCode: 400, headers, body: JSON.stringify({ error: err?.message || String(err) }) };
  }

  const sendEmail = async (to, subject, html) => {
    try {
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
          subject,
          htmlContent: html,
        }),
      });
      console.log(res.ok ? `📧 Email envoyé à ${to}` : `❌ Email non envoyé (${res.status})`);
      return res.ok;
    } catch (e) {
      console.error("❌ Erreur envoi Brevo :", e?.message || e);
      return false;
    }
  };

  const syncPremium = async (email, isPremium = true) => {
    if (!email) return;
    const ref = db.collection("premium_users").doc(email);
    await ref.set(
      {
        email,
        premium: isPremium,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: "stripe",
      },
      { merge: true }
    );
  };

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const email = session.customer_email || session.customer_details?.email;

        if (email) {
          // Sync premium status
          await syncPremium(email, true);

          // Enregistrer le device PC seulement si aucun device enregistré auparavant
          try {
            const devicesRef = db.collection("premium_devices").doc(email);
            const doc = await devicesRef.get();
            const existing = doc.exists ? (doc.data().devices || []) : [];

            if (!doc.exists || existing.length === 0) {
              await devicesRef.set(
                {
                  email,
                  devices: [
                    {
                      deviceId: uuidv4(),
                      type: "pc",
                      activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                  ],
                },
                { merge: true }
              );
              console.log(`✅ Device PC enregistré pour ${email}`);
            } else {
              console.log(`ℹ️ Device(s) déjà présent(s) pour ${email}, aucun ajout PC automatique nécessaire.`);
            }
          } catch (e) {
            console.error("❌ Erreur enregistrement device PC :", e?.message || e);
          }

          // Envoyer email d'activation vers domaine officiel (brainova.online)
          await sendEmail(
            email,
            "🎉 Confirmation Brainova Premium",
            `<div style="font-family:sans-serif;">
              <h2 style="color:#7b2ff7;">Merci pour votre abonnement Brainova Premium !</h2>
              <p>Votre paiement est confirmé ✅</p>
              <a href="https://brainova.online/activate?email=${encodeURIComponent(email)}"
                style="display:inline-block;margin-top:10px;padding:14px 26px;background:#7b2ff7;color:#fff;border-radius:10px;text-decoration:none;">
                🚀 Activer mon accès Premium
              </a>
            </div>`
          );
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object;
        const email = invoice.customer_email || invoice.customer_details?.email;
        if (email) await syncPremium(email, false);
        break;
      }

      default:
        console.log(`ℹ️ Événement Stripe ignoré : ${stripeEvent.type}`);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("❌ Erreur Webhook :", err?.message || err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err?.message || String(err) }) };   
  }
}
