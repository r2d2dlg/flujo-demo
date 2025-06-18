-- backend/app/create_costo_x_vivienda.sql

CREATE TABLE IF NOT EXISTS costo_x_vivienda (
    id SERIAL PRIMARY KEY,
    viviendas INTEGER,
    materiales NUMERIC(12, 2),
    mo NUMERIC(12, 2),
    otros NUMERIC(12, 2)
);

CREATE OR REPLACE VIEW costo_x_vivienda_view AS
SELECT
    id,
    viviendas,
    materiales,
    mo,
    otros,
    (materiales + mo + otros) AS total
FROM
    costo_x_vivienda;

-- Seed data for costo_x_vivienda
INSERT INTO costo_x_vivienda (viviendas, materiales, mo, otros)
SELECT 64, 13181.80, 5484.00, 1169.95
WHERE NOT EXISTS (SELECT 1 FROM costo_x_vivienda WHERE viviendas = 64 AND materiales = 13181.80); 