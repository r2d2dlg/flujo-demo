-- Drop and recreate the view with the correct column names
DROP VIEW IF EXISTS v_estudios_disenos_permisos;

CREATE VIEW v_estudios_disenos_permisos AS
WITH monthly_data AS (
    SELECT 
        id,
        actividad,
        -- Convert nulls to 0
        COALESCE(amount_2024_04, 0) as amount_2024_04,
        COALESCE(amount_2024_05, 0) as amount_2024_05,
        COALESCE(amount_2024_06, 0) as amount_2024_06,
        COALESCE(amount_2024_07, 0) as amount_2024_07,
        COALESCE(amount_2024_08, 0) as amount_2024_08,
        COALESCE(amount_2024_09, 0) as amount_2024_09,
        COALESCE(amount_2024_10, 0) as amount_2024_10,
        COALESCE(amount_2024_11, 0) as amount_2024_11,
        COALESCE(amount_2024_12, 0) as amount_2024_12,
        COALESCE(amount_2025_01, 0) as amount_2025_01,
        COALESCE(amount_2025_02, 0) as amount_2025_02,
        COALESCE(amount_2025_03, 0) as amount_2025_03,
        COALESCE(amount_2025_04, 0) as amount_2025_04,
        COALESCE(amount_2025_05, 0) as amount_2025_05,
        COALESCE(amount_2025_06, 0) as amount_2025_06,
        COALESCE(amount_2025_07, 0) as amount_2025_07,
        COALESCE(amount_2025_08, 0) as amount_2025_08,
        COALESCE(amount_2025_09, 0) as amount_2025_09,
        COALESCE(amount_2025_10, 0) as amount_2025_10,
        COALESCE(amount_2025_11, 0) as amount_2025_11,
        COALESCE(amount_2025_12, 0) as amount_2025_12,
        COALESCE(amount_2026_01, 0) as amount_2026_01,
        COALESCE(amount_2026_02, 0) as amount_2026_02,
        COALESCE(amount_2026_03, 0) as amount_2026_03,
        COALESCE(amount_2026_04, 0) as amount_2026_04,
        COALESCE(amount_2026_05, 0) as amount_2026_05,
        COALESCE(amount_2026_06, 0) as amount_2026_06,
        COALESCE(amount_2026_07, 0) as amount_2026_07,
        COALESCE(amount_2026_08, 0) as amount_2026_08,
        COALESCE(amount_2026_09, 0) as amount_2026_09,
        COALESCE(amount_2026_10, 0) as amount_2026_10,
        COALESCE(amount_2026_11, 0) as amount_2026_11,
        COALESCE(amount_2026_12, 0) as amount_2026_12,
        COALESCE(amount_2027_01, 0) as amount_2027_01,
        COALESCE(amount_2027_02, 0) as amount_2027_02,
        COALESCE(amount_2027_03, 0) as amount_2027_03,
        COALESCE(amount_2027_04, 0) as amount_2027_04,
        COALESCE(amount_2027_05, 0) as amount_2027_05,
        COALESCE(amount_2027_06, 0) as amount_2027_06,
        COALESCE(amount_2027_07, 0) as amount_2027_07,
        COALESCE(amount_2027_08, 0) as amount_2027_08,
        COALESCE(amount_2027_09, 0) as amount_2027_09,
        COALESCE(amount_2027_10, 0) as amount_2027_10,
        COALESCE(amount_2027_11, 0) as amount_2027_11,
        COALESCE(amount_2027_12, 0) as amount_2027_12,
        COALESCE(amount_2028_01, 0) as amount_2028_01,
        COALESCE(amount_2028_02, 0) as amount_2028_02,
        COALESCE(amount_2028_03, 0) as amount_2028_03,
        COALESCE(amount_2028_04, 0) as amount_2028_04,
        COALESCE(amount_2028_05, 0) as amount_2028_05
    FROM estudios_disenos_permisos
),
totals AS (
    SELECT 
        CAST(NULL AS integer) as id,
        'Total' as actividad,
        SUM(amount_2024_04) as amount_2024_04,
        SUM(amount_2024_05) as amount_2024_05,
        SUM(amount_2024_06) as amount_2024_06,
        SUM(amount_2024_07) as amount_2024_07,
        SUM(amount_2024_08) as amount_2024_08,
        SUM(amount_2024_09) as amount_2024_09,
        SUM(amount_2024_10) as amount_2024_10,
        SUM(amount_2024_11) as amount_2024_11,
        SUM(amount_2024_12) as amount_2024_12,
        SUM(amount_2025_01) as amount_2025_01,
        SUM(amount_2025_02) as amount_2025_02,
        SUM(amount_2025_03) as amount_2025_03,
        SUM(amount_2025_04) as amount_2025_04,
        SUM(amount_2025_05) as amount_2025_05,
        SUM(amount_2025_06) as amount_2025_06,
        SUM(amount_2025_07) as amount_2025_07,
        SUM(amount_2025_08) as amount_2025_08,
        SUM(amount_2025_09) as amount_2025_09,
        SUM(amount_2025_10) as amount_2025_10,
        SUM(amount_2025_11) as amount_2025_11,
        SUM(amount_2025_12) as amount_2025_12,
        SUM(amount_2026_01) as amount_2026_01,
        SUM(amount_2026_02) as amount_2026_02,
        SUM(amount_2026_03) as amount_2026_03,
        SUM(amount_2026_04) as amount_2026_04,
        SUM(amount_2026_05) as amount_2026_05,
        SUM(amount_2026_06) as amount_2026_06,
        SUM(amount_2026_07) as amount_2026_07,
        SUM(amount_2026_08) as amount_2026_08,
        SUM(amount_2026_09) as amount_2026_09,
        SUM(amount_2026_10) as amount_2026_10,
        SUM(amount_2026_11) as amount_2026_11,
        SUM(amount_2026_12) as amount_2026_12,
        SUM(amount_2027_01) as amount_2027_01,
        SUM(amount_2027_02) as amount_2027_02,
        SUM(amount_2027_03) as amount_2027_03,
        SUM(amount_2027_04) as amount_2027_04,
        SUM(amount_2027_05) as amount_2027_05,
        SUM(amount_2027_06) as amount_2027_06,
        SUM(amount_2027_07) as amount_2027_07,
        SUM(amount_2027_08) as amount_2027_08,
        SUM(amount_2027_09) as amount_2027_09,
        SUM(amount_2027_10) as amount_2027_10,
        SUM(amount_2027_11) as amount_2027_11,
        SUM(amount_2027_12) as amount_2027_12,
        SUM(amount_2028_01) as amount_2028_01,
        SUM(amount_2028_02) as amount_2028_02,
        SUM(amount_2028_03) as amount_2028_03,
        SUM(amount_2028_04) as amount_2028_04,
        SUM(amount_2028_05) as amount_2028_05
    FROM monthly_data
)
SELECT 
    id,
    actividad,
    -- Calculate year totals
    (amount_2024_04 + amount_2024_05 + amount_2024_06 + amount_2024_07 + 
     amount_2024_08 + amount_2024_09 + amount_2024_10 + amount_2024_11 + 
     amount_2024_12 + amount_2025_01 + amount_2025_02 + amount_2025_03 + 
     amount_2025_04 + amount_2025_05) as total_2024_2025,
    
    (amount_2025_06 + amount_2025_07 + amount_2025_08 + amount_2025_09 + 
     amount_2025_10 + amount_2025_11 + amount_2025_12 + amount_2026_01 + 
     amount_2026_02 + amount_2026_03 + amount_2026_04 + amount_2026_05) as total_2025_2026,
    
    (amount_2026_06 + amount_2026_07 + amount_2026_08 + amount_2026_09 + 
     amount_2026_10 + amount_2026_11 + amount_2026_12 + amount_2027_01 + 
     amount_2027_02 + amount_2027_03 + amount_2027_04 + amount_2027_05) as total_2026_2027,
    
    (amount_2027_06 + amount_2027_07 + amount_2027_08 + amount_2027_09 + 
     amount_2027_10 + amount_2027_11 + amount_2027_12 + amount_2028_01 + 
     amount_2028_02 + amount_2028_03 + amount_2028_04 + amount_2028_05) as total_2027_2028,
    
    -- Include all individual month columns
    amount_2024_04, amount_2024_05, amount_2024_06, amount_2024_07, amount_2024_08, 
    amount_2024_09, amount_2024_10, amount_2024_11, amount_2024_12, amount_2025_01, 
    amount_2025_02, amount_2025_03, amount_2025_04, amount_2025_05, amount_2025_06, 
    amount_2025_07, amount_2025_08, amount_2025_09, amount_2025_10, amount_2025_11, 
    amount_2025_12, amount_2026_01, amount_2026_02, amount_2026_03, amount_2026_04, 
    amount_2026_05, amount_2026_06, amount_2026_07, amount_2026_08, amount_2026_09, 
    amount_2026_10, amount_2026_11, amount_2026_12, amount_2027_01, amount_2027_02, 
    amount_2027_03, amount_2027_04, amount_2027_05, amount_2027_06, amount_2027_07, 
    amount_2027_08, amount_2027_09, amount_2027_10, amount_2027_11, amount_2027_12, 
    amount_2028_01, amount_2028_02, amount_2028_03, amount_2028_04, amount_2028_05
FROM monthly_data
UNION ALL
SELECT * FROM totals; 