-- Create Chepo summary view
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_chepo_resumen AS
SELECT 
    'CHEPO' AS proyecto,
    'TOTAL GENERAL' AS categoria,
    'TODAS LAS CATEGORIAS' AS actividad,
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
