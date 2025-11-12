-- ============================================
-- Script SQL - Eliminare Coloană Email
-- ============================================
-- Rulați acest script în Neon Console pentru a elimina coloana email

-- Elimină coloana email din tabelul bookings
ALTER TABLE bookings DROP COLUMN IF EXISTS email;

-- Verifică structura tabelului după eliminare
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

