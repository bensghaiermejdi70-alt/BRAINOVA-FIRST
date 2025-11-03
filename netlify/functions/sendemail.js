import nodemailer from "nodemailer";

export const handler = async (event) => {
  try {
    const { to, subject, message } = JSON.parse(event.body);

    // Vérification basique
    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Champs requis manquants" }),
      };
    }

    // Transport SMTP Brevo
    const transporter = nodemailer.createTransport({
      host: process.env.BNV_SMTP_HOST,
      port: parseInt(process.env.BNV_SMTP_PORT || "587", 10),
      secure: false, // STARTTLS
      auth: {
        user: process.env.BNV_SENDER,
        pass: process.env.BNV_API_KEY,
      },
    });

    // Envoi de l’e-mail
    const info = await transporter.sendMail({
      from: `Brainova <${process.env.BNV_SENDER}>`,
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;">
               <h2>${subject}</h2>
               <p>${message}</p>
               <br>
               <small>© Brainova – Netlify Production</small>
             </div>`,
    });

    console.log("✅ Email envoyé :", info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email envoyé avec succès ✅" }),
    };
  } catch (error) {
    console.error("❌ Erreur sendemail.js :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
