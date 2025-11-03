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

    console.log("📨 Tentative d’envoi via Brevo à :", to);

    // ✅ Transporteur SMTP — Port 465 / TLS direct
    const transporter = nodemailer.createTransport({
      host: process.env.BNV_SMTP_HOST || "smtp-relay.brevo.com",
      port: 465, // ✅ TLS complet
      secure: true, // obligatoire pour port 465
      auth: {
        user: process.env.BNV_SENDER, // noreply@brainova.online
        pass: process.env.BNV_API_KEY, // clé SMTP Brevo xsmtpsib-...
      },
      tls: {
        // Empêche Netlify de rejeter le certificat
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `Brainova <${process.env.BNV_SENDER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color:#0077ff;">${subject}</h2>
          <p>${message}</p>
          <hr style="border:0;border-top:1px solid #eee;margin:20px 0;">
          <small style="color:#666;">© ${new Date().getFullYear()} Brainova – Netlify Secure Mail</small>
        </div>
      `,
    });

    console.log("✅ Email envoyé :", info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email envoyé avec succès via Brevo (TLS) ✅",
      }),
    };
  } catch (error) {
    console.error("❌ Erreur sendemail.js :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || "Erreur interne du serveur",
      }),
    };
  }
};
