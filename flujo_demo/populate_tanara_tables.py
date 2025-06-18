from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
engine = create_engine(DATABASE_URL)

# Sample data for each table that needs updating
SAMPLE_DATA = {
    'presupuesto_mercadeo_tanara_gastos_tramites': [
        ['Trámites legales', 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 2400],
        ['Permisos municipales', 0, 0, 500, 0, 0, 0, 0, 0, 500, 0, 0, 0, 1000],
        ['Gastos notariales', 0, 0, 0, 300, 0, 0, 0, 300, 0, 0, 0, 0, 600]
    ],
    'presupuesto_mercadeo_tanara_promociones_y_bonos': [
        ['Bono por referencia', 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 12000],
        ['Promoción de lanzamiento', 2000, 2000, 1000, 0, 0, 0, 0, 0, 0, 0, 500, 1000, 6500],
        ['Descuentos por pronto pago', 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 6000]
    ],
    'presupuesto_mercadeo_tanara_ferias_eventos': [
        ['Eventos comunitarios', 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 2400],
        ['Feria de vivienda', 0, 0, 3000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3000]
    ],
    'presupuesto_mercadeo_tanara_gastos_publicitarios': [
        ['Publicidad en radio', 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 3600],
        ['Anuncios en periódicos', 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 6000]
    ]
}

def populate_table(table_name, data):
    with engine.begin() as connection:
        # Clear the table first
        connection.execute(text(f'TRUNCATE TABLE \"{table_name}" CASCADE'))
        
        # Insert sample data
        for row in data:
            # Prepare the values with proper parameter binding
            placeholders = ", ".join([f':val{i}' for i in range(len(row))])
            params = {f'val{i}': val for i, val in enumerate(row)}
            
            # Execute the insert with parameters
            query = f"""
                INSERT INTO \"{table_name}" 
                VALUES ({placeholders})
            """
            connection.execute(text(query), params)
        
        # Verify the count
        count = connection.execute(text(f'SELECT COUNT(*) FROM \"{table_name}"')).scalar()
        print(f"Inserted {count} rows into {table_name}")

def main():
    print("\n" + "="*80)
    print("UPDATING TANARA MARKETING TABLES")
    print("="*80 + "\n")
    
    for table_name, data in SAMPLE_DATA.items():
        try:
            populate_table(table_name, data)
        except Exception as e:
            print(f"Error populating {table_name}: {str(e)}")
    
    print("\n" + "="*80)
    print("DATA POPULATION COMPLETE")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
