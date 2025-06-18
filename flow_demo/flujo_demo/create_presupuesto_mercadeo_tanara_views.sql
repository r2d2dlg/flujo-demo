-- 1. GASTOS DE CASAS MODELOS
CREATE TABLE IF NOT EXISTS "Presupuesto_Mercadeo_Tanara_Gastos_Casa_Modelo" (
    actividad TEXT,
    enero NUMERIC,
    febrero NUMERIC,
    marzo NUMERIC,
    abril NUMERIC,
    mayo NUMERIC,
    junio NUMERIC,
    julio NUMERIC,
    agosto NUMERIC,
    septiembre NUMERIC,
    octubre NUMERIC,
    noviembre NUMERIC,
    diciembre NUMERIC,
    total NUMERIC
);

CREATE OR REPLACE VIEW "Presupuesto_Mercadeo_Tanara_Gastos_Casa_Modelo_con_subtotal" AS
SELECT
    actividad,
    enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre, total
FROM "Presupuesto_Mercadeo_Tanara_Gastos_Casa_Modelo"
UNION ALL
SELECT
    'GASTOS DE CASAS MODELOS' AS actividad,
    SUM(enero), SUM(febrero), SUM(marzo), SUM(abril), SUM(mayo), SUM(junio),
    SUM(julio), SUM(agosto), SUM(septiembre), SUM(octubre), SUM(noviembre), SUM(diciembre), SUM(total)
FROM "Presupuesto_Mercadeo_Tanara_Gastos_Casa_Modelo";

-- 2. GASTOS PUBLICITARIOS
CREATE TABLE IF NOT EXISTS "Presupuesto_Mercadeo_Tanara_Gastos_Publicitarios" (
    actividad TEXT,
    enero NUMERIC,
    febrero NUMERIC,
    marzo NUMERIC,
    abril NUMERIC,
    mayo NUMERIC,
    junio NUMERIC,
    julio NUMERIC,
    agosto NUMERIC,
    septiembre NUMERIC,
    octubre NUMERIC,
    noviembre NUMERIC,
    diciembre NUMERIC,
    total NUMERIC
);

CREATE OR REPLACE VIEW "v_Presupuesto_Mercadeo_Tanara_Gastos_Publicitarios" AS
SELECT
    actividad,
    enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre, total
FROM "Presupuesto_Mercadeo_Tanara_Gastos_Publicitarios"
UNION ALL
SELECT
    'GASTOS PUBLICITARIOS' AS actividad,
    SUM(enero), SUM(febrero), SUM(marzo), SUM(abril), SUM(mayo), SUM(junio),
    SUM(julio), SUM(agosto), SUM(septiembre), SUM(octubre), SUM(noviembre), SUM(diciembre), SUM(total)
FROM "Presupuesto_Mercadeo_Tanara_Gastos_Publicitarios";

-- 3. FERIA Y EVENTOS
CREATE TABLE IF NOT EXISTS "Presupuesto_Mercadeo_Tanara_Ferias_Eventos" (
    actividad TEXT,
    enero NUMERIC,
    febrero NUMERIC,
    marzo NUMERIC,
    abril NUMERIC,
    mayo NUMERIC,
    junio NUMERIC,
    julio NUMERIC,
    agosto NUMERIC,
    septiembre NUMERIC,
    octubre NUMERIC,
    noviembre NUMERIC,
    diciembre NUMERIC,
    total NUMERIC
);

CREATE OR REPLACE VIEW "v_Presupuesto_Mercadeo_Tanara_Ferias_Eventos" AS
SELECT
    actividad,
    enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre, total
FROM "Presupuesto_Mercadeo_Tanara_Ferias_Eventos"
UNION ALL
SELECT
    'FERIA Y EVENTOS' AS actividad,
    SUM(enero), SUM(febrero), SUM(marzo), SUM(abril), SUM(mayo), SUM(junio),
    SUM(julio), SUM(agosto), SUM(septiembre), SUM(octubre), SUM(noviembre), SUM(diciembre), SUM(total)
FROM "Presupuesto_Mercadeo_Tanara_Ferias_Eventos";

-- 4. REDES SOCIALES
CREATE TABLE IF NOT EXISTS "Presupuesto_Mercadeo_Tanara_Redes_Sociales" (
    actividad TEXT,
    enero NUMERIC,
    febrero NUMERIC,
    marzo NUMERIC,
    abril NUMERIC,
    mayo NUMERIC,
    junio NUMERIC,
    julio NUMERIC,
    agosto NUMERIC,
    septiembre NUMERIC,
    octubre NUMERIC,
    noviembre NUMERIC,
    diciembre NUMERIC,
    total NUMERIC
);

CREATE OR REPLACE VIEW "v_Presupuesto_Mercadeo_Tanara_Redes_Sociales" AS
SELECT
    actividad,
    enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre, total
