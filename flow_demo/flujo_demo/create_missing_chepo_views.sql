
-- View for presupuesto_mercadeo_chepo_casa_modelo
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_chepo_casa_modelo AS
SELECT 
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
    COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
    COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
    COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
    COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0) AS total
FROM 
    presupuesto_mercadeo_chepo_casa_modelo

UNION ALL

SELECT 
    'TOTAL CASA MODELO' AS actividad,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0)) AS enero,
    SUM(COALESCE(CAST(febrero AS NUMERIC), 0)) AS febrero,
    SUM(COALESCE(CAST(marzo AS NUMERIC), 0)) AS marzo,
    SUM(COALESCE(CAST(abril AS NUMERIC), 0)) AS abril,
    SUM(COALESCE(CAST(mayo AS NUMERIC), 0)) AS mayo,
    SUM(COALESCE(CAST(junio AS NUMERIC), 0)) AS junio,
    SUM(COALESCE(CAST(julio AS NUMERIC), 0)) AS julio,
    SUM(COALESCE(CAST(agosto AS NUMERIC), 0)) AS agosto,
    SUM(COALESCE(CAST(septiembre AS NUMERIC), 0)) AS septiembre,
    SUM(COALESCE(CAST(octubre AS NUMERIC), 0)) AS octubre,
    SUM(COALESCE(CAST(noviembre AS NUMERIC), 0)) AS noviembre,
    SUM(COALESCE(CAST(diciembre AS NUMERIC), 0)) AS diciembre,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
        COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
        COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
        COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0)) AS total
FROM 
    presupuesto_mercadeo_chepo_casa_modelo;


-- View for presupuesto_mercadeo_chepo_feria_eventos
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_chepo_feria_eventos AS
SELECT 
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
    COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
    COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
    COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
    COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0) AS total
FROM 
    presupuesto_mercadeo_chepo_feria_eventos

UNION ALL

SELECT 
    'TOTAL FERIA Y EVENTOS' AS actividad,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0)) AS enero,
    SUM(COALESCE(CAST(febrero AS NUMERIC), 0)) AS febrero,
    SUM(COALESCE(CAST(marzo AS NUMERIC), 0)) AS marzo,
    SUM(COALESCE(CAST(abril AS NUMERIC), 0)) AS abril,
    SUM(COALESCE(CAST(mayo AS NUMERIC), 0)) AS mayo,
    SUM(COALESCE(CAST(junio AS NUMERIC), 0)) AS junio,
    SUM(COALESCE(CAST(julio AS NUMERIC), 0)) AS julio,
    SUM(COALESCE(CAST(agosto AS NUMERIC), 0)) AS agosto,
    SUM(COALESCE(CAST(septiembre AS NUMERIC), 0)) AS septiembre,
    SUM(COALESCE(CAST(octubre AS NUMERIC), 0)) AS octubre,
    SUM(COALESCE(CAST(noviembre AS NUMERIC), 0)) AS noviembre,
    SUM(COALESCE(CAST(diciembre AS NUMERIC), 0)) AS diciembre,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
        COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
        COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
        COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0)) AS total
FROM 
    presupuesto_mercadeo_chepo_feria_eventos;


-- View for presupuesto_mercadeo_chepo_gastos_publicitarios
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_chepo_gastos_publicitarios AS
SELECT 
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
    COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
    COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
    COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
    COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0) AS total
FROM 
    presupuesto_mercadeo_chepo_gastos_publicitarios

UNION ALL

SELECT 
    'GASTOS PUBLICITARIOS' AS actividad,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0)) AS enero,
    SUM(COALESCE(CAST(febrero AS NUMERIC), 0)) AS febrero,
    SUM(COALESCE(CAST(marzo AS NUMERIC), 0)) AS marzo,
    SUM(COALESCE(CAST(abril AS NUMERIC), 0)) AS abril,
    SUM(COALESCE(CAST(mayo AS NUMERIC), 0)) AS mayo,
    SUM(COALESCE(CAST(junio AS NUMERIC), 0)) AS junio,
    SUM(COALESCE(CAST(julio AS NUMERIC), 0)) AS julio,
    SUM(COALESCE(CAST(agosto AS NUMERIC), 0)) AS agosto,
    SUM(COALESCE(CAST(septiembre AS NUMERIC), 0)) AS septiembre,
    SUM(COALESCE(CAST(octubre AS NUMERIC), 0)) AS octubre,
    SUM(COALESCE(CAST(noviembre AS NUMERIC), 0)) AS noviembre,
    SUM(COALESCE(CAST(diciembre AS NUMERIC), 0)) AS diciembre,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
        COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
        COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
        COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0)) AS total
FROM 
    presupuesto_mercadeo_chepo_gastos_publicitarios;


-- View for presupuesto_mercadeo_chepo_gastos_tramites
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_chepo_gastos_tramites AS
SELECT 
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
    COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
    COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
    COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
    COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0) AS total
FROM 
    presupuesto_mercadeo_chepo_gastos_tramites

UNION ALL

