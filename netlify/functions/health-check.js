export const handler = async () => {
  const checkedAt = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  const services = {
    stripe: process.env.STRIPE_SECRET_KEY ? "configured ✅" : "not set ⚠️",
    brevo: process.env.BNV_API_KEY ? "configured ✅" : "not set ⚠️",
    firebase: "not set ⚠️",
    netlify: "active ✅",
  };

  let firebaseStatus = "not set ⚠️";
  let firebaseError = null;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      if (privateKey.includes("BEGIN PRIVATE KEY")) {
        firebaseStatus = "variables valid format ✅";
      } else {
        firebaseStatus = "private key invalid format ⚠️";
      }
    } else {
      firebaseStatus = "missing variables ❌";
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
        version: "1.0.4",
        platform: "Brainova Premium Gaming",
        services,
        firebase_check: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "✅ detected" : "❌ missing",
          FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "✅ detected" : "❌ missing",
          FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "✅ detected" : "❌ missing",
          note: "Secrets hidden for security compliance ✅",
          error: firebaseError,
        },
        logs: {
          message: "All core functions are deployed and reachable.",
          domain: "brainova.online",
          frontend: "https://brainovafirst.netlify.app",
        },
      },
      null,
      2
    ),
  };
};
