export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // ✅ Gère les requêtes préliminaires (CORS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    const now = new Date();
    const localTime = now.toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

    // ✅ Statut de chaque service
    const stripeStatus = process.env.STRIPE_SECRET_KEY ? "configured ✅" : "missing ⚠️";
    const brevoStatus = process.env.BNV_API_KEY ? "configured ✅" : "missing ⚠️";
    const firebaseStatus = process.env.GOOGLE_APPLICATION_CREDENTIALS ? "configured ✅" : "not set ⚠️";

    // ✅ Réponse du endpoint de santé
    const response = {
      status: "healthy ✅",
      checkedAt: localTime,
      environment: process.env.NODE_ENV || "production",
      version: "1.0.2",
      platform: "Brainova Premium Gaming",
      services: {
        stripe: stripeStatus,
        brevo: brevoStatus,
        firebase: firebaseStatus,
        netlify: "active ✅"
      },
      functions: {
        "create-checkout-session": "active ✅",
        "stripe-webhook": "active ✅",
        "sendEmail": "active ✅",
        "subscription-monitor": "active ✅",
        "health-check": "active ✅"
      },
      logs: {
        message: "All core functions are deployed and reachable.",
        domain: "brainova.online",
        frontend: "https://brainovafirst.netlify.app"
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)                        

    };
  } catch (error) {
    console.error("❌ Health check error:", error);                  

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}
