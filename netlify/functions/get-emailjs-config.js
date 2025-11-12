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
        // Numele variabilelor: PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID, RECIPIENT_EMAIL
        const publicKey = process.env.PUBLIC_KEY;
        const serviceId = process.env.SERVICE_ID;
        const templateId = process.env.TEMPLATE_ID;
        const recipientEmail = process.env.RECIPIENT_EMAIL;
        
        // Log pentru debugging (fără a expune valorile complete)
        console.log('Variabile de mediu EmailJS:', {
            hasPublicKey: !!publicKey,
            hasServiceId: !!serviceId,
            hasTemplateId: !!templateId,
            hasRecipientEmail: !!recipientEmail,
            publicKeyLength: publicKey ? publicKey.length : 0
        });
        
        const config = {
            PUBLIC_KEY: publicKey || '',
            SERVICE_ID: serviceId || '',
            TEMPLATE_ID: templateId || '',
            RECIPIENT_EMAIL: recipientEmail || ''
        };

        // Verifică dacă configurația este completă
        if (!config.PUBLIC_KEY || !config.SERVICE_ID || !config.TEMPLATE_ID) {
            const missing = [];
            if (!config.PUBLIC_KEY) missing.push('PUBLIC_KEY');
            if (!config.SERVICE_ID) missing.push('SERVICE_ID');
            if (!config.TEMPLATE_ID) missing.push('TEMPLATE_ID');
            
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: `EmailJS nu este configurat complet. Variabilele de mediu lipsă: ${missing.join(', ')}. Verificați în Netlify Dashboard > Site settings > Environment variables.` 
                })
            };
        }
        
        // Verifică dacă RECIPIENT_EMAIL este setat
        if (!config.RECIPIENT_EMAIL || config.RECIPIENT_EMAIL === '') {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'RECIPIENT_EMAIL nu este configurat. Adăugați variabila de mediu RECIPIENT_EMAIL în Netlify.' 
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate', // Fără cache pentru configurație
                'Pragma': 'no-cache',
                'Expires': '0'
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

