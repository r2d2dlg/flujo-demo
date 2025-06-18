-- Table for consultores names
CREATE TABLE IF NOT EXISTS public.nombres_consultores (
    nombre VARCHAR(255) PRIMARY KEY
);

-- Table for consultores costs
CREATE TABLE IF NOT EXISTS public.costo_consultores (
    consultor VARCHAR(255) REFERENCES public.nombres_consultores(nombre),
    fecha DATE NOT NULL,
    costo DECIMAL(10, 2),
    PRIMARY KEY (consultor, fecha)
);

-- View that includes totals
CREATE OR REPLACE VIEW public.v_costo_consultores AS
WITH monthly_costs AS (
    SELECT 
        c.consultor,
        DATE_TRUNC('month', c.fecha) as mes,
        SUM(c.costo) as costo_mensual
    FROM costo_consultores c
    GROUP BY c.consultor, DATE_TRUNC('month', c.fecha)
),
all_months AS (
    SELECT DISTINCT mes 
    FROM monthly_costs
),
all_consultores AS (
    SELECT nombre as consultor 
    FROM nombres_consultores
),
base_matrix AS (
    SELECT 
        ac.consultor,
        am.mes,
        COALESCE(mc.costo_mensual, 0) as costo
    FROM all_consultores ac
    CROSS JOIN all_months am
    LEFT JOIN monthly_costs mc ON mc.consultor = ac.consultor AND mc.mes = am.mes
)
SELECT 
    consultor as "Consultor",
    mes as "Mes",
    costo as "Costo",
    1 as sort_order
FROM base_matrix
UNION ALL
SELECT 
    'Total' as "Consultor",
    mes as "Mes",
    SUM(costo) as "Costo",
    2 as sort_order
FROM base_matrix
GROUP BY mes
ORDER BY sort_order, "Consultor", "Mes"; 