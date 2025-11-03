import nodemailer from "nodemailer";

export const handler = async (event) => {
  try {
    const { to, subject, message } = JSON.parse(event.body || "{}");

    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Champs requis manquants" }),
      };
    }

    console.log("📤 Tentative d’envoi d’email via Brevo TLS à :", to);

    const transporter = nodemailer.createTransport({
      host: process.env.BNV_SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.BNV_SMTP_PORT || "465", 10),
      secure: true, // TLS implicit (port 465)
      auth: {
        user: process.env.BNV_SMTP_USER || process.env.BNV_SENDER,
        pass: process.env.BNV_API_KEY,
      },
      tls: {
        rejectUnauthorized: false, // utile sur Netlify pour éviter certaines erreurs SSL
      },
    });

    const info = await transporter.sendMail({
      from: `Brainova <${process.env.BNV_SENDER || process.env.BNV_SMTP_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>${subject}</h2>
          <p>${message}</p>
          <br>
          <small>✅ Envoi depuis Netlify (Brevo SMTP)</small>
        </div>
      `,
    });

    console.log("✅ Email envoyé :", info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email envoyé avec succès via TLS ✅", messageId: info.messageId }),
    };
  } catch (error) {
    console.error("❌ Erreur sendemail.js :", error);
    // Pour debug, renvoyer un message lisible (mais ne pas exposer de secrets)
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error && error.message ? error.message : String(error) }),
    };
  }
};
