-- ============================================
-- Schema Baza de Date Neon PostgreSQL
-- ============================================
-- Rulați acest script în Neon Console pentru a crea tabelul

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),  -- Email opțional (NULL permis)
    phone VARCHAR(50) NOT NULL,
    details TEXT,
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, time_slot)
);

-- Index pentru căutări rapide după dată
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

-- Index pentru căutări după dată și slot
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON bookings(date, time_slot);

