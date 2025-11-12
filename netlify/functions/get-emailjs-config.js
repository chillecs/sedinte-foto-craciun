// ============================================
// Netlify Function - Returnează Configurația EmailJS
// ============================================
// Acest function returnează configurația EmailJS din variabilele de mediu Netlify

exports.handler = async (event, context) => {
    // Doar GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Citește variabilele de mediu din Netlify
        // Numele variabilelor: PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID
        const config = {
            PUBLIC_KEY: process.env.PUBLIC_KEY || '',
            SERVICE_ID: process.env.SERVICE_ID || '',
            TEMPLATE_ID: process.env.TEMPLATE_ID || '',
            RECIPIENT_EMAIL: process.env.RECIPIENT_EMAIL || 'cryssthrill@gmail.com'
        };

        // Verifică dacă configurația este completă
        if (!config.PUBLIC_KEY || !config.SERVICE_ID || !config.TEMPLATE_ID) {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'EmailJS nu este configurat complet. Verificați variabilele de mediu în Netlify (PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID).' 
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600' // Cache pentru 1 oră
            },
            body: JSON.stringify(config)
        };

    } catch (error) {
        console.error('Eroare la obținere config EmailJS:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Eroare la obținere configurație EmailJS' })
        };
    }
};

