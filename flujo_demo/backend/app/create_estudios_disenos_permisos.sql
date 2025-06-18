-- Drop existing view if exists
DROP VIEW IF EXISTS v_estudios_disenos_permisos;

-- Drop existing table if exists
DROP TABLE IF EXISTS estudios_disenos_permisos;

-- Create the table with dynamic month columns
CREATE TABLE estudios_disenos_permisos (
    id SERIAL PRIMARY KEY,
    actividad VARCHAR(255) NOT NULL,
    -- Months will be stored as YYYY_MM columns
    -- Starting from 3 months ago to 36 months ahead
    -- These will be generated dynamically in the view
    amount_2024_01 NUMERIC(15, 2),
    amount_2024_02 NUMERIC(15, 2),
    amount_2024_03 NUMERIC(15, 2),
    amount_2024_04 NUMERIC(15, 2),
    amount_2024_05 NUMERIC(15, 2),
    amount_2024_06 NUMERIC(15, 2),
    amount_2024_07 NUMERIC(15, 2),
    amount_2024_08 NUMERIC(15, 2),
    amount_2024_09 NUMERIC(15, 2),
    amount_2024_10 NUMERIC(15, 2),
    amount_2024_11 NUMERIC(15, 2),
    amount_2024_12 NUMERIC(15, 2),
    amount_2025_01 NUMERIC(15, 2),
    amount_2025_02 NUMERIC(15, 2),
    amount_2025_03 NUMERIC(15, 2),
    amount_2025_04 NUMERIC(15, 2),
    amount_2025_05 NUMERIC(15, 2),
    amount_2025_06 NUMERIC(15, 2),
    amount_2025_07 NUMERIC(15, 2),
    amount_2025_08 NUMERIC(15, 2),
    amount_2025_09 NUMERIC(15, 2),
    amount_2025_10 NUMERIC(15, 2),
    amount_2025_11 NUMERIC(15, 2),
    amount_2025_12 NUMERIC(15, 2),
    amount_2026_01 NUMERIC(15, 2),
    amount_2026_02 NUMERIC(15, 2),
    amount_2026_03 NUMERIC(15, 2),
    amount_2026_04 NUMERIC(15, 2),
    amount_2026_05 NUMERIC(15, 2),
    amount_2026_06 NUMERIC(15, 2),
    amount_2026_07 NUMERIC(15, 2),
    amount_2026_08 NUMERIC(15, 2),
    amount_2026_09 NUMERIC(15, 2),
    amount_2026_10 NUMERIC(15, 2),
    amount_2026_11 NUMERIC(15, 2),
    amount_2026_12 NUMERIC(15, 2),
    amount_2027_01 NUMERIC(15, 2),
    amount_2027_02 NUMERIC(15, 2),
    amount_2027_03 NUMERIC(15, 2),
    amount_2027_04 NUMERIC(15, 2),
    amount_2027_05 NUMERIC(15, 2),
    amount_2027_06 NUMERIC(15, 2),
    amount_2027_07 NUMERIC(15, 2),
    amount_2027_08 NUMERIC(15, 2),
    amount_2027_09 NUMERIC(15, 2),
    amount_2027_10 NUMERIC(15, 2),
    amount_2027_11 NUMERIC(15, 2),
    amount_2027_12 NUMERIC(15, 2),
    amount_2028_01 NUMERIC(15, 2),
    amount_2028_02 NUMERIC(15, 2),
    amount_2028_03 NUMERIC(15, 2),
    amount_2028_04 NUMERIC(15, 2),
    amount_2028_05 NUMERIC(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the view with year groupings
CREATE VIEW v_estudios_disenos_permisos AS
WITH monthly_data AS (
    SELECT 
        id,
        actividad,
        -- Year 2024-2025 (April to May)
        COALESCE(amount_2024_04, 0) as "2024_04",
        COALESCE(amount_2024_05, 0) as "2024_05",
        COALESCE(amount_2024_06, 0) as "2024_06",
        COALESCE(amount_2024_07, 0) as "2024_07",
        COALESCE(amount_2024_08, 0) as "2024_08",
        COALESCE(amount_2024_09, 0) as "2024_09",
        COALESCE(amount_2024_10, 0) as "2024_10",
        COALESCE(amount_2024_11, 0) as "2024_11",
        COALESCE(amount_2024_12, 0) as "2024_12",
        COALESCE(amount_2025_01, 0) as "2025_01",
        COALESCE(amount_2025_02, 0) as "2025_02",
        COALESCE(amount_2025_03, 0) as "2025_03",
        COALESCE(amount_2025_04, 0) as "2025_04",
        COALESCE(amount_2025_05, 0) as "2025_05",
        -- Year 2025-2026 (June to May)
        COALESCE(amount_2025_06, 0) as "2025_06",
        COALESCE(amount_2025_07, 0) as "2025_07",
        COALESCE(amount_2025_08, 0) as "2025_08",
        COALESCE(amount_2025_09, 0) as "2025_09",
        COALESCE(amount_2025_10, 0) as "2025_10",
        COALESCE(amount_2025_11, 0) as "2025_11",
        COALESCE(amount_2025_12, 0) as "2025_12",
        COALESCE(amount_2026_01, 0) as "2026_01",
        COALESCE(amount_2026_02, 0) as "2026_02",
        COALESCE(amount_2026_03, 0) as "2026_03",
        COALESCE(amount_2026_04, 0) as "2026_04",
        COALESCE(amount_2026_05, 0) as "2026_05",
        -- Year 2026-2027 (June to May)
        COALESCE(amount_2026_06, 0) as "2026_06",
        COALESCE(amount_2026_07, 0) as "2026_07",
        COALESCE(amount_2026_08, 0) as "2026_08",
        COALESCE(amount_2026_09, 0) as "2026_09",
        COALESCE(amount_2026_10, 0) as "2026_10",
        COALESCE(amount_2026_11, 0) as "2026_11",
        COALESCE(amount_2026_12, 0) as "2026_12",
        COALESCE(amount_2027_01, 0) as "2027_01",
        COALESCE(amount_2027_02, 0) as "2027_02",
        COALESCE(amount_2027_03, 0) as "2027_03",
        COALESCE(amount_2027_04, 0) as "2027_04",
        COALESCE(amount_2027_05, 0) as "2027_05",
        -- Year 2027-2028 (June to May)
        COALESCE(amount_2027_06, 0) as "2027_06",
        COALESCE(amount_2027_07, 0) as "2027_07",
        COALESCE(amount_2027_08, 0) as "2027_08",
        COALESCE(amount_2027_09, 0) as "2027_09",
        COALESCE(amount_2027_10, 0) as "2027_10",
        COALESCE(amount_2027_11, 0) as "2027_11",
        COALESCE(amount_2027_12, 0) as "2027_12",
        COALESCE(amount_2028_01, 0) as "2028_01",
        COALESCE(amount_2028_02, 0) as "2028_02",
        COALESCE(amount_2028_03, 0) as "2028_03",
        COALESCE(amount_2028_04, 0) as "2028_04",
        COALESCE(amount_2028_05, 0) as "2028_05"
    FROM estudios_disenos_permisos
),
totals AS (
    SELECT 
        NULL as id,
        'Total' as actividad,
        SUM("2024_04") as "2024_04",
        SUM("2024_05") as "2024_05",
        SUM("2024_06") as "2024_06",
        SUM("2024_07") as "2024_07",
        SUM("2024_08") as "2024_08",
        SUM("2024_09") as "2024_09",
        SUM("2024_10") as "2024_10",
        SUM("2024_11") as "2024_11",
        SUM("2024_12") as "2024_12",
        SUM("2025_01") as "2025_01",
        SUM("2025_02") as "2025_02",
        SUM("2025_03") as "2025_03",
        SUM("2025_04") as "2025_04",
        SUM("2025_05") as "2025_05",
        SUM("2025_06") as "2025_06",
        SUM("2025_07") as "2025_07",
        SUM("2025_08") as "2025_08",
        SUM("2025_09") as "2025_09",
        SUM("2025_10") as "2025_10",
        SUM("2025_11") as "2025_11",
        SUM("2025_12") as "2025_12",
        SUM("2026_01") as "2026_01",
        SUM("2026_02") as "2026_02",
        SUM("2026_03") as "2026_03",
        SUM("2026_04") as "2026_04",
        SUM("2026_05") as "2026_05",
        SUM("2026_06") as "2026_06",
        SUM("2026_07") as "2026_07",
        SUM("2026_08") as "2026_08",
        SUM("2026_09") as "2026_09",
        SUM("2026_10") as "2026_10",
        SUM("2026_11") as "2026_11",
        SUM("2026_12") as "2026_12",
        SUM("2027_01") as "2027_01",
        SUM("2027_02") as "2027_02",
        SUM("2027_03") as "2027_03",
        SUM("2027_04") as "2027_04",
        SUM("2027_05") as "2027_05",
        SUM("2027_06") as "2027_06",
        SUM("2027_07") as "2027_07",
        SUM("2027_08") as "2027_08",
        SUM("2027_09") as "2027_09",
        SUM("2027_10") as "2027_10",
        SUM("2027_11") as "2027_11",
        SUM("2027_12") as "2027_12",
        SUM("2028_01") as "2028_01",
        SUM("2028_02") as "2028_02",
        SUM("2028_03") as "2028_03",
        SUM("2028_04") as "2028_04",
        SUM("2028_05") as "2028_05"
    FROM monthly_data
)
SELECT 
    id,
    actividad,
    -- Year totals
    ("2024_04" + "2024_05" + "2024_06" + "2024_07" + "2024_08" + "2024_09" + 
     "2024_10" + "2024_11" + "2024_12" + "2025_01" + "2025_02" + "2025_03" + 
     "2025_04" + "2025_05") as total_2024_2025,
    ("2025_06" + "2025_07" + "2025_08" + "2025_09" + "2025_10" + "2025_11" + 
     "2025_12" + "2026_01" + "2026_02" + "2026_03" + "2026_04" + "2026_05") as total_2025_2026,
    ("2026_06" + "2026_07" + "2026_08" + "2026_09" + "2026_10" + "2026_11" + 
     "2026_12" + "2027_01" + "2027_02" + "2027_03" + "2027_04" + "2027_05") as total_2026_2027,
    ("2027_06" + "2027_07" + "2027_08" + "2027_09" + "2027_10" + "2027_11" + 
     "2027_12" + "2028_01" + "2028_02" + "2028_03" + "2028_04" + "2028_05") as total_2027_2028,
    -- Individual months
    "2024_04", "2024_05", "2024_06", "2024_07", "2024_08", "2024_09", 
    "2024_10", "2024_11", "2024_12", "2025_01", "2025_02", "2025_03", 
    "2025_04", "2025_05", "2025_06", "2025_07", "2025_08", "2025_09", 
    "2025_10", "2025_11", "2025_12", "2026_01", "2026_02", "2026_03", 
    "2026_04", "2026_05", "2026_06", "2026_07", "2026_08", "2026_09", 
    "2026_10", "2026_11", "2026_12", "2027_01", "2027_02", "2027_03", 
    "2027_04", "2027_05", "2027_06", "2027_07", "2027_08", "2027_09", 
    "2027_10", "2027_11", "2027_12", "2028_01", "2028_02", "2028_03", 
    "2028_04", "2028_05"
FROM monthly_data
UNION ALL
SELECT * FROM totals;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON estudios_disenos_permisos TO arturodlg;
GRANT SELECT ON v_estudios_disenos_permisos TO arturodlg;
GRANT USAGE, SELECT ON SEQUENCE estudios_disenos_permisos_id_seq TO arturodlg; 