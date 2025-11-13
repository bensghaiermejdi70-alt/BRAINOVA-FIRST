// ✅ netlify/functions/activate-device.js
// Enregistre un appareil (PC ou Mobile) pour un compte premium
// Limite : 2 appareils par email

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
    // Accept either GET (from activate page) or POST (optional)
    const params = event.httpMethod === "POST"
      ? JSON.parse(event.body || "{}")
      : event.queryStringParameters || {};

    const emailRaw = params.email;
    const deviceIdRaw = params.deviceId;
    const deviceType = (params.type || "unknown").toString();

    const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : null;
    const deviceId = typeof deviceIdRaw === "string" ? deviceIdRaw.trim() : null;

    if (!email || !deviceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing parameters (email & deviceId required)" }),
      };
    }

    const ref = db.collection("premium_devices").doc(email);
    const snap = await ref.get();

    if (!snap.exists) {
      // create new document with first device
      await ref.set({
        email,
        devices: [
          {
            deviceId,
            type: deviceType,
            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        source: "activation",
      }, { merge: true });

      return { statusCode: 200, headers, body: "DEVICE_ADDED" };
    }

    const data = snap.data();
    const devices = Array.isArray(data.devices) ? data.devices : [];

    // If device already present -> OK
    const exists = devices.some(d => d && d.deviceId === deviceId);
    if (exists) {
      return { statusCode: 200, headers, body: "DEVICE_EXISTS" };
    }

    // Limit check (2 devices max)
    const MAX_DEVICES = 2;
    if (devices.length >= MAX_DEVICES) {
      return { statusCode: 403, headers, body: "LIMIT_REACHED" };
    }

    // Add device
    devices.push({
      deviceId,
      type: deviceType,
      activatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await ref.update({ devices, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

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
