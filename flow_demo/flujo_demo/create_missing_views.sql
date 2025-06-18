
-- View for presupuesto_mercadeo_tanara_casa_modelo
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_tanara_casa_modelo AS
SELECT 
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
    COALESCE(enero, 0) + COALESCE(febrero, 0) + COALESCE(marzo, 0) +
    COALESCE(abril, 0) + COALESCE(mayo, 0) + COALESCE(junio, 0) +
    COALESCE(julio, 0) + COALESCE(agosto, 0) + COALESCE(septiembre, 0) +
    COALESCE(octubre, 0) + COALESCE(noviembre, 0) + COALESCE(diciembre, 0) AS total
FROM 
    presupuesto_mercadeo_tanara_casa_modelo

UNION ALL

SELECT 
    'TOTAL CASA MODELO' AS actividad,
    SUM(COALESCE(enero, 0)) AS enero,
    SUM(COALESCE(febrero, 0)) AS febrero,
    SUM(COALESCE(marzo, 0)) AS marzo,
    SUM(COALESCE(abril, 0)) AS abril,
    SUM(COALESCE(mayo, 0)) AS mayo,
    SUM(COALESCE(junio, 0)) AS junio,
    SUM(COALESCE(julio, 0)) AS julio,
    SUM(COALESCE(agosto, 0)) AS agosto,
    SUM(COALESCE(septiembre, 0)) AS septiembre,
    SUM(COALESCE(octubre, 0)) AS octubre,
    SUM(COALESCE(noviembre, 0)) AS noviembre,
    SUM(COALESCE(diciembre, 0)) AS diciembre,
    SUM(COALESCE(enero, 0) + COALESCE(febrero, 0) + COALESCE(marzo, 0) +
        COALESCE(abril, 0) + COALESCE(mayo, 0) + COALESCE(junio, 0) +
        COALESCE(julio, 0) + COALESCE(agosto, 0) + COALESCE(septiembre, 0) +
        COALESCE(octubre, 0) + COALESCE(noviembre, 0) + COALESCE(diciembre, 0)) AS total
FROM 
    presupuesto_mercadeo_tanara_casa_modelo;
