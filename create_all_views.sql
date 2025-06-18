-- Create all necessary views for both Chepo and Tanara

-- 1. First, create the Tanara consolidated view if it doesn't exist
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_tanara_consolidado AS
WITH tanara_combined AS (
    -- Casa Modelo
    SELECT 
        'CASA MODELO' AS categoria,
        actividad,
        COALESCE(CAST(enero AS NUMERIC), 0) AS enero,
        COALESCE(CAST(febrero AS NUMERIC), 0) AS febrero,
        COALESCE(CAST(marzo AS NUMERIC), 0) AS marzo,
        COALESCE(CAST(abril AS NUMERIC), 0) AS abril,
        COALESCE(CAST(mayo AS NUMERIC), 0) AS mayo,
        COALESCE(CAST(junio AS NUMERIC), 0) AS junio,
        COALESCE(CAST(julio AS NUMERIC), 0) AS julio,
        COALESCE(CAST(agosto AS NUMERIC), 0) AS agosto,
        COALESCE(CAST(septiembre AS NUMERIC), 0) AS septiembre,
        COALESCE(CAST(octubre AS NUMERIC), 0) AS octubre,
        COALESCE(CAST(noviembre AS NUMERIC), 0) AS noviembre,
        COALESCE(CAST(diciembre AS NUMERIC), 0) AS diciembre,
        COALESCE(CAST(total AS NUMERIC), 0) AS total
    FROM v_presupuesto_mercadeo_tanara_casa_modelo
    WHERE actividad != 'TOTAL CASA MODELO'
    
    UNION ALL
    
    -- Ferias y Eventos
    SELECT 
        'FERIAS Y EVENTOS' AS categoria,
        actividad,
        COALESCE(CAST(enero AS NUMERIC), 0) AS enero,
        COALESCE(CAST(febrero AS NUMERIC), 0) AS febrero,
        COALESCE(CAST(marzo AS NUMERIC), 0) AS marzo,
        COALESCE(CAST(abril AS NUMERIC), 0) AS abril,
        COALESCE(CAST(mayo AS NUMERIC), 0) AS mayo,
        COALESCE(CAST(junio AS NUMERIC), 0) AS junio,
        COALESCE(CAST(julio AS NUMERIC), 0) AS julio,
        COALESCE(CAST(agosto AS NUMERIC), 0) AS agosto,
        COALESCE(CAST(septiembre AS NUMERIC), 0) AS septiembre,
        COALESCE(CAST(octubre AS NUMERIC), 0) AS octubre,
        COALESCE(CAST(noviembre AS NUMERIC), 0) AS noviembre,
        COALESCE(CAST(diciembre AS NUMERIC), 0) AS diciembre,
        COALESCE(CAST(total AS NUMERIC), 0) AS total
    FROM v_presupuesto_mercadeo_tanara_ferias_eventos
    WHERE actividad != 'TOTAL FERIAS Y EVENTOS'
    
    UNION ALL
    
    -- Gastos Publicitarios
    SELECT 
        'GASTOS PUBLICITARIOS' AS categoria,
        actividad,
        COALESCE(CAST(enero AS NUMERIC), 0) AS enero,
        COALESCE(CAST(febrero AS NUMERIC), 0) AS febrero,
        COALESCE(CAST(marzo AS NUMERIC), 0) AS marzo,
        COALESCE(CAST(abril AS NUMERIC), 0) AS abril,
        COALESCE(CAST(mayo AS NUMERIC), 0) AS mayo,
        COALESCE(CAST(junio AS NUMERIC), 0) AS junio,
        COALESCE(CAST(julio AS NUMERIC), 0) AS julio,
        COALESCE(CAST(agosto AS NUMERIC), 0) AS agosto,
        COALESCE(CAST(septiembre AS NUMERIC), 0) AS septiembre,
        COALESCE(CAST(octubre AS NUMERIC), 0) AS octubre,
        COALESCE(CAST(noviembre AS NUMERIC), 0) AS noviembre,
        COALESCE(CAST(diciembre AS NUMERIC), 0) AS diciembre,
        COALESCE(CAST(total AS NUMERIC), 0) AS total
    FROM v_presupuesto_mercadeo_tanara_gastos_publicitarios
    WHERE actividad != 'TOTAL GASTOS PUBLICITARIOS'
    
    UNION ALL
    
    -- Gastos de Tramites
    SELECT 
        'GASTOS DE TRAMITES' AS categoria,
        actividad,
        COALESCE(CAST(enero AS NUMERIC), 0) AS enero,
        COALESCE(CAST(febrero AS NUMERIC), 0) AS febrero,
        COALESCE(CAST(marzo AS NUMERIC), 0) AS marzo,
        COALESCE(CAST(abril AS NUMERIC), 0) AS abril,
        COALESCE(CAST(mayo AS NUMERIC), 0) AS mayo,
        COALESCE(CAST(junio AS NUMERIC), 0) AS junio,
        COALESCE(CAST(julio AS NUMERIC), 0) AS julio,
        COALESCE(CAST(agosto AS NUMERIC), 0) AS agosto,
        COALESCE(CAST(septiembre AS NUMERIC), 0) AS septiembre,
        COALESCE(CAST(octubre AS NUMERIC), 0) AS octubre,
        COALESCE(CAST(noviembre AS NUMERIC), 0) AS noviembre,
        COALESCE(CAST(diciembre AS NUMERIC), 0) AS diciembre,
        COALESCE(CAST(total AS NUMERIC), 0) AS total
    FROM v_presupuesto_mercadeo_tanara_gastos_tramites
    WHERE actividad != 'TOTAL GASTOS DE TRAMITES'
    
    UNION ALL
    
    -- Redes Sociales
    SELECT 
        'REDES SOCIALES' AS categoria,
        actividad,
        COALESCE(CAST(enero AS NUMERIC), 0) AS enero,
        COALESCE(CAST(febrero AS NUMERIC), 0) AS febrero,
        COALESCE(CAST(marzo AS NUMERIC), 0) AS marzo,
        COALESCE(CAST(abril AS NUMERIC), 0) AS abril,
        COALESCE(CAST(mayo AS NUMERIC), 0) AS mayo,
        COALESCE(CAST(junio AS NUMERIC), 0) AS junio,
        COALESCE(CAST(julio AS NUMERIC), 0) AS julio,
        COALESCE(CAST(agosto AS NUMERIC), 0) AS agosto,
        COALESCE(CAST(septiembre AS NUMERIC), 0) AS septiembre,
        COALESCE(CAST(octubre AS NUMERIC), 0) AS octubre,
        COALESCE(CAST(noviembre AS NUMERIC), 0) AS noviembre,
        COALESCE(CAST(diciembre AS NUMERIC), 0) AS diciembre,
        COALESCE(CAST(total AS NUMERIC), 0) AS total
    FROM v_presupuesto_mercadeo_tanara_redes_sociales
    WHERE actividad != 'TOTAL REDES SOCIALES'
)
SELECT 
    'TANARA' AS proyecto,
    categoria,
    actividad,
    enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre,
    (COALESCE(enero, 0) + COALESCE(febrero, 0) + COALESCE(marzo, 0) + 
     COALESCE(abril, 0) + COALESCE(mayo, 0) + COALESCE(junio, 0) + 
     COALESCE(julio, 0) + COALESCE(agosto, 0) + COALESCE(septiembre, 0) + 
     COALESCE(octubre, 0) + COALESCE(noviembre, 0) + COALESCE(diciembre, 0)) AS total
FROM tanara_combined
WHERE actividad IS NOT NULL AND actividad != ''
ORDER BY 
    CASE 
        WHEN categoria = 'CASA MODELO' THEN 1
        WHEN categoria = 'FERIAS Y EVENTOS' THEN 2
        WHEN categoria = 'GASTOS PUBLICITARIOS' THEN 3
        WHEN categoria = 'GASTOS DE TRAMITES' THEN 4
        WHEN categoria = 'REDES SOCIALES' THEN 5
        ELSE 6
    END,
    actividad;
