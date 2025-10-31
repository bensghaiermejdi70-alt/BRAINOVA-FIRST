import nodemailer from "nodemailer";

export async function handler(event) {
  try {
    const { to, subject, message } = JSON.parse(event.body);

    const transporter = nodemailer.createTransport({
      host: process.env.BNV_SMTP_HOST,  // ✅ renommé pour Netlify
      port: process.env.BNV_SMTP_PORT,
      auth: {
        user: process.env.BNV_SENDER,
        pass: process.env.BNV_API_KEY
      }
    });

    await transporter.sendMail({
      from: `Brainova <${process.env.BNV_SENDER}>`,
      to,
      subject,
      text: message
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "✅ Email sent successfully!" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
}
