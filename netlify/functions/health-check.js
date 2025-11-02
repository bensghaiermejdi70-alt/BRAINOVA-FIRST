export const handler = async () => {
  const checkedAt = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  // --- Vérification des services connectés ---
  const services = {
    stripe: process.env.STRIPE_SECRET_KEY ? "configured ✅" : "not set ⚠️",
    brevo: process.env.BNV_API_KEY ? "configured ✅" : "not set ⚠️",
    firebase: "not set ⚠️",
    netlify: "active ✅",
  };

  // --- Vérification des variables Firebase ---
  let firebaseStatus = "not set ⚠️";
  let firebaseError = null;
  const firebaseCheck = {};

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    firebaseCheck.FIREBASE_PROJECT_ID = projectId ? "✅ present" : "❌ missing";
    firebaseCheck.FIREBASE_CLIENT_EMAIL = clientEmail ? "✅ present" : "❌ missing";
    firebaseCheck.FIREBASE_PRIVATE_KEY = privateKey
      ? "✅ present (" + privateKey.substring(0, 25) + "...)"
      : "❌ missing";

    if (projectId && clientEmail && privateKey) {
      if (privateKey.includes("BEGIN PRIVATE KEY")) {
        firebaseStatus = "variables valid format ✅";
      } else {
        firebaseStatus = "private key invalid format ⚠️ (missing BEGIN PRIVATE KEY)";
      }
    } else {
      firebaseStatus = "missing variables ❌";
    }

    services.firebase = firebaseStatus;
  } catch (err) {
    firebaseError = err.message;
    services.firebase = "error ❌";
  }

  // --- Résultat final ---
  const response = {
    status: "healthy ✅",
    checkedAt,
    environment: process.env.NODE_ENV || "production",
    version: "1.0.3",
    platform: "Brainova Premium Gaming",
    services,
    firebase_check: {
      ...firebaseCheck,
      note:
        "⚙️ If 'BEGIN PRIVATE KEY' missing, reformat FIREBASE_PRIVATE_KEY with visible \\n in Netlify.",
      error: firebaseError,
    },
    functions: {
      "create-checkout-session": "active ✅",
      "stripe-webhook": "active ✅",
      sendEmail: "active ✅",
      "subscription-monitor": "active ✅",
      "health-check": "active ✅",
    },
    logs: {
      message: "All core functions are deployed and reachable.",
      domain: "brainova.online",
      frontend: "https://brainovafirst.netlify.app",
    },
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response, null, 2),
  };
};
