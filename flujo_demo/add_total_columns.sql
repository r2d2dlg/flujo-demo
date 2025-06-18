-- Add total columns for each period
ALTER TABLE estudios_disenos_permisos
ADD COLUMN total_2024_2025 DECIMAL(10,2),
ADD COLUMN total_2025_2026 DECIMAL(10,2),
ADD COLUMN total_2026_2027 DECIMAL(10,2),
ADD COLUMN total_2027_2028 DECIMAL(10,2); 