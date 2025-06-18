-- Update totals for 2024-2025
UPDATE estudios_disenos_permisos
SET total_2024_2025 = COALESCE(amount_2024_04, 0) + COALESCE(amount_2024_05, 0) + 
    COALESCE(amount_2024_06, 0) + COALESCE(amount_2024_07, 0) + 
    COALESCE(amount_2024_08, 0) + COALESCE(amount_2024_09, 0) + 
    COALESCE(amount_2024_10, 0) + COALESCE(amount_2024_11, 0) + 
    COALESCE(amount_2024_12, 0) + COALESCE(amount_2025_01, 0) + 
    COALESCE(amount_2025_02, 0) + COALESCE(amount_2025_03, 0) +
    COALESCE(amount_2025_04, 0) + COALESCE(amount_2025_05, 0);

-- Update totals for 2025-2026
UPDATE estudios_disenos_permisos
SET total_2025_2026 = COALESCE(amount_2025_06, 0) + COALESCE(amount_2025_07, 0) + 
    COALESCE(amount_2025_08, 0) + COALESCE(amount_2025_09, 0) + 
    COALESCE(amount_2025_10, 0) + COALESCE(amount_2025_11, 0) + 
    COALESCE(amount_2025_12, 0) + COALESCE(amount_2026_01, 0) + 
    COALESCE(amount_2026_02, 0) + COALESCE(amount_2026_03, 0) +
    COALESCE(amount_2026_04, 0) + COALESCE(amount_2026_05, 0);

-- Update totals for 2026-2027
UPDATE estudios_disenos_permisos
SET total_2026_2027 = COALESCE(amount_2026_06, 0) + COALESCE(amount_2026_07, 0) + 
    COALESCE(amount_2026_08, 0) + COALESCE(amount_2026_09, 0) + 
    COALESCE(amount_2026_10, 0) + COALESCE(amount_2026_11, 0) + 
    COALESCE(amount_2026_12, 0) + COALESCE(amount_2027_01, 0) + 
    COALESCE(amount_2027_02, 0) + COALESCE(amount_2027_03, 0) +
    COALESCE(amount_2027_04, 0) + COALESCE(amount_2027_05, 0);

-- Update totals for 2027-2028
UPDATE estudios_disenos_permisos
SET total_2027_2028 = COALESCE(amount_2027_06, 0) + COALESCE(amount_2027_07, 0) + 
    COALESCE(amount_2027_08, 0) + COALESCE(amount_2027_09, 0) + 
    COALESCE(amount_2027_10, 0) + COALESCE(amount_2027_11, 0) + 
    COALESCE(amount_2027_12, 0) + COALESCE(amount_2028_01, 0) + 
    COALESCE(amount_2028_02, 0) + COALESCE(amount_2028_03, 0) +
    COALESCE(amount_2028_04, 0) + COALESCE(amount_2028_05, 0); 