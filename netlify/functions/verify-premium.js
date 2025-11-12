// ✅ Brainova v4.0 – Vérification Premium (Firebase local + Stripe)
// 🔧 Migration vers firebase-key.json – Version stable production

const Stripe = require("stripe");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// --- Initialisation Firebase depuis le fichier local sécurisé ---
try {
  const keyPath = path.join(process.cwd(), "netlify/functions/firebase-key.json");
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase initialisé depuis firebase-key.json");
  }
} catch (error) {
  console.error("❌ Erreur d'initialisation Firebase :", error);
}

const db = admin.firestore();

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    if (event.httpMethod === "POST") {
      const { email, premium } = JSON.parse(event.body || "{}");
      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
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

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (event.httpMethod === "GET") {
      const email = event.queryStringParameters?.email;
      if (!email)
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };

      const doc = await db.collection("premium_users").doc(email).get();
      if (doc.exists && doc.data().premium === true) {
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

      return { statusCode: 200, headers, body: JSON.stringify({ active: false, source: "stripe" }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    console.error("❌ Erreur verify-premium :", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
