-- Create or update the costo_directo table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS costo_directo (
    id SERIAL PRIMARY KEY,
    actividad VARCHAR(255) NOT NULL,
    infraestructura DECIMAL(12,2) DEFAULT 0.00,
    materiales DECIMAL(12,2) DEFAULT 0.00,
    mo DECIMAL(12,2) DEFAULT 0.00,
    equipos DECIMAL(12,2) DEFAULT 0.00
);

-- Drop the old view if it exists
DROP VIEW IF EXISTS v_costo_directo;

-- Create the view that includes totals
CREATE OR REPLACE VIEW v_costo_directo AS
WITH data AS (
    SELECT 
        CAST(id AS TEXT) as id,
        actividad,
        infraestructura,
        materiales,
        mo,
        equipos,
        (infraestructura + materiales + mo + equipos) as total,
        0 as sort_order
    FROM costo_directo
),
totals AS (
    SELECT 
        'total' as id,
        'Total' as actividad,
        SUM(infraestructura) as infraestructura,
        SUM(materiales) as materiales,
        SUM(mo) as mo,
        SUM(equipos) as equipos,
        SUM(infraestructura + materiales + mo + equipos) as total,
        1 as sort_order
    FROM costo_directo
)
SELECT * FROM (
    SELECT * FROM data
    UNION ALL
    SELECT * FROM totals
) combined
ORDER BY sort_order, id;

-- Insert initial data if table is empty
INSERT INTO costo_directo (actividad, infraestructura, materiales, mo, equipos)
SELECT * FROM (VALUES
    ('Sistema Vial', 19943.86, 54572.61, 14272.00, 0),
    ('Sistema Pluvial', 44647.55, 27616.40, 14682.20, 0),
    ('Sistema Acueducto', 27645.93, 15642.00, 15368.95, 0),
    ('Sistema Sanitario', 27101.21, 15194.10, 16087.99, 0),
    ('Movimiento de Tierra', 0, 0, 0, 0),
    ('PTAR', 70000.00, 0, 0, 0),
    ('Electricidad Pública', 57000.00, 0, 0, 0),
    ('Tanque de Reserva', 0, 0, 0, 0)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM costo_directo LIMIT 1); 