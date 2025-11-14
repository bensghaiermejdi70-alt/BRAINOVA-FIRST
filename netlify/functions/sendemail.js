// ✅ sendemail.js — Version PRODUCTION 2025
// Envoi d'emails Brevo 100% sécurisé + compatible webhook Premium

import fetch from "node-fetch";

export const handler = async (event) => {
  try {
    const { to, subject, html } = JSON.parse(event.body || "{}");

    // --- VALIDATION ---
    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Champs requis manquants (to, subject, html)",
        }),
      };
    }

    console.log("📤 Envoi Email via Brevo →", to);

    // --- ENVOI BREVO ---
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Brainova", email: "noreply@brainova.online" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await res.json();
    console.log("📨 Réponse Brevo :", data);

    if (!res.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: data.message || "Erreur API Brevo",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email envoyé avec succès ✔️",
        data,
      }),
    };

  } catch (err) {
    console.error("❌ sendemail.js ERROR :", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
