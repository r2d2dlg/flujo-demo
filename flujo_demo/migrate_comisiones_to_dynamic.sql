-- Migration script to convert plantilla_comisiones_ventas to dynamic period format
-- This will create a new table structure with amount_YYYY_MM columns (39 months total)
-- From March 2024 to May 2027 (3 months before current + 36 months forward from June 2025)

BEGIN;

-- Step 1: Create backup of existing data
CREATE TABLE plantilla_comisiones_ventas_backup AS 
SELECT * FROM plantilla_comisiones_ventas;

-- Step 2: Drop the existing table
DROP TABLE IF EXISTS plantilla_comisiones_ventas CASCADE;

-- Step 3: Create new table with dynamic period structure
CREATE TABLE plantilla_comisiones_ventas (
    id SERIAL PRIMARY KEY,
    concepto TEXT NOT NULL, -- This will store the commission concept/description
    
    -- Dynamic period columns (39 months: March 2024 to May 2027)
    amount_2024_03 DECIMAL(15,2) DEFAULT 0.00,
    amount_2024_04 DECIMAL(15,2) DEFAULT 0.00,
    amount_2024_05 DECIMAL(15,2) DEFAULT 0.00,
    amount_2024_06 DECIMAL(15,2) DEFAULT 0.00,
    amount_2024_07 DECIMAL(15,2) DEFAULT 0.00,
    amount_2024_08 DECIMAL(15,2) DEFAULT 0.00,
    amount_2024_09 DECIMAL(15,2) DEFAULT 0.00,
    amount_2024_10 DECIMAL(15,2) DEFAULT 0.00,
    amount_2024_11 DECIMAL(15,2) DEFAULT 0.00,
    amount_2024_12 DECIMAL(15,2) DEFAULT 0.00,
    
    amount_2025_01 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_02 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_03 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_04 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_05 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_06 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_07 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_08 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_09 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_10 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_11 DECIMAL(15,2) DEFAULT 0.00,
    amount_2025_12 DECIMAL(15,2) DEFAULT 0.00,
    
    amount_2026_01 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_02 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_03 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_04 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_05 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_06 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_07 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_08 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_09 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_10 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_11 DECIMAL(15,2) DEFAULT 0.00,
    amount_2026_12 DECIMAL(15,2) DEFAULT 0.00,
    
    amount_2027_01 DECIMAL(15,2) DEFAULT 0.00,
    amount_2027_02 DECIMAL(15,2) DEFAULT 0.00,
    amount_2027_03 DECIMAL(15,2) DEFAULT 0.00,
    amount_2027_04 DECIMAL(15,2) DEFAULT 0.00,
    amount_2027_05 DECIMAL(15,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create some sample commission concepts
INSERT INTO plantilla_comisiones_ventas (concepto) VALUES 
('Comisión Ventas General'),
('Comisión Captador'),
('Comisión Referido'),
('Comisión Vendedor 1'),
('Comisión Vendedor 2'),
('Comisión Vendedor 3');

-- Step 5: Add some sample data for current period (June 2025)
UPDATE plantilla_comisiones_ventas 
SET amount_2025_06 = 1500.00 
WHERE concepto = 'Comisión Ventas General';

UPDATE plantilla_comisiones_ventas 
SET amount_2025_06 = 800.00 
WHERE concepto = 'Comisión Captador';

UPDATE plantilla_comisiones_ventas 
SET amount_2025_06 = 1200.00 
WHERE concepto = 'Comisión Referido';

-- Step 6: Create indexes for better performance
CREATE INDEX idx_plantilla_comisiones_concepto ON plantilla_comisiones_ventas(concepto);
CREATE INDEX idx_plantilla_comisiones_created_at ON plantilla_comisiones_ventas(created_at);

-- Step 7: Add trigger for updated_at (can be added later if needed)
-- CREATE OR REPLACE FUNCTION update_plantilla_comisiones_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_plantilla_comisiones_updated_at
--     BEFORE UPDATE ON plantilla_comisiones_ventas
--     FOR EACH ROW
--     EXECUTE FUNCTION update_plantilla_comisiones_updated_at();

COMMIT;

-- Verification query
SELECT concepto, amount_2025_06, created_at 
FROM plantilla_comisiones_ventas 
ORDER BY concepto; 