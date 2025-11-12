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
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
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
        console.error('Eroare la verificare:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Eroare la verificare în baza de date' })
        };
    }
};

