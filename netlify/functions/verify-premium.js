// ✅ Fonction Netlify : Vérification du statut Premium Stripe (version Brainova v3)
// -----------------------------------------------------------
// Cette fonction vérifie si un utilisateur possède un abonnement actif
// et permet aussi la mise à jour (depuis le webhook Stripe).

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    // 🧩 Si c’est un POST (appelé par le webhook pour activer/désactiver Premium)
    if (event.httpMethod === "POST") {
      const body = event.body ? JSON.parse(event.body) : {};
      const { email, premium } = body;

      if (!email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing email parameter" }),
        };
      }

      // ⚙️ Ici tu pourrais stocker l’état premium dans une base (Firebase, etc.)
      console.log(`💾 Synchronisation webhook → ${email} = ${premium ? "Premium" : "Free"}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    // 🧩 Si c’est un GET (appelé par le front via brainova-access.js)
    if (event.httpMethod === "GET") {
      const email = event.queryStringParameters?.email;

      if (!email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing email parameter" }),
        };
      }

      // 🔎 Recherche d’abonnement actif pour cet e-mail
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length === 0) {
        console.log(`🟡 Aucun client Stripe trouvé pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: false }) };
      }

      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        console.log(`✅ Abonnement actif trouvé pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: true }) };
      } else {
        console.log(`🟡 Aucun abonnement actif pour ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ active: false }) };
      }
    }

    // ❌ Autre méthode non autorisée
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  } catch (error) {
    console.error("❌ Erreur verify-premium :", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
