// ✅ netlify/functions/activate-device.js
// Enregistre un appareil (PC ou Mobile) – Limite 2 appareils

import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    // Accept GET or POST
    const params = event.httpMethod === "POST"
      ? JSON.parse(event.body || "{}")
      : event.queryStringParameters || {};

    const email = params.email?.trim().toLowerCase();
    const deviceId = params.deviceId?.trim();
    const type = params.type || "unknown";

    if (!email || !deviceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing parameters (email + deviceId)" }),
      };
    }

    const ref = db.collection("premium_devices").doc(email);
    const snap = await ref.get();

    // 1️⃣ Si le document n'existe pas encore → créer un tableau vide
    if (!snap.exists) {
      await ref.set({
        email,
        devices: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ajouter ensuite l'appareil sans timestamp
      await ref.update({
        devices: admin.firestore.FieldValue.arrayUnion({
          deviceId,
          type,
        }),
      });

      return { statusCode: 200, headers, body: "DEVICE_ADDED" };
    }

    // 2️⃣ Document existe
    const data = snap.data();
    const devices = Array.isArray(data.devices) ? data.devices : [];

    // Déjà enregistré ?
    if (devices.some(d => d.deviceId === deviceId)) {
      return { statusCode: 200, headers, body: "DEVICE_EXISTS" };
    }

    // Limite : 2 appareils
    if (devices.length >= 2) {
      return { statusCode: 403, headers, body: "LIMIT_REACHED" };
    }

    // 3️⃣ Ajouter l'appareil sans timestamp dans un object arrayUnion
    await ref.update({
      devices: admin.firestore.FieldValue.arrayUnion({
        deviceId,
        type,
      }),
    });

    return { statusCode: 200, headers, body: "DEVICE_ADDED" };

  } catch (err) {
    console.error("activate-device error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
