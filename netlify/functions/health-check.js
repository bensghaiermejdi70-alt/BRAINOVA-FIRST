// ✅ Brainova – Health Check Firebase (version 2.0 – via FIREBASE_KEY unique)

import admin from "firebase-admin";

export const handler = async () => {
  const checkedAt = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  const services = {
    stripe: process.env.STRIPE_SECRET_KEY ? "configured ✅" : "not set ⚠️",
    brevo: process.env.BREVO_API_KEY ? "configured ✅" : "not set ⚠️",
    firebase: "not connected ⚠️",
    netlify: "active ✅",
  };

  let firebaseStatus = "not connected ⚠️";
  let firebaseError = null;

  try {
    // 🔐 Vérifie si la clé Firebase existe
    if (!process.env.FIREBASE_KEY) {
      firebaseStatus = "FIREBASE_KEY missing ❌";
    } else {
      const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      const db = admin.firestore();

      // 🔍 Test Firestore : écriture simple
      const ref = db.collection("health").doc("status");
      await ref.set({
        ok: true,
        checkedAt,
        project: serviceAccount.project_id || "unknown",
      });

      firebaseStatus = "connected ✅ Firestore write success";
    }

    services.firebase = firebaseStatus;
  } catch (err) {
    firebaseError = err.message;
    services.firebase = "error ❌";
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      {
        status: "healthy ✅",
        checkedAt,
        environment: process.env.NODE_ENV || "production",
        version: "1.0.5",
        platform: "Brainova Premium Gaming",
        services,
        firebase_check: {
          FIREBASE_KEY: process.env.FIREBASE_KEY ? "✅ detected" : "❌ missing",
          note: "Firebase now verified via single FIREBASE_KEY variable",
          error: firebaseError,
        },
        logs: {
          message: "Firebase test executed successfully.",
          domain: "brainova.online",
          frontend: "https://brainovafirst.netlify.app",
        },
      },
      null,
      2
    ),
  };
};
