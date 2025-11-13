// ✅ netlify/functions/activate-device.js
// Enregistre un appareil (PC ou Mobile) pour un compte premium

import admin from "firebase-admin";

if (!admin.apps.length) {
  const key = JSON.parse(process.env.FIREBASE_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(key),
  });
}

const db = admin.firestore();

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const email = event.queryStringParameters?.email;
  const deviceId = event.queryStringParameters?.deviceId;
  const deviceType = event.queryStringParameters?.type;

  if (!email || !deviceId || !deviceType) {
    return {
      statusCode: 400,
      headers,
      body: "Missing parameters",
    };
  }

  const ref = db.collection("premium_devices").doc(email);
  const snap = await ref.get();

  // 1️⃣ Si aucun appareil enregistré → ajouter le premier
  if (!snap.exists) {
    await ref.set({
      email,
      devices: [
        {
          deviceId,
          type: deviceType,
          activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      ],
    });
    return { statusCode: 200, headers, body: "DEVICE_ADDED" };
  }

  const data = snap.data();
  const devices = data.devices || [];

  // 2️⃣ Limite = 2 appareils
  if (devices.length >= 2) {
    return { statusCode: 403, headers, body: "LIMIT_REACHED" };
  }

  // 3️⃣ Ajouter un nouvel appareil
  devices.push({
    deviceId,
    type: deviceType,
    activatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await ref.update({ devices });

  return { statusCode: 200, headers, body: "DEVICE_ADDED" };
}
