import nodemailer from "nodemailer";

export const handler = async (event) => {
  try {
    const { to, subject, message } = JSON.parse(event.body || "{}");

    // ✅ Validation des champs
    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Champs requis manquants : to, subject, message",
        }),
      };
    }

    // ✅ Log minimal pour diagnostic (pas de secrets exposés)
    console.log("📤 Tentative d’envoi d’email via Brevo à :", to);

    // ✅ Configuration sécurisée du transporteur SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.BNV_SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.BNV_SMTP_PORT || "587", 10),
      secure: false, // STARTTLS (false pour 587)
      auth: {
        user: process.env.BNV_SENDER, // expéditeur vérifié
        pass: process.env.BNV_API_KEY, // clé SMTP Brevo
      },
      tls: {
        rejectUnauthorized: false, // évite les erreurs TLS sur Netlify
      },
    });

    // ✅ Email formaté proprement
    const info = await transporter.sendMail({
      from: `Brainova Support <${process.env.BNV_SENDER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color:#0077ff;">${subject}</h2>
          <p>${message}</p>
          <hr style="border:0;border-top:1px solid #eee;margin:20px 0;">
          <small style="color:#666;">© ${new Date().getFullYear()} Brainova — Powered by Netlify & Brevo</small>
        </div>
      `,
    });

    console.log("✅ Email envoyé avec succès :", info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email envoyé avec succès ✅",
      }),
    };
  } catch (error) {
    console.error("❌ Erreur sendemail.js :", error);

    // ✅ Gestion propre des erreurs SMTP
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || "Erreur interne du serveur",
      }),
    };
  }
};
