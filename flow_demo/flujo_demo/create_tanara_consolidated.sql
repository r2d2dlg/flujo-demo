-- Create Tanara consolidated view
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
    WHERE actividad != 'GASTOS PUBLICITARIOS'
    
    UNION ALL
    
    -- Gastos de Trámites
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
    
    -- Promociones y Bonos
    SELECT 
        'PROMOCIONES Y BONOS' AS categoria,
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
    FROM v_presupuesto_mercadeo_tanara_promociones_y_bonos
    WHERE actividad != 'TOTAL PROMOCIONES Y BONOS'
    
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
    enero, febrero, marzo, abril, mayo, junio,
    julio, agosto, septiembre, octubre, noviembre, diciembre,
    total
FROM tanara_combined
ORDER BY 
    CASE categoria
        WHEN 'CASA MODELO' THEN 1
        WHEN 'FERIAS Y EVENTOS' THEN 2
        WHEN 'GASTOS PUBLICITARIOS' THEN 3
        WHEN 'GASTOS DE TRAMITES' THEN 4
        WHEN 'PROMOCIONES Y BONOS' THEN 5
        WHEN 'REDES SOCIALES' THEN 6
        ELSE 7
    END,
    actividad;
