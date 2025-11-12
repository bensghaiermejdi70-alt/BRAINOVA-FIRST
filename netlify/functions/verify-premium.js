// ✅ Netlify Function — Vérification & Synchronisation Premium (Brainova v3.6 Base64 Fix)
// 🔐 Compatible Stripe, Firestore, et Webhook automatique

import Stripe from "stripe";
import admin from "firebase-admin";

// --- Vérification des variables d'environnement ---
function checkEnv() {
  const missing = [];
  if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!process.env.FIREBASE_PROJECT_ID) missing.push("FIREBASE_PROJECT_ID");
  if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!process.env.FIREBASE_PRIVATE_KEY) missing.push("FIREBASE_PRIVATE_KEY");
  return missing;
}

const envMissing = checkEnv();
if (envMissing.length) {
  console.error("❌ Variables d'environnement manquantes :", envMissing.join(", "));
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// --- Initialisation Firebase ---
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // ✅ Correction : décodage Base64
        privateKey: Buffer.from(process.env.FIREBASE_PRIVATE_KEY, "base64").toString("utf8"),
      }),
    });
    console.log("🔥 Firebase initialisé avec succès (clé Base64)");
  } catch (e) {
    console.error("❌ Erreur initialisation Firebase :", e.message);
  }
}

const db = admin.firestore();

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    // --- Webhook Stripe (POST) ---
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

      // --- Mise à jour Firestore ---
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

    // --- Vérification Premium (GET) ---
    if (event.httpMethod === "GET") {
      const email = event.queryStringParameters?.email;
      if (!email)
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };

      // --- Vérifier Firestore ---
      let doc;
      try {
        doc = await db.collection("premium_users").doc(email).get();
      } catch (e) {
        console.error("❌ Erreur Firestore :", e);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "Firestore error", details: e.message }),
        };
      }

      if (doc.exists && doc.data().premium === true) {
        console.log(`✅ Premium confirmé via Firestore pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: true, source: "firestore" }) };
      }

      // --- Fallback Stripe ---
      let customers;
      try {
        customers = await stripe.customers.list({ email, limit: 1 });
      } catch (e) {
        console.error("❌ Erreur Stripe (customers) :", e);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "Stripe error", details: e.message }),
        };
      }

      if (customers.data.length === 0) {
        console.log(`🟡 Aucun client Stripe trouvé pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "none" }) };
      }

      const customerId = customers.data[0].id;
      let subscriptions;
      try {
        subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });
      } catch (e) {
        console.error("❌ Erreur Stripe (subscriptions) :", e);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "Stripe error", details: e.message }),
        };
      }

      if (subscriptions.data.length > 0) {
        console.log(`✅ Premium confirmé via Stripe pour ${email}`);
        // --- Mettre à jour Firestore ---
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
        console.log(`🟡 Aucun abonnement actif pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "stripe" }) };
      }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    console.error("❌ Erreur verify-premium :", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || String(err) }) };
  }
}
