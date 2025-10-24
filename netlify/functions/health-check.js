exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Health check endpoint
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      functions: {
        'create-checkout-session': 'active',
        'stripe-webhook': 'active',
        'health-check': 'active'
      },
      services: {
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
        firebase: 'external',
        netlify: 'active'
      },
      version: '1.0.0',
      platform: 'Brainova Premium Gaming'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};