// ✅ Stripe Webhook – Brainova v2.2 (Stabilité Premium renforcée)
// 🚀 Vérification e-mail expéditeur + cohérence email client Stripe/Brevo/Firebase
// 🔒 Compatible Netlify (ES module / ESM)

import Stripe from "stripe";
import fetch from "node-fetch";
import { Buffer } from "node:buffer";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BNV_SENDER || "noreply@brainova.online";

// 🔥 Initialisation Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}
const db = admin.firestore();

// 🚫 Désactiver le parsing JSON automatique pour Stripe
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

  // 📨 Vérifie que l’expéditeur Brevo existe bien
  const verifyBrevoSender = async () => {
    try {
      const res = await fetch("https://api.brevo.com/v3/senders", {
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
        },
      });
      const data = await res.json();
      const found = data.senders?.some((s) => s.email === BREVO_SENDER);
      if (!found) console.warn(`⚠️ Expéditeur Brevo non trouvé : ${BREVO_SENDER}`);
      else console.log(`✅ Expéditeur Brevo valide : ${BREVO_SENDER}`);
      return found;
    } catch (e) {
      console.error("⚠️ Impossible de vérifier l’expéditeur Brevo :", e.message);
      return false;
    }
  };

  const senderValid = await verifyBrevoSender();

  // 📧 Envoi d’e-mail via Brevo
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
      if (res.ok) console.log(`📧 Email envoyé à ${to} : ${subject}`);
      else console.error("❌ Erreur Brevo :", await res.text());
    } catch (e) {
      console.error("❌ Erreur réseau Brevo :", e.message);
    }
  };

  // 🔄 Synchroniser Firestore
  const syncPremium = async (email, isPremium = true) => {
    try {
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
      const doc = await ref.get();
      console.log(
        `💾 Firestore enregistré pour ${email}:`,
        doc.exists ? doc.data() : "❌ Document manquant"
      );
    } catch (err) {
      console.error("⚠️ Erreur Firestore :", err.message);
    }
  };

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        let email = session.customer_email || session.customer_details?.email;
        if (email) {
          email = email.trim().toLowerCase();
          console.log("📨 Email client Stripe:", email);

          const link = `https://brainovafirst.netlify.app/?premium=1&premium_email=${encodeURIComponent(email)}`;
          console.log("🔗 Lien envoyé:", link);

          if (senderValid) {
            await sendEmail(
              email,
              "🎉 Confirmation de votre abonnement Brainova Premium",
              `
                <div style="font-family:'Segoe UI',sans-serif;color:#333">
                  <h2 style="color:#7b2ff7;">Merci pour votre abonnement Brainova Premium !</h2>
                  <p>Votre paiement a bien été reçu ✅</p>
                  <a href="${link}" style="display:inline-block;margin-top:10px;padding:14px 26px;background:#7b2ff7;color:#fff;font-weight:bold;border-radius:10px;text-decoration:none;">🚀 Accéder à Brainova</a>
                  <p style="margin-top:20px;font-size:13px;color:#666;">Lien direct : ${link}</p>
                </div>
              `
            );
          } else {
            console.error("⚠️ Email expéditeur Brevo invalide, envoi annulé !");
          }

          await syncPremium(email, true);
        } else {
          console.warn("⚠️ Aucun email trouvé dans session Stripe !");
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
