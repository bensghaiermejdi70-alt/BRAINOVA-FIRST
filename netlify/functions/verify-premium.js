// ✅ Brainova Verify Premium – Version Finale (PC + Mobile max)

import admin from "firebase-admin";

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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    if (event.httpMethod === "GET") {
      const email = event.queryStringParameters?.email;
      const deviceId = event.queryStringParameters?.deviceId;

      if (!email || !deviceId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing parameters" }),
        };
      }

      // Vérifier la liste des appareils autorisés
      const ref = db.collection("premium_devices").doc(email);
      const snap = await ref.get();

      if (!snap.exists) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ active: false }),
        };
      }

      const devices = snap.data().devices || [];

      const isAuthorized = devices.some((d) => d.deviceId === deviceId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ active: isAuthorized }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (err) {
    console.error("❌ Erreur verify-premium :", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
