// ✅ Netlify Function — Vérification & Synchronisation Premium (Brainova v3.5)
// 🔐 Compatible Stripe, Firestore, et Webhook automatique

import Stripe from "stripe";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🧠 Initialiser Firebase Admin une seule fois
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

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    // 🔄 1️⃣ Webhook Stripe appelle en POST pour mise à jour
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

      // 💾 Mise à jour du statut Firestore
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

    // 🔍 2️⃣ Requête GET depuis le front Brainova
    if (event.httpMethod === "GET") {
      const email = event.queryStringParameters?.email;
      if (!email)
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };

      // 🔎 Vérifier d’abord dans Firestore
      const doc = await db.collection("premium_users").doc(email).get();
      if (doc.exists && doc.data().premium === true) {
        console.log(`✅ Premium confirmé via Firestore pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: true, source: "firestore" }) };
      }

      // 🔁 Fallback Stripe (sécurité)
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
        // 🔁 Mettre à jour Firestore automatiquement
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
    console.error("❌ Erreur verify-premium :", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
