// ============================================
// Netlify Function - Obține Rezervări pentru o Dată
// ============================================
// Acest function returnează toate rezervările pentru o dată specifică

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
        // Extrage parametrul date din query string
        const { date } = event.queryStringParameters || {};

        if (!date) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Parametrul date este obligatoriu' })
            };
        }

        // Conectare la Neon
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        // Obține toate rezervările pentru data specificată
        const query = `
            SELECT time_slot FROM bookings 
            WHERE date = $1
        `;
        const result = await pool.query(query, [date]);

        await pool.end();

        // Returnează doar sloturile de timp rezervate
        const bookedSlots = result.rows.map(row => row.time_slot);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                date: date,
                bookedSlots: bookedSlots 
            })
        };

    } catch (error) {
        console.error('Eroare la obținere rezervări:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Eroare la obținere rezervări din baza de date' })
        };
    }
};

