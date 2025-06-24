#!/usr/bin/env python3

import psycopg2
from psycopg2 import sql
import sys

def create_gastos_equipo_table():
    # Database connection parameters
    connection_params = {
        'host': '34.174.189.231',
        'port': 5432,
        'database': 'demoflujo',
        'user': 'arturodlg',
        'password': 'Oc%d}c8lIm:9c2\\S'
    }
    
    # SQL to create the table
    create_table_sql = """
    -- Drop existing table if exists
    DROP TABLE IF EXISTS gastos_equipo CASCADE;

    -- Create the table with dynamic month columns
    CREATE TABLE gastos_equipo (
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
    CREATE INDEX ix_gastos_equipo_id ON gastos_equipo(id);

    -- Insert sample data based on the schema provided
    INSERT INTO gastos_equipo (concepto, amount_2025_01, amount_2025_02, amount_2025_03) VALUES
    ('Alquiler Equipo', 59500.00, 59500.00, 59500.00),
    ('Consumo Combustible', 20000.00, 20000.00, 20000.00);
    """
    
    try:
        # Connect to the database
        print("Conectando a la base de datos...")
        conn = psycopg2.connect(**connection_params)
        cursor = conn.cursor()
        
        # Execute the SQL
        print("Ejecutando script SQL...")
        cursor.execute(create_table_sql)
        
        # Commit the transaction
        conn.commit()
        print("✅ Tabla 'gastos_equipo' creada exitosamente!")
        print("✅ Datos de ejemplo insertados!")
        
        # Verify the table was created
        cursor.execute("SELECT COUNT(*) FROM gastos_equipo;")
        count = cursor.fetchone()[0]
        print(f"✅ Verificación: {count} registros en la tabla")
        
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
    create_gastos_equipo_table() 