// stripe-webhook-v6.js
// ✅ Brainova Webhook Stripe – v6.0 (Token unique, activation one-time, secure + fluid)

import Stripe from "stripe";
import fetch from "node-fetch";
import admin from "firebase-admin";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BNV_SENDER || "noreply@brainova.online";

// --- Init Firebase from FIREBASE_KEY (JSON stored in Netlify env) ---
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase initialized via FIREBASE_KEY");
  } catch (e) {
    console.error("❌ Firebase init error:", e);
  }
}
const db = admin.firestore();
export const config = { bodyParser: false };

// --- Helper: send email via Brevo ---
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
    console.log(res.ok ? `📧 Email sent to ${to}` : `❌ Email not sent to ${to}`);
  } catch (err) {
    console.error("❌ Brevo send error:", err?.message || err);
  }
};

// --- Handler ---
export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: "Method not allowed" };

  const sig = event.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent;

  try {
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "", "utf8");

    stripeEvent = stripe.webhooks.constructEvent(bodyBuffer, sig, endpointSecret);
    console.log(`✅ Stripe event: ${stripeEvent.type}`);
  } catch (err) {
    console.error("❌ Stripe signature error:", err?.message || err);
    return { statusCode: 400, headers, body: JSON.stringify({ error: err?.message }) };
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        let email = session.customer_email || session.customer_details?.email;
        if (!email) break;

        email = email.trim().toLowerCase();

        // --- Generate secure one-time token
        const token = crypto.randomBytes(32).toString("hex");
        const issuedAt = Date.now();
        const expiresMs = 1000 * 60 * 60 * 24 * 7; // token valid 7 days (adjustable)
        const expiresAt = new Date(issuedAt + expiresMs);

        // --- Store premium doc (premium true, but not activated until token use)
        await db.collection("premium_users").doc(email).set(
          {
            email,
            premium: true,
            activated: false, // will become true after activation link clicked
            login_token: token,
            token_expires_at: admin.firestore.Timestamp.fromMillis(expiresAt.getTime()),
            token_issued_at: admin.firestore.FieldValue.serverTimestamp(),
            token_used: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            source: "stripe",
          },
          { merge: true }
        );

        // --- Build activation link (one-time)
        const link = `https://brainovafirst.netlify.app/?premium_email=${encodeURIComponent(email)}&token=${token}&activate=1`;

        // --- Send secure email with instruction
        await sendEmail(
          email,
          "🎉 Confirmation Brainova Premium — Activez votre accès",
          `<div style="font-family:sans-serif;color:#333">
             <h2 style="color:#7b2ff7;">Merci pour votre abonnement Brainova Premium !</h2>
             <p>Votre paiement est confirmé ✅</p>
             <p><b>Important :</b> ce lien d'activation est à usage unique et expire dans 7 jours.</p>
             <a href="${link}" style="display:inline-block;margin-top:10px;padding:14px 26px;background:#7b2ff7;color:#fff;border-radius:10px;text-decoration:none;">🚀 Activer mon accès Premium</a>
             <p style="margin-top:12px;font-size:13px;color:#666;">Si le lien ne fonctionne pas, copiez-collez ceci dans votre navigateur :</p>
             <p style="font-size:12px;color:#111">${link}</p>
           </div>`
        );

        console.log("🔐 Activation link generated and email sent for", email);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object;
        const email = (invoice.customer_email || invoice.customer_details?.email)?.trim().toLowerCase();
        if (email) {
          // mark premium false and clear activation/token
          await db.collection("premium_users").doc(email).set(
            {
              premium: false,
              activated: false,
              login_token: admin.firestore.FieldValue.delete(),
              token_expires_at: admin.firestore.FieldValue.delete(),
              token_issued_at: admin.firestore.FieldValue.delete(),
              token_used: admin.firestore.FieldValue.delete(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              source: "stripe-invoice-failed",
            },
            { merge: true }
          );
          console.log("⚠️ Payment failed — premium revoked for", email);
        }
        break;
      }

      // optionally handle subscription.deleted or customer.subscription.deleted to revoke access
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        // Implement as needed (e.g., revoke if cancelled)
        // Example: if subscription canceled, set premium:false
        // const session = stripeEvent.data.object;
        // ... custom logic ...
        break;
      }

      default:
        console.log(`ℹ️ Ignored Stripe event: ${stripeEvent.type}`);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("❌ Webhook processing error:", err?.message || err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}
