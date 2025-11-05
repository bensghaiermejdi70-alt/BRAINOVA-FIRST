// ✅ Fonction Netlify : Vérification du statut Premium Stripe
// -----------------------------------------------------------
// Cette fonction est appelée par brainova-access.js pour vérifier
// si l’utilisateur a un abonnement actif sur Stripe.

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  // Autoriser CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    // ⚙️ Exemple simple : recherche d’un abonnement actif
    // (dans un vrai système, tu utiliseras l’e-mail de l’utilisateur connecté)
    const subscriptions = await stripe.subscriptions.list({
      limit: 1,
      status: "active",
    });

    if (subscriptions.data.length > 0) {
      console.log("✅ Abonnement Premium trouvé.");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ active: true }),
      };
    } else {
      console.log("🟡 Aucun abonnement actif trouvé.");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ active: false }),
      };
    }
  } catch (error) {
    console.error("❌ Erreur Stripe :", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
