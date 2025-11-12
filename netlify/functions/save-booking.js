// ============================================
// Netlify Function - Salvare Rezervare în Neon
// ============================================
// Acest function salvează rezervările în baza de date Neon PostgreSQL

const { Pool } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
    // Doar POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parsează datele din request
        const bookingData = JSON.parse(event.body);

        // Validare date
        if (!bookingData.date || !bookingData.timeSlot || !bookingData.name || !bookingData.email || !bookingData.phone) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Date incomplete' })
            };
        }

        // Conectare la Neon
        // Connection string-ul vine din variabilele de mediu Netlify
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        // Verifică dacă slotul este deja rezervat
        const checkQuery = `
            SELECT id FROM bookings 
            WHERE date = $1 AND time_slot = $2
            LIMIT 1
        `;
        const checkResult = await pool.query(checkQuery, [bookingData.date, bookingData.timeSlot]);

        if (checkResult.rows.length > 0) {
            await pool.end();
            return {
                statusCode: 409,
                body: JSON.stringify({ error: 'Acest slot este deja rezervat' })
            };
        }

        // Inserează rezervarea
        const insertQuery = `
            INSERT INTO bookings (name, email, phone, details, date, time_slot, booked_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
        `;
        const insertResult = await pool.query(insertQuery, [
            bookingData.name,
            bookingData.email,
            bookingData.phone,
            bookingData.details || '',
            bookingData.date,
            bookingData.timeSlot
        ]);

        await pool.end();

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                id: insertResult.rows[0].id,
                message: 'Rezervarea a fost salvată cu succes' 
            })
        };

    } catch (error) {
        console.error('Eroare la salvare:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Eroare la salvare în baza de date' })
        };
    }
};

