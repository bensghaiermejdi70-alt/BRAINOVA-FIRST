const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AWS = require('aws-sdk');

// Configuration AWS SES (assure-toi que la région est correcte)
AWS.config.update({ region: 'us-east-1' });
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const sig = event.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid signature: ${err.message}` }) };
    }

    // 🔔 Gestion des événements Stripe
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const customerEmail = session.customer_email || session.customer_details?.email;

        console.log(`✅ Paiement réussi : ${session.id}, client : ${customerEmail}`);

        // ✉️ Envoi d'un e-mail de confirmation d'abonnement via AWS SES
        if (customerEmail) {
          const params = {
            Source: 'noreply@brainova.online',
            Destination: { ToAddresses: [customerEmail] },
            Message: {
              Subject: { Data: '🎉 Confirmation de votre abonnement Brainova Premium' },
              Body: {
                Html: {
                  Data: `
                    <h2>Merci pour votre abonnement à Brainova Premium !</h2>
                    <p>Vous avez maintenant accès à tous les jeux premium.</p>
                    <p>🌐 Accédez à votre espace : <a href="https://brainovafirst.netlify.app">Brainova</a></p>
                    <hr/>
                    <p>Votre abonnement est valable 1 an. Vous recevrez un rappel 15 jours avant expiration.</p>
                  `
                }
              }
            }
          };

          try {
            await ses.sendEmail(params).promise();
            console.log(`✅ Email de confirmation envoyé à ${customerEmail}`);
          } catch (emailError) {
            console.error('❌ Erreur envoi email SES:', emailError);
          }
        }
        break;
      }

      case 'invoice.upcoming': {
        // 🔔 15 jours avant expiration — rappel de renouvellement
        const invoice = stripeEvent.data.object;
        const customerEmail = invoice.customer_email || invoice.customer_details?.email;

        if (customerEmail) {
          const params = {
            Source: 'noreply@brainova.online',
            Destination: { ToAddresses: [customerEmail] },
            Message: {
              Subject: { Data: '🕒 Votre abonnement Brainova arrive bientôt à expiration' },
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
          try {
            await ses.sendEmail(params).promise();
            console.log(`📧 Rappel 15 jours avant expiration envoyé à ${customerEmail}`);
          } catch (emailError) {
            console.error('Erreur email rappel 15j:', emailError);
          }
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
                    <p>Votre abonnement est maintenant expiré. Les jeux premium sont verrouillés.</p>
                    <p>Vous pouvez le réactiver à tout moment ici : <a href="https://brainovafirst.netlify.app">Réactiver mon abonnement</a></p>
                  `
                }
              }
            }
          };
          try {
            await ses.sendEmail(params).promise();
            console.log(`❌ Email d'expiration envoyé à ${customerEmail}`);
          } catch (emailError) {
            console.error('Erreur email expiration:', emailError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true, type: stripeEvent.type }) };

  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Webhook failed', details: error.message }) };
  }
};
