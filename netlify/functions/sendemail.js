// netlify/functions/sendemail.js
import nodemailer from "nodemailer";

export const handler = async (event) => {
  try {
    const { to, subject, message } = JSON.parse(event.body || "{}");

    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Champs requis manquants (to, subject, message).",
        }),
      };
    }

    // Récupération sécurisée des variables d’environnement
    const smtpHost = process.env.BNV_SMTP_HOST;
    const smtpPort = process.env.BNV_SMTP_PORT;
    const smtpUser = process.env.BNV_SENDER;
    const smtpPass = process.env.BNV_API_KEY;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: "Variables SMTP manquantes sur Netlify.",
        }),
      };
    }

    // Création du transporteur Nodemailer pour Brevo
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: false, // TLS STARTTLS
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Envoi du mail
    const info = await transporter.sendMail({
      from: `"Brainova Team" <${smtpUser}>`,
      to,
      subject,
      html: `<div style="font-family:sans-serif;line-height:1.5;">
        <h2>📨 ${subject}</h2>
        <p>${message}</p>
        <hr>
        <small>Envoyé automatiquement par Brainova via Netlify</small>
      </div>`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email envoyé avec succès ✅",
        info: info.response || "OK",
      }),
    };
  } catch (err) {
    console.error("Erreur sendemail.js:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message || "Erreur interne du serveur.",
      }),
    };
  }
};