SELECT 
    'TOTAL GASTOS DE TRÁMITES' AS actividad,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0)) AS enero,
    SUM(COALESCE(CAST(febrero AS NUMERIC), 0)) AS febrero,
    SUM(COALESCE(CAST(marzo AS NUMERIC), 0)) AS marzo,
    SUM(COALESCE(CAST(abril AS NUMERIC), 0)) AS abril,
    SUM(COALESCE(CAST(mayo AS NUMERIC), 0)) AS mayo,
    SUM(COALESCE(CAST(junio AS NUMERIC), 0)) AS junio,
    SUM(COALESCE(CAST(julio AS NUMERIC), 0)) AS julio,
    SUM(COALESCE(CAST(agosto AS NUMERIC), 0)) AS agosto,
    SUM(COALESCE(CAST(septiembre AS NUMERIC), 0)) AS septiembre,
    SUM(COALESCE(CAST(octubre AS NUMERIC), 0)) AS octubre,
    SUM(COALESCE(CAST(noviembre AS NUMERIC), 0)) AS noviembre,
    SUM(COALESCE(CAST(diciembre AS NUMERIC), 0)) AS diciembre,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
        COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
        COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
        COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0)) AS total
FROM 
    presupuesto_mercadeo_chepo_gastos_tramites;


-- View for presupuesto_mercadeo_chepo_promociones_y_bonos
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_chepo_promociones_y_bonos AS
SELECT 
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
    COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
    COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
    COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
    COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0) AS total
FROM 
    presupuesto_mercadeo_chepo_promociones_y_bonos

UNION ALL

SELECT 
    'TOTAL PROMOCIONES Y BONOS' AS actividad,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0)) AS enero,
    SUM(COALESCE(CAST(febrero AS NUMERIC), 0)) AS febrero,
    SUM(COALESCE(CAST(marzo AS NUMERIC), 0)) AS marzo,
    SUM(COALESCE(CAST(abril AS NUMERIC), 0)) AS abril,
    SUM(COALESCE(CAST(mayo AS NUMERIC), 0)) AS mayo,
    SUM(COALESCE(CAST(junio AS NUMERIC), 0)) AS junio,
    SUM(COALESCE(CAST(julio AS NUMERIC), 0)) AS julio,
    SUM(COALESCE(CAST(agosto AS NUMERIC), 0)) AS agosto,
    SUM(COALESCE(CAST(septiembre AS NUMERIC), 0)) AS septiembre,
    SUM(COALESCE(CAST(octubre AS NUMERIC), 0)) AS octubre,
    SUM(COALESCE(CAST(noviembre AS NUMERIC), 0)) AS noviembre,
    SUM(COALESCE(CAST(diciembre AS NUMERIC), 0)) AS diciembre,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
        COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
        COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
        COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0)) AS total
FROM 
    presupuesto_mercadeo_chepo_promociones_y_bonos;


-- View for presupuesto_mercadeo_chepo_redes_sociales
CREATE OR REPLACE VIEW v_presupuesto_mercadeo_chepo_redes_sociales AS
SELECT 
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
    COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
    COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
    COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
    COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0) AS total
FROM 
    presupuesto_mercadeo_chepo_redes_sociales

UNION ALL

SELECT 
    'TOTAL REDES SOCIALES' AS actividad,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0)) AS enero,
    SUM(COALESCE(CAST(febrero AS NUMERIC), 0)) AS febrero,
    SUM(COALESCE(CAST(marzo AS NUMERIC), 0)) AS marzo,
    SUM(COALESCE(CAST(abril AS NUMERIC), 0)) AS abril,
    SUM(COALESCE(CAST(mayo AS NUMERIC), 0)) AS mayo,
    SUM(COALESCE(CAST(junio AS NUMERIC), 0)) AS junio,
    SUM(COALESCE(CAST(julio AS NUMERIC), 0)) AS julio,
    SUM(COALESCE(CAST(agosto AS NUMERIC), 0)) AS agosto,
    SUM(COALESCE(CAST(septiembre AS NUMERIC), 0)) AS septiembre,
    SUM(COALESCE(CAST(octubre AS NUMERIC), 0)) AS octubre,
    SUM(COALESCE(CAST(noviembre AS NUMERIC), 0)) AS noviembre,
    SUM(COALESCE(CAST(diciembre AS NUMERIC), 0)) AS diciembre,
    SUM(COALESCE(CAST(enero AS NUMERIC), 0) + COALESCE(CAST(febrero AS NUMERIC), 0) + COALESCE(CAST(marzo AS NUMERIC), 0) +
        COALESCE(CAST(abril AS NUMERIC), 0) + COALESCE(CAST(mayo AS NUMERIC), 0) + COALESCE(CAST(junio AS NUMERIC), 0) +
        COALESCE(CAST(julio AS NUMERIC), 0) + COALESCE(CAST(agosto AS NUMERIC), 0) + COALESCE(CAST(septiembre AS NUMERIC), 0) +
        COALESCE(CAST(octubre AS NUMERIC), 0) + COALESCE(CAST(noviembre AS NUMERIC), 0) + COALESCE(CAST(diciembre AS NUMERIC), 0)) AS total
FROM 
    presupuesto_mercadeo_chepo_redes_sociales;
