// ✅ Brainova Premium – Create Checkout Session (Stripe + Netlify)
// Version stable corrigée 2025-11-12

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // ✅ Gérer la pré-vérification (CORS)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // 🚫 Si autre méthode HTTP que POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // 📨 Récupération des données envoyées depuis le front
    const { priceId, successUrl, cancelUrl, customerEmail } = JSON.parse(event.body);

    // 🚨 Vérifie que les paramètres essentiels sont bien présents
    if (!priceId || !successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required parameters: priceId, successUrl, cancelUrl",
        }),
      };
    }

    // ✅ Crée la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_creation: "always",
      metadata: {
        product: "brainova-premium",
        platform: "brainova-netlify",
        user_email: customerEmail || "unknown",
      },
    });

    // ✅ Réponse envoyée au frontend avec l'URL Stripe
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
    };
  } catch (error) {
    // ❌ Gestion d’erreurs Stripe
    console.error("❌ Stripe checkout error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to create checkout session",
        details: error.message,
      }),
    };
  }
}
