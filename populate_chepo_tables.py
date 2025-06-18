from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import random

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
engine = create_engine(DATABASE_URL)

# Sample data for each table
SAMPLE_DATA = {
    'presupuesto_mercadeo_chepo_gastos_publicitarios': [
        ['Anuncios en periódicos locales', '500', '500', '500', '500', '500', '500', '500', '500', '500', '500', '500', '500', '6000'],
        ['Publicidad en radio', '300', '300', '300', '300', '300', '300', '300', '300', '300', '300', '300', '300', '3600'],
        ['Vallas publicitarias', '1000', '0', '0', '1000', '0', '0', '1000', '0', '0', '1000', '0', '0', '4000']
    ],
    'presupuesto_mercadeo_chepo_feria_eventos': [
        ['Feria de vivienda Q1', '0', '0', '2500', '0', '0', '0', '0', '0', '0', '0', '0', '0', '2500'],
        ['Feria de vivienda Q3', '0', '0', '0', '0', '0', '0', '0', '3000', '0', '0', '0', '0', '3000'],
        ['Eventos comunitarios', '200', '200', '200', '200', '200', '200', '200', '200', '200', '200', '200', '200', '2400']
    ],
    'presupuesto_mercadeo_chepo_promociones_y_bonos': [
        ['Bono por referencia', '1000', '1000', '1000', '1000', '1000', '1000', '1000', '1000', '1000', '1000', '1000', '1000', '12000'],
        ['Promoción de temporada baja', '0', '0', '0', '500', '500', '500', '0', '0', '500', '500', '500', '0', '3000']
    ],
    'presupuesto_mercadeo_chepo_redes_sociales': [
        ['Gestión de redes sociales', '400', '400', '400', '400', '400', '400', '400', '400', '400', '400', '400', '400', '4800'],
        ['Campañas pagadas', '600', '600', '600', '600', '600', '600', '600', '600', '600', '600', '600', '600', '7200']
    ],
    'presupuesto_mercadeo_chepo_gastos_tramites': [
        ['Trámites legales', '200', '200', '200', '200', '200', '200', '200', '200', '200', '200', '200', '200', '2400'],
        ['Permisos municipales', '0', '0', '500', '0', '0', '0', '0', '0', '500', '0', '0', '0', '1000']
    ],
    'presupuesto_mercadeo_chepo_casa_modelo': [
        ['Mantenimiento casa modelo', '300', '300', '300', '300', '300', '300', '300', '300', '300', '300', '300', '300', '3600'],
        ['Suministros para visitas', '100', '100', '100', '100', '100', '100', '100', '100', '100', '100', '100', '100', '1200']
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
    print("POPULATING CHEPO MARKETING TABLES")
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
