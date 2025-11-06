// /netlify/functions/create-checkout-session-test1eur.js
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    // ✅ Pas besoin d’envoyer priceId : il est fixe pour ce test
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          // 🔸 Remplace ce price_id par celui associé à ton produit Test 1€
          price: "price_TN9qVOM8KtbdOX_TEST", 
          quantity: 1,
        },
      ],
      mode: "payment", // Simple paiement, pas d’abonnement
      success_url: "https://brainovafirst.netlify.app/success.html?premium=1",
      cancel_url: "https://brainovafirst.netlify.app/cancel.html",
      metadata: {
        product: "brainova-premium-test",
        source: "netlify-test"
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url, sessionId: session.id })
    };

  } catch (error) {
    console.error("❌ Stripe checkout error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to create checkout session", details: error.message })
    };
  }
}
