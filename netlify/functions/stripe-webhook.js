import Stripe from "stripe";
import nodemailer from "nodemailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
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
    const sig = event.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
      console.log(`✅ Stripe event received: ${stripeEvent.type}`);
    } catch (err) {
      console.error("❌ Invalid Stripe signature:", err.message);
      return { statusCode: 400, headers, body: JSON.stringify({ error: err.message }) };
    }

    // ✉️ Configuration Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.BNV_SMTP_HOST,
      port: process.env.BNV_SMTP_PORT,
      auth: {
        user: process.env.BNV_SENDER,
        pass: process.env.BNV_API_KEY
      }
    });

    // 📬 Fonction sécurisée d’envoi d’e-mail
    const sendEmail = async (to, subject, html) => {
      try {
        await transporter.sendMail({
          from: `Brainova <${process.env.BNV_SENDER}>`,
          to,
          subject,
          html
        });
        console.log(`📧 Email envoyé à ${to} : ${subject}`);
      } catch (err) {
        console.error(`❌ Échec de l’envoi d’email à ${to}:`, err.message);
      }
    };

    // 🔔 Gestion des événements Stripe
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (customerEmail) {
          await sendEmail(
            customerEmail,
            "🎉 Confirmation de votre abonnement Brainova Premium",
            `
              <h2>Merci pour votre abonnement à Brainova Premium !</h2>
              <p>Vous avez maintenant accès à tous les jeux premium.</p>
              <p>🌐 <a href="https://brainovafirst.netlify.app">Accéder à votre espace</a></p>
              <hr/>
              <p>Votre abonnement est valable 1 an. Vous recevrez un rappel 15 jours avant expiration.</p>
            `
          );
        }
        break;
      }

      case "invoice.upcoming": {
        const invoice = stripeEvent.data.object;
        const customerEmail = invoice.customer_email || invoice.customer_details?.email;
        if (customerEmail) {
          await sendEmail(
            customerEmail,
            "🕒 Votre abonnement Brainova expire bientôt",
            `
              <p>Bonjour,</p>
              <p>Votre abonnement Brainova Premium expirera dans 15 jours.</p>
              <p><a href="https://brainovafirst.netlify.app">Renouvelez dès maintenant</a> pour conserver vos avantages.</p>
            `
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const failed = stripeEvent.data.object;
        const customerEmail = failed.customer_email || failed.customer_details?.email;
        if (customerEmail) {
          await sendEmail(
            customerEmail,
            "⚠️ Votre abonnement Brainova a expiré",
            `
              <p>Bonjour,</p>
              <p>Votre abonnement est maintenant expiré. Les jeux premium sont verrouillés.</p>
              <p>Vous pouvez le réactiver à tout moment ici : <a href="https://brainovafirst.netlify.app">Réactiver mon abonnement</a></p>
            `
          );
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event: ${stripeEvent.type}`);     
    }                                                                                       
                                                                                    

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, event: stripeEvent.type })
    };
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
}
