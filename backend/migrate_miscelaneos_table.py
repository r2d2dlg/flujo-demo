#!/usr/bin/env python3

import psycopg2
from psycopg2 import sql
import sys

def migrate_miscelaneos_table():
    # Database connection parameters
    connection_params = {
        'host': '34.174.189.231',
        'port': 5432,
        'database': 'demoflujo',
        'user': 'arturodlg',
        'password': 'Oc%d}c8lIm:9c2\\S'
    }
    
    # SQL to backup and recreate the table with dynamic columns
    migrate_sql = """
    -- Backup existing data from the old table
    CREATE TEMP TABLE miscelaneos_backup AS SELECT * FROM miscelaneos_miscelaneos;
    
    -- Drop existing tables
    DROP TABLE IF EXISTS miscelaneos CASCADE;
    DROP TABLE IF EXISTS miscelaneos_miscelaneos CASCADE;

    -- Create the new table with dynamic month columns
    CREATE TABLE miscelaneos (
        id SERIAL PRIMARY KEY,
        concepto VARCHAR(255) NOT NULL,
        -- Columnas dinámicas para cada mes (3 meses antes + 36 meses después)
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index
    CREATE INDEX ix_miscelaneos_id ON miscelaneos(id);

    -- Migrate existing data (preserving concepto, setting some example amounts)
    INSERT INTO miscelaneos (concepto, amount_2025_01, amount_2025_02, amount_2025_03)
    SELECT 
        COALESCE(concepto, 'Concepto sin definir') as concepto,
        COALESCE(monto, 0.00) as amount_2025_01,
        COALESCE(monto, 0.00) as amount_2025_02,
        COALESCE(monto, 0.00) as amount_2025_03
    FROM miscelaneos_backup;
    
    -- If no data existed, insert some sample data
    INSERT INTO miscelaneos (concepto, amount_2025_01, amount_2025_02, amount_2025_03)
    SELECT 'Gastos Varios', 5000.00, 5000.00, 5000.00
    WHERE NOT EXISTS (SELECT 1 FROM miscelaneos);
    
    INSERT INTO miscelaneos (concepto, amount_2025_01, amount_2025_02, amount_2025_03)
    SELECT 'Gastos Imprevistos', 3000.00, 3000.00, 3000.00
    WHERE (SELECT COUNT(*) FROM miscelaneos) = 1;
    """
    
    try:
        # Connect to the database
        print("Conectando a la base de datos...")
        conn = psycopg2.connect(**connection_params)
        cursor = conn.cursor()
        
        # Execute the SQL
        print("Migrando tabla miscelaneos...")
        cursor.execute(migrate_sql)
        
        # Commit the transaction
        conn.commit()
        print("✅ Tabla 'miscelaneos' migrada exitosamente!")
        
        # Verify the table was migrated
        cursor.execute("SELECT COUNT(*) FROM miscelaneos;")
        count = cursor.fetchone()[0]
        print(f"✅ Verificación: {count} registros en la tabla migrada")
        
        # Show sample data
        cursor.execute("SELECT concepto, amount_2025_01 FROM miscelaneos LIMIT 3;")
        rows = cursor.fetchall()
        print("✅ Datos de ejemplo:")
        for row in rows:
            print(f"   - {row[0]}: ${row[1] or 0.00}")
        
    except psycopg2.Error as e:
        print(f"❌ Error de base de datos: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        sys.exit(1)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
        print("Conexión cerrada.")

if __name__ == "__main__":
    migrate_miscelaneos_table() 