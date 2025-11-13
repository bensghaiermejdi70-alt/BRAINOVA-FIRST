// ✅ Brainova Verify Premium – v4.2 (Firebase via FIREBASE_KEY + Stripe)

import Stripe from "stripe";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// --- Initialisation Firebase ---
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase initialisé via FIREBASE_KEY");
  } catch (error) {
    console.error("❌ Erreur d'initialisation Firebase :", error);
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
    if (event.httpMethod === "GET") {
      const email = event.queryStringParameters?.email;
      if (!email)
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };

      const doc = await db.collection("premium_users").doc(email).get();
      if (doc.exists && doc.data().premium === true)
        return { statusCode: 200, headers, body: JSON.stringify({ active: true, source: "firestore" }) };

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

      return { statusCode: 200, headers, body: JSON.stringify({ active: false }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    console.error("❌ Erreur verify-premium :", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
