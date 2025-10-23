import Stripe from 'stripe';

// Utiliser les variables d'environnement Netlify (plus sécurisé)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event, context) {
  // Gérer les requêtes OPTIONS pour CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    console.log('🚀 Creating Stripe checkout session...');
    
    // Déterminer l'URL de retour en fonction de l'origine de la demande
    const origin = event.headers.origin || event.headers.referer || 'https://brainovafirst.netlify.app';
    let successUrl, cancelUrl;
    
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('file://')) {
      // Demande locale - rediriger vers la page de confirmation
      successUrl = 'https://brainovafirst.netlify.app/success.html?source=local&premium=activated&payment=completed';
      cancelUrl = 'https://brainovafirst.netlify.app/cancel.html?source=local&canceled=true';
    } else {
      // Demande depuis Netlify - redirection normale
      successUrl = 'https://brainovafirst.netlify.app/?success=true&premium=activated&payment=completed';
      cancelUrl = 'https://brainovafirst.netlify.app/?canceled=true&reason=user_canceled';
    }
    
    console.log('🎯 URLs de redirection:', { successUrl, cancelUrl, origin });
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Paiement unique de 20€
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Brainova Premium - Accès Annuel',
              description: '🧠 Débloquez les 36 jeux intelligents • Connexion/inscription activées • Accès premium complet',
              images: ['https://brainovafirst.netlify.app/favicon.ico']
            },
            unit_amount: 2000, // 20.00 EUR en centimes
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        product: 'brainova_premium',
        type: 'yearly_access',
        version: '2.0',
        timestamp: new Date().toISOString()
      },
      // Configuration pour les tests
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'CA', 'US', 'GB']
      }
    });

    console.log('✅ Session created successfully:', {
      sessionId: session.id,
      url: session.url,
      mode: session.mode,
      amount: session.amount_total
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        url: session.url,
        sessionId: session.id,
        amount: '20.00 EUR',
        message: 'Session créée avec succès'
      }),
    };
  } catch (err) {
    console.error('❌ Stripe error:', {
      message: err.message,
      type: err.type,
      code: err.code
    });
    
    return { 
      statusCode: 500, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: err.message,
        type: err.type || 'stripe_error',
        details: 'Impossible de créer la session de paiement',
        timestamp: new Date().toISOString()
      }) 
    };
  }
}