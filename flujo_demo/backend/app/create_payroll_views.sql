-- View for Planilla Administracion
CREATE OR REPLACE VIEW public.v_planilla_administracion AS
SELECT 
    nombre AS "NOMBRE",
    horas AS "Horas",
    sal_bruto AS "Sal. Bruto",
    ROUND(sal_bruto * 0.0975, 2) AS "S.S.",
    ROUND(sal_bruto * 0.0125, 2) AS "S.E.",
    i_s_r AS "I.S.R.",
    otros_desc AS "Otros Desc.",
    COALESCE(ROUND(sal_bruto * 0.0975, 2), 0) + 
    COALESCE(ROUND(sal_bruto * 0.0125, 2), 0) + 
    COALESCE(i_s_r, 0) + 
    COALESCE(otros_desc, 0) AS "Total",
    sal_bruto - (
        COALESCE(ROUND(sal_bruto * 0.0975, 2), 0) + 
        COALESCE(ROUND(sal_bruto * 0.0125, 2), 0) + 
        COALESCE(i_s_r, 0) + 
        COALESCE(otros_desc, 0)
    ) AS "Sal. Neto"
FROM public.planilla_administracion;

-- View for Planilla Fija Construccion
CREATE OR REPLACE VIEW public.v_planilla_fija_construccion AS
SELECT 
    nombre AS "NOMBRE",
    rata_x_h AS "RATA X H.",
    horas_regulares AS "HORAS",
    actividad AS "ACTIVIDAD",
    horas_ext_1_25 AS "EXT. 1.25",
    horas_ext_1_5 AS "1.5",
    horas_ext_2_0 AS "2.0",
    rata_x_h * horas_regulares AS "REGULAR",
    COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) AS "P 1.25",
    COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) AS "P 1.5",
    COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0) AS "P2_0",
    (rata_x_h * horas_regulares) + 
    COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
    COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
    COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0) AS "S.BRUTO",
    ROUND((rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) * 0.0975, 2) AS "S.S.",
    ROUND((rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) * 0.0125, 2) AS "S.E.",
    i_renta AS "I/RENTA",
    ROUND((rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) * 0.11, 2) + 
    COALESCE(i_renta, 0) AS "TOTAL D.",
    (rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) - 
    (ROUND((rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) * 0.11, 2) + 
    COALESCE(i_renta, 0)) AS "SAL. NETO"
FROM public.planilla_fija_construccion;

-- View for Planilla Gerencial
CREATE OR REPLACE VIEW public.v_planilla_gerencial AS
SELECT 
    nombre AS "NOMBRE",
    salario AS "SALARIO",
    salario - ROUND(salario * 0.11, 2) AS "NETO",
    NULL AS "OBSERVACIONES"
FROM public.planilla_gerencial;

-- View for Planilla Servicio Profesionales
CREATE OR REPLACE VIEW public.v_planilla_servicio_profesionales AS
SELECT 
    nombre AS "NOMBRE",
    salario_quincenal AS "SALARIO QUINCENAL",
    hras_xtras AS "HRAS. XTRAS",
    otros_salarios AS "OTROS SALARIOS",
    descuentos AS "DESCUENTOS",
    COALESCE(salario_quincenal, 0) + 
    COALESCE(hras_xtras, 0) + 
    COALESCE(otros_salarios, 0) - 
    COALESCE(descuentos, 0) AS "NETO",
    observaciones AS "OBSERVACIONES"
FROM public.planilla_servicio_profesionales;

-- View for Planilla Variable Construccion
CREATE OR REPLACE VIEW public.v_planilla_variable_construccion AS
SELECT 
    nombre AS "NOMBRE",
    rata_x_h AS "RATA X H.",
    horas_regulares AS "HORAS",
    actividad AS "ACTIVIDAD",
    horas_ext_1_25 AS "EXT. 1.25",
    horas_ext_1_5 AS "1.5",
    horas_ext_2_0 AS "2.0",
    rata_x_h * horas_regulares AS "REGULAR",
    COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) AS "P 1.25",
    COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) AS "P 1.5",
    COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0) AS "P2_0",
    (rata_x_h * horas_regulares) + 
    COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
    COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
    COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0) AS "S.BRUTO",
    ROUND((rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) * 0.0975, 2) AS "S.S.",
    ROUND((rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) * 0.0125, 2) AS "S.E.",
    i_renta AS "I/RENTA",
    ROUND((rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) * 0.11, 2) + 
    COALESCE(i_renta, 0) AS "TOTAL D.",
    (rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) - 
    (ROUND((rata_x_h * horas_regulares + 
        COALESCE(rata_x_h * horas_ext_1_25 * 1.25, 0) + 
        COALESCE(rata_x_h * horas_ext_1_5 * 1.5, 0) + 
        COALESCE(rata_x_h * horas_ext_2_0 * 2.0, 0)) * 0.11, 2) + 
    COALESCE(i_renta, 0)) AS "SAL. NETO"
FROM public.planilla_variable_construccion; 