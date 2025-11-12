import admin from "firebase-admin";
import fs from "fs";
import path from "path";

export async function handler() {
  try {
    const keyPath = path.join(process.cwd(), "netlify/functions/firebase-key.json");
    const key = JSON.parse(fs.readFileSync(keyPath, "utf8"));

    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(key) });
    }

    const app = admin.app();
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "✅ Firebase initialisé avec succès",
        project: app.options.credential.projectId
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "❌ Erreur Firebase",
        message: err.message
      })
    };
  }
}
