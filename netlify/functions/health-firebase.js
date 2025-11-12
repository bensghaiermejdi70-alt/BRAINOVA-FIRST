// ✅ Brainova – Health Check Firebase (Production via FIREBASE_KEY)

import admin from "firebase-admin";

export const handler = async () => {
  try {
    // 🔐 Récupère la clé depuis les variables d'environnement Netlify
    if (!process.env.FIREBASE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: "❌ FIREBASE_KEY manquante",
          message: "Variable d’environnement non définie sur Netlify.",
        }),
      };
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    // 🔍 Test Firestore
    const db = admin.firestore();
    const testDoc = db.collection("health").doc("firebase");
    await testDoc.set({
      ok: true,
      checkedAt: new Date().toISOString(),
      project: serviceAccount.project_id || "unknown",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "✅ Firebase connecté avec succès",
        project: serviceAccount.project_id,
        message: "Test Firestore réussi ✅",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "❌ Erreur Firebase",
        message: err.message,
      }),
    };
  }
};
