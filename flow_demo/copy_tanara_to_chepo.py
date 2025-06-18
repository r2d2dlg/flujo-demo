from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
try:
    DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    engine = create_engine(DATABASE_URL)
    
    # Test the connection
    with engine.connect() as connection:
        connection.execute(text('SELECT 1'))
        
except Exception as e:
    print(f"Error connecting to database: {e}")
    sys.exit(1)

def copy_data(source_table, target_table, connection):
    try:
        # First clear the target table
        connection.execute(text(f'TRUNCATE TABLE \"{target_table}" CASCADE'))
        
        # Copy data from source to target
        query = f"""
            INSERT INTO \"{target_table}" 
            SELECT * FROM \"{source_table}"
        """
        
        result = connection.execute(text(query))
        connection.commit()
        
        # Get the number of rows copied
        count = connection.execute(text(f'SELECT COUNT(*) FROM \"{target_table}"')).scalar()
        print(f"Copied {count} rows from {source_table} to {target_table}")
        
    except SQLAlchemyError as e:
        print(f"Error copying from {source_table} to {target_table}: {str(e)}")
        connection.rollback()

# Main execution
print("\n" + "="*80)
print("COPYING DATA FROM TANARA TO CHEPO TABLES")
print("="*80 + "\n")

table_pairs = [
    ('presupuesto_mercadeo_tanara_casa_modelo', 'presupuesto_mercadeo_chepo_casa_modelo'),
    ('presupuesto_mercadeo_tanara_ferias_eventos', 'presupuesto_mercadeo_chepo_feria_eventos'),
    ('presupuesto_mercadeo_tanara_gastos_publicitarios', 'presupuesto_mercadeo_chepo_gastos_publicitarios'),
    ('presupuesto_mercadeo_tanara_gastos_tramites', 'presupuesto_mercadeo_chepo_gastos_tramites'),
    ('presupuesto_mercadeo_tanara_promociones_y_bonos', 'presupuesto_mercadeo_chepo_promociones_y_bonos'),
    ('presupuesto_mercadeo_tanara_redes_sociales', 'presupuesto_mercadeo_chepo_redes_sociales')
]

with engine.begin() as connection:
    for source, target in table_pairs:
        # Check if source table exists and has data
        result = connection.execute(text(f"""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :table_name
            )
        """), {"table_name": source})
        
        if not result.scalar():
            print(f"Source table {source} does not exist, skipping...")
            continue
            
        # Check if target table exists
        result = connection.execute(text(f"""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :table_name
            )
        """), {"table_name": target})
        
        if not result.scalar():
            print(f"Target table {target} does not exist, skipping...")
            continue
            
        # Copy the data
        copy_data(source, target, connection)

print("\n" + "="*80)
print("DATA COPY COMPLETE")
print("="*80 + "\n")
