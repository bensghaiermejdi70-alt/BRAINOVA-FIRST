// ✅ Brainova – Vérification & Synchronisation Premium (clé scindée Base64)
// Compatible Stripe, Firestore et Webhook automatique

import Stripe from "stripe";
import admin from "firebase-admin";

function initFirebase() {
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
}
initFirebase();
const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    // 🔁 Webhook Stripe (POST)
    if (event.httpMethod === "POST") {
      const body = event.body ? JSON.parse(event.body) : {};
      const { email, premium } = body;

      if (!email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing email parameter" }),
        };
      }

      await db.collection("premium_users").doc(email).set(
        {
          email,
          premium: !!premium,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "webhook",
        },
        { merge: true }
      );

      console.log(`💾 Firestore synchronisé → ${email} = ${premium ? "Premium" : "Free"}`);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // 🔍 Vérification Premium (GET)
    if (event.httpMethod === "GET") {
      const email = event.queryStringParameters?.email;
      if (!email)
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };

      const doc = await db.collection("premium_users").doc(email).get();

      if (doc.exists && doc.data().premium === true) {
        console.log(`✅ Premium confirmé via Firestore pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: true, source: "firestore" }) };
      }

      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length === 0)
        return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "none" }) };

      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        console.log(`✅ Premium confirmé via Stripe pour ${email}`);
        await db.collection("premium_users").doc(email).set(
          {
            email,
            premium: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            source: "stripe",
          },
          { merge: true }
        );
        return { statusCode: 200, headers, body: JSON.stringify({ active: true, source: "stripe" }) };
      } else {
        return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "stripe" }) };
      }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    console.error("❌ Erreur verify-premium :", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || String(err) }) };
  }
}
