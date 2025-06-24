-- Script para crear la tabla gastos_equipo con columnas dinámicas
-- Basado en el patrón de estudios_disenos_permisos

-- Drop existing table if exists
DROP TABLE IF EXISTS gastos_equipo CASCADE;

-- Create the table with dynamic month columns
CREATE TABLE gastos_equipo (
    id SERIAL PRIMARY KEY,
    concepto VARCHAR(255) NOT NULL,
    -- Columnas dinámicas para cada mes (3 meses antes + 36 meses después)
    amount_2024_01 NUMERIC(15, 2),
    amount_2024_02 NUMERIC(15, 2),
    amount_2024_03 NUMERIC(15, 2),
    amount_2024_04 NUMERIC(15, 2),
    amount_2024_05 NUMERIC(15, 2),
    amount_2024_06 NUMERIC(15, 2),
    amount_2024_07 NUMERIC(15, 2),
    amount_2024_08 NUMERIC(15, 2),
    amount_2024_09 NUMERIC(15, 2),
    amount_2024_10 NUMERIC(15, 2),
    amount_2024_11 NUMERIC(15, 2),
    amount_2024_12 NUMERIC(15, 2),
    amount_2025_01 NUMERIC(15, 2),
    amount_2025_02 NUMERIC(15, 2),
    amount_2025_03 NUMERIC(15, 2),
    amount_2025_04 NUMERIC(15, 2),
    amount_2025_05 NUMERIC(15, 2),
    amount_2025_06 NUMERIC(15, 2),
    amount_2025_07 NUMERIC(15, 2),
    amount_2025_08 NUMERIC(15, 2),
    amount_2025_09 NUMERIC(15, 2),
    amount_2025_10 NUMERIC(15, 2),
    amount_2025_11 NUMERIC(15, 2),
    amount_2025_12 NUMERIC(15, 2),
    amount_2026_01 NUMERIC(15, 2),
    amount_2026_02 NUMERIC(15, 2),
    amount_2026_03 NUMERIC(15, 2),
    amount_2026_04 NUMERIC(15, 2),
    amount_2026_05 NUMERIC(15, 2),
    amount_2026_06 NUMERIC(15, 2),
    amount_2026_07 NUMERIC(15, 2),
    amount_2026_08 NUMERIC(15, 2),
    amount_2026_09 NUMERIC(15, 2),
    amount_2026_10 NUMERIC(15, 2),
    amount_2026_11 NUMERIC(15, 2),
    amount_2026_12 NUMERIC(15, 2),
    amount_2027_01 NUMERIC(15, 2),
    amount_2027_02 NUMERIC(15, 2),
    amount_2027_03 NUMERIC(15, 2),
    amount_2027_04 NUMERIC(15, 2),
    amount_2027_05 NUMERIC(15, 2),
    amount_2027_06 NUMERIC(15, 2),
    amount_2027_07 NUMERIC(15, 2),
    amount_2027_08 NUMERIC(15, 2),
    amount_2027_09 NUMERIC(15, 2),
    amount_2027_10 NUMERIC(15, 2),
    amount_2027_11 NUMERIC(15, 2),
    amount_2027_12 NUMERIC(15, 2),
    amount_2028_01 NUMERIC(15, 2),
    amount_2028_02 NUMERIC(15, 2),
    amount_2028_03 NUMERIC(15, 2),
    amount_2028_04 NUMERIC(15, 2),
    amount_2028_05 NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX ix_gastos_equipo_id ON gastos_equipo(id);

-- Insert sample data based on the schema provided
INSERT INTO gastos_equipo (concepto, amount_2025_01, amount_2025_02, amount_2025_03) VALUES
('Alquiler Equipo', 59500.00, 59500.00, 59500.00),
('Consumo Combustible', 20000.00, 20000.00, 20000.00);

-- Grant permissions (adjust as needed for your database setup)
-- GRANT ALL PRIVILEGES ON TABLE gastos_equipo TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE gastos_equipo_id_seq TO your_app_user; 