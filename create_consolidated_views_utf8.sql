-- Consolidated view for Tanara project
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_tanara_consolidado AS
WITH tanara_combined AS (
    -- Casa Modelo
    SELECT 
        'CASA MODELO' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_tanara_casa_modelo
    WHERE actividad != 'TOTAL CASA MODELO'
    
    UNION ALL
    
    -- Ferias y Eventos
    SELECT 
        'FERIAS Y EVENTOS' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_tanara_ferias_eventos
    WHERE actividad != 'TOTAL FERIAS Y EVENTOS'
    
    UNION ALL
    
    -- Gastos Publicitarios
    SELECT 
        'GASTOS PUBLICITARIOS' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_tanara_gastos_publicitarios
    WHERE actividad != 'GASTOS PUBLICITARIOS'
    
    UNION ALL
    
    -- Gastos de Trámites
    SELECT 
        'GASTOS DE TRÁMITES' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_tanara_gastos_tramites
    WHERE actividad != 'TOTAL GASTOS DE TRÁMITES'
    
    UNION ALL
    
    -- Promociones y Bonos
    SELECT 
        'PROMOCIONES Y BONOS' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_tanara_promociones_y_bonos
    WHERE actividad != 'TOTAL PROMOCIONES Y BONOS'
    
    UNION ALL
    
    -- Redes Sociales
    SELECT 
        'REDES SOCIALES' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_tanara_redes_sociales
    WHERE actividad != 'TOTAL REDES SOCIALES'
)
SELECT 
    'TANARA' AS proyecto,
    categoria,
    actividad,
    enero, febrero, marzo, abril, mayo, junio,
    julio, agosto, septiembre, octubre, noviembre, diciembre,
    total
FROM tanara_combined
ORDER BY 
    CASE categoria
        WHEN 'CASA MODELO' THEN 1
        WHEN 'FERIAS Y EVENTOS' THEN 2
        WHEN 'GASTOS PUBLICITARIOS' THEN 3
        WHEN 'GASTOS DE TRÁMITES' THEN 4
        WHEN 'PROMOCIONES Y BONOS' THEN 5
        WHEN 'REDES SOCIALES' THEN 6
        ELSE 7
    END,
    actividad;

-- Add a summary row for the Tanara project
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_tanara_resumen AS
SELECT 
    'TANARA' AS proyecto,
    'TOTAL GENERAL' AS categoria,
    'TODAS LAS CATEGORÍAS' AS actividad,
    SUM(enero) AS enero,
    SUM(febrero) AS febrero,
    SUM(marzo) AS marzo,
    SUM(abril) AS abril,
    SUM(mayo) AS mayo,
    SUM(junio) AS junio,
    SUM(julio) AS julio,
    SUM(agosto) AS agosto,
    SUM(septiembre) AS septiembre,
    SUM(octubre) AS octubre,
    SUM(noviembre) AS noviembre,
    SUM(diciembre) AS diciembre,
    SUM(total) AS total
FROM v_presupuesto_mercadeo_tanara_consolidado;

-- Consolidated view for Chepo project
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_chepo_consolidado AS
WITH chepo_combined AS (
    -- Casa Modelo
    SELECT 
        'CASA MODELO' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_chepo_casa_modelo
    WHERE actividad != 'TOTAL CASA MODELO'
    
    UNION ALL
    
    -- Feria y Eventos
    SELECT 
        'FERIA Y EVENTOS' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_chepo_feria_eventos
    WHERE actividad != 'TOTAL FERIA Y EVENTOS'
    
    UNION ALL
    
    -- Gastos Publicitarios
    SELECT 
        'GASTOS PUBLICITARIOS' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_chepo_gastos_publicitarios
    WHERE actividad != 'GASTOS PUBLICITARIOS'
    
    UNION ALL
    
    -- Gastos de Trámites
    SELECT 
        'GASTOS DE TRÁMITES' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_chepo_gastos_tramites
    WHERE actividad != 'TOTAL GASTOS DE TRÁMITES'
    
    UNION ALL
    
    -- Promociones y Bonos
    SELECT 
        'PROMOCIONES Y BONOS' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_chepo_promociones_y_bonos
    WHERE actividad != 'TOTAL PROMOCIONES Y BONOS'
    
    UNION ALL
    
    -- Redes Sociales
    SELECT 
        'REDES SOCIALES' AS categoria,
        actividad,
        COALESCE(enero, 0) AS enero,
        COALESCE(febrero, 0) AS febrero,
        COALESCE(marzo, 0) AS marzo,
        COALESCE(abril, 0) AS abril,
        COALESCE(mayo, 0) AS mayo,
        COALESCE(junio, 0) AS junio,
        COALESCE(julio, 0) AS julio,
        COALESCE(agosto, 0) AS agosto,
        COALESCE(septiembre, 0) AS septiembre,
        COALESCE(octubre, 0) AS octubre,
        COALESCE(noviembre, 0) AS noviembre,
        COALESCE(diciembre, 0) AS diciembre,
        COALESCE(total, 0) AS total
    FROM v_presupuesto_mercadeo_chepo_redes_sociales
    WHERE actividad != 'TOTAL REDES SOCIALES'
)
SELECT 
    'CHEPO' AS proyecto,
    categoria,
    actividad,
    enero, febrero, marzo, abril, mayo, junio,
    julio, agosto, septiembre, octubre, noviembre, diciembre,
    total
FROM chepo_combined
ORDER BY 
    CASE categoria
        WHEN 'CASA MODELO' THEN 1
        WHEN 'FERIA Y EVENTOS' THEN 2
        WHEN 'GASTOS PUBLICITARIOS' THEN 3
        WHEN 'GASTOS DE TRÁMITES' THEN 4
        WHEN 'PROMOCIONES Y BONOS' THEN 5
        WHEN 'REDES SOCIALES' THEN 6
        ELSE 7
    END,
    actividad;

-- Add a summary row for the Chepo project
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_chepo_resumen AS
SELECT 
    'CHEPO' AS proyecto,
    'TOTAL GENERAL' AS categoria,
    'TODAS LAS CATEGORÍAS' AS actividad,
    SUM(enero) AS enero,
    SUM(febrero) AS febrero,
    SUM(marzo) AS marzo,
    SUM(abril) AS abril,
    SUM(mayo) AS mayo,
    SUM(junio) AS junio,
    SUM(julio) AS julio,
    SUM(agosto) AS agosto,
    SUM(septiembre) AS septiembre,
    SUM(octubre) AS octubre,
    SUM(noviembre) AS noviembre,
    SUM(diciembre) AS diciembre,
    SUM(total) AS total
FROM v_presupuesto_mercadeo_chepo_consolidado;

-- Combined view for both projects
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_completo AS
SELECT * FROM v_presupuesto_mercadeo_tanara_consolidado
UNION ALL
SELECT * FROM v_presupuesto_mercadeo_chepo_consolidado
ORDER BY proyecto, categoria, actividad;

-- Combined summary view
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_resumen_completo AS
SELECT * FROM v_presupuesto_mercadeo_tanara_resumen
UNION ALL
SELECT * FROM v_presupuesto_mercadeo_chepo_resumen
ORDER BY proyecto;
