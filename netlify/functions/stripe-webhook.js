// ✅ Brainova Webhook Stripe – Version 3.5 (Firebase scindé + Brevo validé)

import Stripe from "stripe";
import fetch from "node-fetch";
import { Buffer } from "node:buffer";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BNV_SENDER || "noreply@brainova.online";

// 🔥 Initialisation Firebase avec clé Base64 scindée
if (!admin.apps.length) {
  try {
    const fullKeyBase64 =
      (process.env.FIREBASE_PRIVATE_KEY_PART1 || "") +
      (process.env.FIREBASE_PRIVATE_KEY_PART2 || "");
    const decodedKey = Buffer.from(fullKeyBase64, "base64").toString("utf8");
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(decodedKey)),
    });
    console.log("✅ Firebase initialisé avec clé scindée");
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
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: "Méthode non autorisée" };

  const sig = event.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent;

  try {
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "", "utf8");
    stripeEvent = stripe.webhooks.constructEvent(bodyBuffer, sig, endpointSecret);
    console.log(`✅ Événement Stripe reçu : ${stripeEvent.type}`);
  } catch (err) {
    console.error("❌ Signature Stripe invalide :", err.message);
    return { statusCode: 400, headers, body: JSON.stringify({ error: err.message }) };
  }

  // --- Fonction utilitaire : vérifie l’expéditeur Brevo ---
  const verifyBrevoSender = async () => {
    try {
      const res = await fetch("https://api.brevo.com/v3/senders", {
        headers: { accept: "application/json", "api-key": BREVO_API_KEY },
      });
      const data = await res.json();
      const found = data.senders?.some((s) => s.email === BREVO_SENDER);
      return !!found;
    } catch {
      return false;
    }
  };

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
      console.log(res.ok ? `📧 Email envoyé à ${to}` : `❌ Email non envoyé`);
    } catch (e) {
      console.error("❌ Erreur envoi Brevo :", e.message);
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
        let email = session.customer_email || session.customer_details?.email;
        if (email) {
          email = email.trim().toLowerCase();
          const link = `https://brainovafirst.netlify.app/?premium=1&premium_email=${encodeURIComponent(email)}`;
          const senderValid = await verifyBrevoSender();

          if (senderValid)
            await sendEmail(
              email,
              "🎉 Confirmation Brainova Premium",
              `<div style="font-family:sans-serif;color:#333"><h2 style="color:#7b2ff7;">Merci pour votre abonnement Brainova Premium !</h2><p>Votre paiement est confirmé ✅</p><a href="${link}" style="display:inline-block;margin-top:10px;padding:14px 26px;background:#7b2ff7;color:#fff;border-radius:10px;text-decoration:none;">🚀 Accéder à Brainova</a></div>`
            );

          await syncPremium(email, true);
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
    console.error("❌ Erreur Webhook :", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
