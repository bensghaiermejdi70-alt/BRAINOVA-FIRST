// verify-premium-v7.js
// ✅ Version compatible avec webhook v7 (sans token)
// - GET ?email=... → retourne active:true seulement si premium=true & activated=true
// - webhook v7 met activated=true automatiquement après paiement

import Stripe from "stripe";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// === Init Firebase ===
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase initialized (verify-premium)");
  } catch (e) {
    console.error("❌ Firebase init error:", e.message);
  }
}

const db = admin.firestore();

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS")
    return { statusCode: 200, headers };

  if (event.httpMethod !== "GET")
    return { statusCode: 405, headers, body: "Method not allowed" };

  try {
    const email = (event.queryStringParameters?.email || "")
      .toString()
      .trim()
      .toLowerCase();

    if (!email)
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };

    // === Step 1: Check Firestore
    const snap = await db.collection("premium_users").doc(email).get();

    if (snap.exists) {
      const data = snap.data();

      // ACTIVE ONLY IF:
      // premium === true AND activated === true
      if (data.premium === true && data.activated === true) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ active: true, source: "firestore" }),
        };
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ active: false, source: "firestore" }),
        };
      }
    }

    // === Step 2: If user not found in Firestore → check Stripe (read only)
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0)
      return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "none" }) };

    const customerId = customers.data[0].id;
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subs.data.length > 0) {
      // CREATE Firestore doc based on Stripe but require activation=true (already done in webhook)
      await db.collection("premium_users").doc(email).set(
        {
          email,
          premium: true,
          activated: false, // stays false until webhook activates
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "stripe-sync",
        },
        { merge: true }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ active: false, source: "stripe-sync" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ active: false, source: "stripe-none" }),
    };

  } catch (err) {
    console.error("❌ verify-premium error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
