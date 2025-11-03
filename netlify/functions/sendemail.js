import nodemailer from "nodemailer";

export const handler = async (event) => {
  try {
    const { to, subject, message } = JSON.parse(event.body);

    // ✅ Vérification des champs obligatoires
    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Champs requis manquants" }),
      };
    }

    console.log("📤 Tentative d’envoi d’email via Brevo TLS à :", to);

    // ✅ Transport SMTP sécurisé (TLS)
    const transporter = nodemailer.createTransport({
      host: process.env.BNV_SMTP_HOST,
      port: parseInt(process.env.BNV_SMTP_PORT || "465", 10),
      secure: true, // ⚠️ Indispensable pour TLS (port 465)
      auth: {
        user: process.env.BNV_SENDER,
        pass: process.env.BNV_API_KEY,
      },
      tls: {
        rejectUnauthorized: false, // Permet d’éviter certaines erreurs SSL sur Netlify
      },
    });

    // ✅ Envoi du message
    const info = await transporter.sendMail({
      from: `Brainova <${process.env.BNV_SENDER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>${subject}</h2>
          <p>${message}</p>
          <br>
          <small>✅ Envoi effectué depuis Netlify (TLS 465) - Brainova</small>
        </div>
      `,
    });

    console.log("✅ Email envoyé :", info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email envoyé avec succès via TLS ✅" }),
    };
  } catch (error) {
    console.error("❌ Erreur sendemail.js :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
