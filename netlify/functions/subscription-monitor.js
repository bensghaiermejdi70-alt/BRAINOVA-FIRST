import nodemailer from "nodemailer";
import admin from "firebase-admin";

// ✅ Initialisation sécurisée de Firebase (unique et compatible Netlify)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    console.warn("⚠️ Firebase non configuré, passage en lecture seule :", error.message);
  }
}

export async function handler() {
  try {
    const db = admin.firestore();
    const subsRef = db.collection("subscriptions");
    const snapshot = await subsRef.get();

    const today = new Date();
    console.log(`📅 Vérification des abonnements - ${today.toISOString()}`);

    // ✅ Transporteur SMTP (Brevo)
    const transporter = nodemailer.createTransport({
      host: process.env.BNV_SMTP_HOST,
      port: process.env.BNV_SMTP_PORT,
      auth: {
        user: process.env.BNV_SENDER,
        pass: process.env.BNV_API_KEY
      }
    });

    let emailsSent = 0;
    let expiredCount = 0;

    for (const doc of snapshot.docs) {
      const sub = doc.data();
      if (!sub.active || !sub.expiresAt) continue;

      const expires = sub.expiresAt.toDate
        ? sub.expiresAt.toDate()
        : new Date(sub.expiresAt);
      const diffDays = Math.ceil((expires - today) / (1000 * 60 * 60 * 24));

      // 🔔 Rappel à J-15 ou J-1
      if (diffDays === 15 || diffDays === 1) {
        const subject =
          diffDays === 15
            ? "🕒 Votre abonnement expire dans 15 jours"
            : "⚠️ Dernier rappel - Votre abonnement expire demain !";

        const body = `
          <h3>${subject}</h3>
          <p>Bonjour ${sub.email},</p>
          <p>Votre abonnement Brainova expire le <strong>${expires.toLocaleDateString()}</strong>.</p>
          <p>Renouvelez-le ici : <a href="https://brainovafirst.netlify.app/">Brainova Platform</a></p>
          <hr/>
          <p>Merci d'utiliser Brainova 🎮</p>
        `;

        try {
          await transporter.sendMail({
            from: `Brainova <${process.env.BNV_SENDER}>`,
            to: sub.email,
            subject,
            html: body
          });
          emailsSent++;
          console.log(`📧 Rappel envoyé à ${sub.email} (J-${diffDays})`);
        } catch (emailError) {
          console.error(`❌ Erreur d'envoi d'email à ${sub.email}:`, emailError.message);
        }
      }

      // 🔒 Si expiré
      if (diffDays <= 0 && sub.active) {
        await subsRef.doc(doc.id).update({ active: false });
        expiredCount++;
        console.log(`🔒 Abonnement expiré pour ${sub.email}`);
      }
    }

    console.log(`✅ Monitoring terminé : ${emailsSent} rappels envoyés, ${expiredCount} abonnements expirés.`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,                                                 
        message: "Subscription monitoring completed.",             
        emailsSent,
        expiredCount
      })
    };
  } catch (error) {
    console.error("❌ Subscription monitor error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
}
