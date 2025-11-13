// verify-premium-final.js
// ✅ Brainova verify-premium – Secure activation & token consumption (final)
// - Supports POST (webhook or admin) to set premium flag (activated:false by default)
// - Supports GET with ?email=...&token=...&activate=1 to consume one-time token and activate account
// - Supports GET with ?email=... to check active status only if activated === true
//
// Requirements:
// - FIREBASE_KEY environment variable (JSON string) present in Netlify env
// - This file is intended for Netlify Functions (node 18+)

import Stripe from "stripe";
import admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Initialize Firebase from FIREBASE_KEY env (JSON string)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY || "{}");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase initialized via FIREBASE_KEY");
  } catch (e) {
    console.error("❌ Firebase init error:", e?.message || e);
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
    // --- POST: allow webhook/admin to set premium flag (activated:false by default)
    if (event.httpMethod === "POST") {
      const body = event.body ? JSON.parse(event.body) : {};
      const emailRaw = (body.email || "").toString().trim().toLowerCase();
      const premiumFlag = typeof body.premium !== "undefined" ? !!body.premium : true;

      if (!emailRaw) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
      }

      // set premium=true/false and ensure activated=false until activation link used
      await db.collection("premium_users").doc(emailRaw).set({
        email: emailRaw,
        premium: premiumFlag,
        // keep activated as-is if already true; otherwise default to false
        activated: admin.firestore.FieldValue.serverTimestamp() ? false : false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: "webhook-or-admin",
      }, { merge: true });

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // --- GET: activation or check
    if (event.httpMethod === "GET") {
      const params = event.queryStringParameters || {};
      const emailRaw = (params.email || "").toString().trim().toLowerCase();
      const token = params.token || params.premium_token || null;
      const activate = (params.activate === "1" || params.activate === "true");

      if (!emailRaw) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
      }

      const docRef = db.collection("premium_users").doc(emailRaw);
      const snap = await docRef.get();

      // If doc does not exist -> optional fallback: check Stripe subscriptions (read-only)
      if (!snap.exists) {
        // Check Stripe as a fallback (read-only) - does NOT activate automatically
        try {
          const customers = await stripe.customers.list({ email: emailRaw, limit: 1 });
          if (customers.data.length === 0) {
            return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "none" }) };
          }
          const customerId = customers.data[0].id;
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
          if (subs.data.length > 0) {
            // create a Firestore doc but keep activated=false to require activation via token/link
            await docRef.set({
              email: emailRaw,
              premium: true,
              activated: false,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              source: "stripe-fallback"
            }, { merge: true });
            return { statusCode: 200, headers, body: JSON.stringify({ active: false, reason: "needs_activation", source: "stripe-fallback" }) };
          } else {
            return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "stripe-none" }) };
          }
        } catch (stripeErr) {
          console.error("Stripe fallback error:", stripeErr?.message || stripeErr);
          return { statusCode: 500, headers, body: JSON.stringify({ error: "stripe_error" }) };
        }
      }

      const data = snap.data();

      // --- Activation flow with token: consume token, set activated:true, remove token
      if (activate && token) {
        const storedToken = data.login_token;
        const tokenUsed = !!data.token_used;
        const tokenExpires = data.token_expires_at ? data.token_expires_at.toMillis() : null;
        const now = Date.now();

        if (!storedToken || tokenUsed) {
          return { statusCode: 200, headers, body: JSON.stringify({ active: false, reason: "invalid_or_used_token" }) };
        }

        if (token !== storedToken) {
          return { statusCode: 200, headers, body: JSON.stringify({ active: false, reason: "invalid_token" }) };
        }

        if (tokenExpires && now > tokenExpires) {
          return { statusCode: 200, headers, body: JSON.stringify({ active: false, reason: "token_expired" }) };
        }

        // consume token: set activated true, mark token_used true and remove login_token fields
        await docRef.set({
          activated: true,
          premium: true,
          token_used: true,
          login_token: admin.firestore.FieldValue.delete(),
          token_expires_at: admin.firestore.FieldValue.delete(),
          token_issued_at: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "activation"
        }, { merge: true });

        return { statusCode: 200, headers, body: JSON.stringify({ active: true, source: "activation" }) };
      }

      // --- If not activation attempt: only allow access if premium === true AND activated === true
      if (data.premium === true && data.activated === true) {
        return { statusCode: 200, headers, body: JSON.stringify({ active: true, source: "firestore" }) };
      }

      // If token provided without activate flag: disallow (force activate=1)
      if (token && !activate) {
        return { statusCode: 200, headers, body: JSON.stringify({ active: false, reason: "token_requires_activate_flag" }) };
      }

      // Not activated or not premium
      return { statusCode: 200, headers, body: JSON.stringify({ active: false, reason: "not_activated_or_not_premium" }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    console.error("❌ verify-premium error:", err?.message || err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}
