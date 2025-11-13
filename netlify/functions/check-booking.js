// ============================================
// Netlify Function - Verificare Rezervări
// ============================================
// Acest function verifică dacă un slot de timp este deja rezervat

const { Pool } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
    // Doar GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Extrage parametrii din query string
        const { date, timeSlot } = event.queryStringParameters || {};

        if (!date || !timeSlot) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Date și timeSlot sunt obligatorii' })
            };
        }

        // Conectare la Neon
        // Extensia Neon creează NETLIFY_DATABASE_URL
        const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
        
        if (!connectionString) {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'DATABASE_URL nu este configurat. Verificați variabilele de mediu în Netlify.' 
                })
            };
        }
        
        const pool = new Pool({
            connectionString: connectionString
        });

        // Verifică dacă slotul este rezervat
        const query = `
            SELECT id FROM bookings 
            WHERE date = $1 AND time_slot = $2
            LIMIT 1
        `;
        const result = await pool.query(query, [date, timeSlot]);

        await pool.end();

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                isBooked: result.rows.length > 0 
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Eroare la verificare în baza de date' })
        };
    }
};

