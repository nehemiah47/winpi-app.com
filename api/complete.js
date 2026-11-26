javascript
// Vercel Serverless Function for Pi server-side payment completion
export default async function handler(req, res) {
  // Allow POST requests only
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body safely whether Vercel already parsed it or passed a string
    let body = {};
    if (typeof req.body === 'string') {
      body = req.body.trim() ? JSON.parse(req.body) : {};
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }

    const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
    const txid = typeof body.txid === 'string' ? body.txid.trim() : '';

    // Validate paymentId and txid
    if (!paymentId || !txid) {
      return res.status(400).json({ error: 'Missing or invalid paymentId or txid' });
    }

    // Retrieve Pi Server API Key from environment variables
    const apiKey = typeof process.env.PI_API_KEY === 'string' ? process.env.PI_API_KEY.trim() : '';
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: PI_API_KEY is missing' });
    }

    // Call Pi Platform API to complete the payment with blockchain txid
    const piResponse = await fetch(
      `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      }
    );

    const data = await piResponse.json().catch(() => ({}));

    if (!piResponse.ok) {
      return res.status(piResponse.status).json({
        error: 'Failed to complete payment on Pi Network',
        details: data
      });
    }

    return res.status(200).json({
      completed: true,
      payment: data
    });
  } catch (error) {
    console.error('Pi payment completion error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
