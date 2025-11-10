import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // ✅ Autorise les requêtes CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // ✅ Vérifie la méthode
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // ✅ Protège contre les corps vides (évite SyntaxError: Unexpected end of JSON input)
    const body = event.body ? JSON.parse(event.body) : {};

    // ✅ Valeurs par défaut si le front n’envoie rien
    const priceId = body.priceId || "price_1SQPWLP5iQ9gRxAtJ6zvc3fa"; // ton prix 1€
    const successUrl = body.successUrl || "https://brainovafirst.netlify.app/success.html?premium=1";
    const cancelUrl = body.cancelUrl || "https://brainovafirst.netlify.app/cancel.html";
    const customerEmail = body.customerEmail || "anonymous@brainova.online";

    // ✅ Crée la session Stripe Checkout (mode abonnement)
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
        user_email: customerEmail
      }
    });

    console.log("✅ Session Stripe créée avec succès:", session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: session.url,
        sessionId: session.id
      })
    };

  } catch (error) {
    console.error("❌ Stripe checkout error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to create checkout session",
        details: error.message
      })
    };
  }
}
