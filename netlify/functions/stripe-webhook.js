// ✅ Stripe Webhook - Brainova (via API Brevo, sans SMTP)
// Version finale sécurisée et compatible Netlify Production

import Stripe from "stripe";
import fetch from "node-fetch";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BREVO_API_KEY = process.env.BNV_API_KEY; // xkeysib-xxxx
const BREVO_SENDER = process.env.BNV_SENDER || "noreply@brainova.online";

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Préflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Méthode non autorisée" }),
    };
  }

  try {
    const sig = event.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let stripeEvent;

    // ✅ Vérification de la signature Stripe
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
      console.log(`✅ Stripe event reçu : ${stripeEvent.type}`);
    } catch (err) {
      console.error("❌ Signature Stripe invalide :", err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: err.message }),
      };
    }

    // 📬 Fonction d’envoi via API Brevo
    const sendEmail = async (to, subject, html) => {
      try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: { email: BREVO_SENDER, name: "Brainova" },
            to: [{ email: to }],
            subject,
            htmlContent: html,
          }),
        });

        const result = await response.json();
        if (response.ok) {
          console.log(`📧 Email envoyé à ${to} via Brevo : ${subject}`);
        } else {
          console.error("❌ Erreur API Brevo :", result);
        }
      } catch (err) {
        console.error("❌ Erreur réseau API Brevo :", err.message);
      }
    };

    // 🔔 Gestion des événements Stripe
    switch (stripeEvent.type) {
      // ✅ Paiement réussi (session ou facture)
      case "checkout.session.completed":
      case "invoice.payment_succeeded":
      case "invoice_payment.paid": { // ✅ ajouté pour ton cas réel
        const session = stripeEvent.data.object;
        const customerEmail =
          session.customer_email || session.customer_details?.email;
        if (customerEmail) {
          await sendEmail(
            customerEmail,
            "🎉 Confirmation de votre abonnement Brainova Premium",
            `
              <div style="font-family:Arial,sans-serif;color:#333">
                <h2>Merci pour votre abonnement à Brainova Premium !</h2>
                <p>Votre paiement a bien été reçu ✅</p>
                <p>➡️ Cliquez ci-dessous pour accéder à la plateforme :</p>
                <a href="https://brainovafirst.netlify.app"
                   style="display:inline-block;padding:12px 24px;background:#7b2ff7;color:#fff;border-radius:8px;text-decoration:none;">
                   Accéder à Brainova
                </a>
                <br><br>
                <small>Votre abonnement est actif pour 1 an. Vous recevrez un rappel avant expiration.</small>
              </div>
            `
          );
        }
        break;
      }

      // ⚠️ Rappel d’expiration
      case "invoice.upcoming": {
        const invoice = stripeEvent.data.object;
        const customerEmail =
          invoice.customer_email || invoice.customer_details?.email;
        if (customerEmail) {
          await sendEmail(
            customerEmail,
            "🕒 Votre abonnement Brainova expire bientôt",
            `
              <p>Bonjour,</p>
              <p>Votre abonnement Brainova Premium expirera dans 15 jours.</p>
              <p><a href="https://brainovafirst.netlify.app">Renouvelez maintenant</a> pour conserver vos avantages Premium 🎮</p>
            `
          );
        }
        break;
      }

      // ❌ Paiement échoué
      case "invoice.payment_failed": {
        const failed = stripeEvent.data.object;
        const customerEmail =
          failed.customer_email || failed.customer_details?.email;
        if (customerEmail) {
          await sendEmail(
            customerEmail,
            "⚠️ Votre abonnement Brainova a expiré",
            `
              <p>Bonjour,</p>
              <p>Votre abonnement a expiré ou le paiement a échoué.</p>
              <p>Vous pouvez le réactiver ici :</p>
              <a href="https://brainovafirst.netlify.app"
                 style="display:inline-block;padding:10px 20px;background:#e63946;color:white;border-radius:6px;text-decoration:none;">
                 Réactiver mon abonnement
              </a>
            `
          );
        }
        break;
      }

      default:
        console.log(`ℹ️ Événement non géré : ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, event: stripeEvent.type }),
    };
  } catch (error) {
    console.error("❌ Erreur Webhook Stripe :", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
}