FROM "Presupuesto_Mercadeo_Tanara_Redes_Sociales"
UNION ALL
SELECT
    'REDES SOCIALES' AS actividad,
    SUM(enero), SUM(febrero), SUM(marzo), SUM(abril), SUM(mayo), SUM(junio),
    SUM(julio), SUM(agosto), SUM(septiembre), SUM(octubre), SUM(noviembre), SUM(diciembre), SUM(total)
FROM "Presupuesto_Mercadeo_Tanara_Redes_Sociales";

-- 5. PROMOCIONES Y BONOS A CLIENTES
CREATE TABLE IF NOT EXISTS "Presupuesto_Mercadeo_Tanara_Promociones_y_Bonos" (
    actividad TEXT,
    enero NUMERIC,
    febrero NUMERIC,
    marzo NUMERIC,
    abril NUMERIC,
    mayo NUMERIC,
    junio NUMERIC,
    julio NUMERIC,
    agosto NUMERIC,
    septiembre NUMERIC,
    octubre NUMERIC,
    noviembre NUMERIC,
    diciembre NUMERIC,
    total NUMERIC
);

CREATE OR REPLACE VIEW "v_Presupuesto_Mercadeo_Tanara_Promociones_y_Bonos" AS
SELECT
    actividad,
    enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre, total
FROM "Presupuesto_Mercadeo_Tanara_Promociones_y_Bonos"
UNION ALL
SELECT
    'PROMOCIONES Y BONOS A CLIENTES' AS actividad,
    SUM(enero), SUM(febrero), SUM(marzo), SUM(abril), SUM(mayo), SUM(junio),
    SUM(julio), SUM(agosto), SUM(septiembre), SUM(octubre), SUM(noviembre), SUM(diciembre), SUM(total)
FROM "Presupuesto_Mercadeo_Tanara_Promociones_y_Bonos";

-- 6. GASTOS DE TRÁMITES
CREATE TABLE IF NOT EXISTS "Presupuesto_Mercadeo_Tanara_Gastos_Tramites" (
    actividad TEXT,
    enero NUMERIC,
    febrero NUMERIC,
    marzo NUMERIC,
    abril NUMERIC,
    mayo NUMERIC,
    junio NUMERIC,
    julio NUMERIC,
    agosto NUMERIC,
    septiembre NUMERIC,
    octubre NUMERIC,
    noviembre NUMERIC,
    diciembre NUMERIC,
    total NUMERIC
);

CREATE OR REPLACE VIEW "v_Presupuesto_Mercadeo_Tanara_Gastos_Tramites" AS
SELECT
    actividad,
    enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre, total
FROM "Presupuesto_Mercadeo_Tanara_Gastos_Tramites"
UNION ALL
SELECT
    'GASTOS DE TRÁMITES' AS actividad,
    SUM(enero), SUM(febrero), SUM(marzo), SUM(abril), SUM(mayo), SUM(junio),
    SUM(julio), SUM(agosto), SUM(septiembre), SUM(octubre), SUM(noviembre), SUM(diciembre), SUM(total)
FROM "Presupuesto_Mercadeo_Tanara_Gastos_Tramites";

-- 7. GRAN TOTAL VIEW
CREATE OR REPLACE VIEW "v_Gran_Total_Presupuesto_Mercadeo_Tanara" AS
SELECT * FROM "Presupuesto_Mercadeo_Tanara_Gastos_Casa_Modelo_con_subtotal"
UNION ALL
SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Gastos_Publicitarios"
UNION ALL
SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Ferias_Eventos"
UNION ALL
SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Redes_Sociales"
UNION ALL
SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Promociones_y_Bonos"
UNION ALL
SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Gastos_Tramites"
UNION ALL
SELECT
    'GRAN TOTAL' AS actividad,
    SUM(enero), SUM(febrero), SUM(marzo), SUM(abril), SUM(mayo), SUM(junio),
    SUM(julio), SUM(agosto), SUM(septiembre), SUM(octubre), SUM(noviembre), SUM(diciembre), SUM(total)
FROM (
    SELECT * FROM "Presupuesto_Mercadeo_Tanara_Gastos_Casa_Modelo_con_subtotal"
    UNION ALL SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Gastos_Publicitarios"
    UNION ALL SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Ferias_Eventos"
    UNION ALL SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Redes_Sociales"
    UNION ALL SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Promociones_y_Bonos"
    UNION ALL SELECT * FROM "v_Presupuesto_Mercadeo_Tanara_Gastos_Tramites"
) AS all_data
WHERE all_data.actividad NOT IN (
    'GASTOS DE CASAS MODELOS',
    'GASTOS PUBLICITARIOS',
    'FERIAS Y EVENTOS',
    'REDES SOCIALES',
    'PROMOCIONES Y BONOS A CLIENTES',
    'GASTOS DE TRÁMITES'
); 