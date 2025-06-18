-- Delete duplicate records keeping only the latest ones
WITH RankedRows AS (
  SELECT 
    id,
    actividad,
    ROW_NUMBER() OVER (PARTITION BY actividad ORDER BY created_at DESC) as rn
  FROM estudios_disenos_permisos
)
DELETE FROM estudios_disenos_permisos
WHERE id IN (
  SELECT id 
  FROM RankedRows 
  WHERE rn > 1
); 