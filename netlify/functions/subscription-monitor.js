import nodemailer from "nodemailer";
import admin from "firebase-admin";

// ✅ Initialisation sécurisée de Firebase (évite les erreurs multiples)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    console.warn("⚠️ Firebase non configuré, mode lecture seule :", error.message);
  }
}

export async function handler() {
  try {
    const db = admin.firestore();
    const subsRef = db.collection("subscriptions");
    const snapshot = await subsRef.get();

    const today = new Date();

    // ✅ Configuration Brevo SMTP via Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.BNV_SMTP_HOST,
      port: process.env.BNV_SMTP_PORT,
      auth: {
        user: process.env.BNV_SENDER,
        pass: process.env.BNV_API_KEY
      }
    });

    for (const doc of snapshot.docs) {
      const sub = doc.data();
      if (!sub.active || !sub.expiresAt) continue;

      const expires = sub.expiresAt.toDate
        ? sub.expiresAt.toDate()
        : new Date(sub.expiresAt);

      const diffDays = Math.ceil((expires - today) / (1000 * 60 * 60 * 24));

      // 🔔 Envoi rappel à J-15 ou J-1
      if (diffDays === 15 || diffDays === 1) {
        const subject =
          diffDays === 15
            ? "🕒 Votre abonnement expire dans 15 jours"
            : "⚠️ Dernier rappel - Votre abonnement expire demain !";
        const body = `
          <h3>${subject}</h3>
          <p>Votre abonnement Brainova expire le ${expires.toLocaleDateString()}.</p>
          <p>Renouvelez ici : <a href="https://brainovafirst.netlify.app/">Brainova Platform</a></p>
        `;

        try {
          await transporter.sendMail({
            from: `Brainova <${process.env.BNV_SENDER}>`,
            to: sub.email,
            subject,
            html: body
          });
          console.log(`📧 Email de rappel envoyé à ${sub.email} (J-${diffDays})`);
        } catch (emailError) {
          console.error(`❌ Erreur envoi email pour ${sub.email}:`, emailError.message);
        }
      }

      // 🔒 Si expiré
      if (diffDays <= 0 && sub.active) {
        await subsRef.doc(doc.id).update({ active: false });
        console.log(`🔒 Abonnement expiré pour ${sub.email}`);
      }
    }

    return { statusCode: 200, body: "✅ Subscription monitor OK" };
  } catch (error) {
    console.error("❌ Subscription monitor error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
