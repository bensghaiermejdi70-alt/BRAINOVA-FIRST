// Désactive le parsing automatique du corps JSON par Netlify
exports.config = { bodyParser: false };

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AWS = require('aws-sdk');

// Configuration AWS SES
AWS.config.update({ region: 'us-east-1' });
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Vérifie si le secret est bien chargé
  console.log("🔐 STRIPE_WEBHOOK_SECRET:",
    process.env.STRIPE_WEBHOOK_SECRET ? "CHARGÉ ✅" : "ABSENT ❌"
  );

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent;

  try {
    // Utilise le corps brut (nécessaire pour vérifier la signature)
    stripeEvent = stripe.webhooks.constructEvent(
      Buffer.from(event.body, 'utf8'),
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error('❌ Signature Stripe invalide :', err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Signature invalide : ${err.message}` })
    };
  }

  console.log(`✅ Événement Stripe reçu : ${stripeEvent.type}`);

  // Gestion des événements Stripe
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const customerEmail = session.customer_email || session.customer_details?.email;

        console.log(`💰 Paiement confirmé pour : ${customerEmail}`);

        if (customerEmail) {
          const params = {
            Source: 'noreply@brainova.online',
            Destination: { ToAddresses: [customerEmail] },
            Message: {
              Subject: { Data: '🎉 Confirmation de votre abonnement Brainova Premium' },
              Body: {
                Html: {
                  Data: `
                    <h2>Merci pour votre abonnement à <strong>Brainova Premium</strong> !</h2>
                    <p>Vous avez maintenant accès à tous les jeux premium 🧠.</p>
                    <p>🌐 Accédez à votre espace : 
                      <a href="https://brainovafirst.netlify.app">Brainova</a></p>
                    <hr/>
                    <p>Votre abonnement est valable 1 an.<br>
                    Vous recevrez un rappel 15 jours avant expiration.</p>
                  `
                }
              }
            }
          };

          await ses.sendEmail(params).promise();
          console.log(`✅ Email de confirmation envoyé à ${customerEmail}`);
        }
        break;
      }

      case 'invoice.upcoming': {
        const invoice = stripeEvent.data.object;
        const customerEmail = invoice.customer_email || invoice.customer_details?.email;

        if (customerEmail) {
          const params = {
            Source: 'noreply@brainova.online',
            Destination: { ToAddresses: [customerEmail] },
            Message: {
              Subject: { Data: '🕒 Votre abonnement Brainova expire bientôt' },
              Body: {
                Html: {
                  Data: `
                    <p>Bonjour,</p>
                    <p>Votre abonnement Brainova Premium expirera dans 15 jours.</p>
                    <p>Renouvelez-le dès maintenant pour conserver vos avantages.</p>
                    <a href="https://brainovafirst.netlify.app">Renouveler maintenant</a>
                  `
                }
              }
            }
          };

          await ses.sendEmail(params).promise();
          console.log(`📧 Rappel 15 jours avant expiration envoyé à ${customerEmail}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const failed = stripeEvent.data.object;
        const customerEmail = failed.customer_email || failed.customer_details?.email;

        if (customerEmail) {
          const params = {
            Source: 'noreply@brainova.online',
            Destination: { ToAddresses: [customerEmail] },
            Message: {
              Subject: { Data: '⚠️ Votre abonnement Brainova a expiré' },
              Body: {
                Html: {
                  Data: `
                    <p>Bonjour,</p>
                    <p>Votre abonnement est maintenant expiré. Les jeux premium sont verrouillés 🔒.</p>
                    <p>Vous pouvez le réactiver à tout moment ici : 
                      <a href="https://brainovafirst.netlify.app">Réactiver mon abonnement</a></p>
                  `
                }
              }
            }
          };

          await ses.sendEmail(params).promise();
          console.log(`❌ Email d'expiration envoyé à ${customerEmail}`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Événement Stripe ignoré : ${stripeEvent.type}`);
    }
  } catch (emailError) {
    console.error('Erreur d’envoi SES ou de traitement :', emailError);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ received: true, type: stripeEvent.type })
  };
};
