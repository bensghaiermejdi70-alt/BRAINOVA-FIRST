// ✅ netlify/functions/verify-premium.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    if (event.httpMethod === "GET") {
      const email = event.queryStringParameters?.email;
      const deviceId = event.queryStringParameters?.deviceId;

      if (!email || !deviceId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing parameters" }) };
      }

      const ref = db.collection("premium_devices").doc(email);
      const snap = await ref.get();

      if (!snap.exists) {
        return { statusCode: 200, headers, body: JSON.stringify({ active: false }) };
      }

      const devices = snap.data().devices || [];
      const ok = devices.some((d) => d.deviceId === deviceId);

      return { statusCode: 200, headers, body: JSON.stringify({ active: ok }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
