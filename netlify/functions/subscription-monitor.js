import AWS from 'aws-sdk';
import admin from 'firebase-admin';

const ses = new AWS.SES({ region: 'us-east-1' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const handler = async () => {
  const db = admin.firestore();
  const subsRef = db.collection('subscriptions');
  const snapshot = await subsRef.get();

  const today = new Date();

  for (const doc of snapshot.docs) {
    const sub = doc.data();
    if (!sub.active || !sub.expiresAt) continue;

    const expires = sub.expiresAt.toDate ? sub.expiresAt.toDate() : new Date(sub.expiresAt);
    const diffDays = Math.ceil((expires - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 15 || diffDays === 1) {
      const subject =
        diffDays === 15
          ? '🕒 Votre abonnement expire dans 15 jours'
          : '⚠️ Dernier rappel - Votre abonnement expire demain !';
      const body = `
        <h3>${subject}</h3>
        <p>Votre abonnement Brainova expire le ${expires.toLocaleDateString()}.</p>
        <p>Renouvelez ici : <a href="https://brainovafirst.netlify.app/">Brainova Platform</a></p>
      `;

      await ses
        .sendEmail({
          Source: 'noreplay@brainova.online',
          Destination: { ToAddresses: [sub.email] },
          Message: { Subject: { Data: subject }, Body: { Html: { Data: body } } },
        })
        .promise();

      console.log(`📧 Email de rappel envoyé à ${sub.email} (J-${diffDays})`);
    }

    if (diffDays <= 0 && sub.active) {
      await subsRef.doc(sub.email).update({ active: false });
      console.log(`🔒 Abonnement expiré pour ${sub.email}`);
    }
  }

  return { statusCode: 200, body: 'Subscription monitor OK' };
};
