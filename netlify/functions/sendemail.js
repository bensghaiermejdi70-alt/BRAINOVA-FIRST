// ✅ Envoi d'email via API Brevo (non SMTP)
import fetch from "node-fetch";

export const handler = async (event) => {
  try {
    const { to, subject, message } = JSON.parse(event.body);

    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Champs requis manquants" }),
      };
    }

    console.log("📤 Envoi via Brevo API à :", to);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
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
        htmlContent: `
          <div style="font-family: Arial, sans-serif;">
            <h2>${subject}</h2>
            <p>${message}</p>
            <br/>
            <small>✅ Envoi réussi via l’API Brevo – Brainova</small>
          </div>
        `,
      }),
    });

    const result = await response.json();
    console.log("📩 Réponse Brevo :", result);

    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: "Email envoyé avec succès ✅", result }),
      };
    } else {
      throw new Error(result.message || "Erreur d’envoi API Brevo");
    }
  } catch (error) {
    console.error("❌ Erreur sendemail.js :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
