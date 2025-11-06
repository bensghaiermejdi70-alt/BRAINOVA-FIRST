// ===========================================================
// 🌐 BRAINOVA – create-checkout-session.js (Production LIVE 1€)
// ===========================================================
// Produit : Brainova Premium Test 1 €
// Prix : price_1SQPWLP5iQ9gRxAtJ6zvc3fa
// Objectif : Paiement réel de 1€ pour valider le déblocage automatique Premium
// ===========================================================

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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // ✅ ID de prix 1 € (LIVE)
    const PRICE_ID = "price_1SQPWLP5iQ9gRxAtJ6zvc3fa";

    // ✅ Crée une session Stripe Checkout réelle
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      mode: "payment", // paiement unique, pas abonnement
      success_url: "https://brainovafirst.netlify.app/success.html?premium=1",
      cancel_url: "https://brainovafirst.netlify.app/cancel.html",
      billing_address_collection: "required",
      allow_promotion_codes: false,
      customer_creation: "always",
      metadata: {
        product: "brainova-premium-test-1eur",
        platform: "brainova-netlify",
      }
    });

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
