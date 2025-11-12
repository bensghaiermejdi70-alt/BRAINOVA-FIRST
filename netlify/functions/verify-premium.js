// ✅ Netlify Function — Vérification & Synchronisation Premium (Brainova v3.7)
// 🔒 Fix: Firebase initialization check + Base64 key reconstruction

import Stripe from "stripe";
import admin from "firebase-admin";

// --- Vérification et reconstitution des variables d'environnement ---
function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || (
    (process.env.FIREBASE_PRIVATE_KEY_PART1 || "") +
    (process.env.FIREBASE_PRIVATE_KEY_PART2 || "")
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("🚨 Firebase environment variables missing!");
  }

  let decodedKey = privateKey;

  // ✅ Si clé en Base64 (multi-part)
  if (/^[A-Za-z0-9+/=]+$/.test(privateKey.trim())) {
    try {
      decodedKey = Buffer.from(privateKey, "base64").toString("utf8");
      console.log("🔑 Firebase key decoded from Base64.");
    } catch (e) {
      console.warn("⚠️ Impossible de décoder la clé Firebase, utilisation brute.");
    }
  }

  return { projectId, clientEmail, privateKey: decodedKey.replace(/\\n/g, "\n") };
}

// --- Initialisation sécurisée Firebase ---
let db;

try {
  if (!admin.apps.length) {
    const config = getFirebaseConfig();
    admin.initializeApp({
      credential: admin.credential.cert(config),
    });
    console.log("🔥 Firebase Admin initialisé avec succès.");
  }
  db = admin.firestore();
} catch (error) {
  console.error("❌ Erreur d'initialisation Firebase :", error);
}

// --- Initialisation Stripe ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

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

      if (!db) throw new Error("Firebase non initialisé.");

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

      if (!db) throw new Error("Firebase non initialisé.");

      // --- Vérifier Firestore ---
      const doc = await db.collection("premium_users").doc(email).get();

      if (doc.exists && doc.data().premium === true) {
        console.log(`✅ Premium confirmé via Firestore pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: true, source: "firestore" }) };
      }

      // --- Vérifier Stripe ---
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length === 0) {
        console.log(`🟡 Aucun client Stripe trouvé pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "none" }) };
      }

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
      }

      console.log(`🟡 Aucun abonnement actif pour ${email}`);
      return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "stripe" }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    console.error("❌ Erreur verify-premium :", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || String(err) }) };
  }
}
