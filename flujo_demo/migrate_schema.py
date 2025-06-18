import os
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
DB_PARAMS = {
    'dbname': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT')
}

def create_db_connection():
    """Create a database connection"""
    return create_engine(f"postgresql://{DB_PARAMS['user']}:{DB_PARAMS['password']}@{DB_PARAMS['host']}:{DB_PARAMS['port']}/{DB_PARAMS['dbname']}")

def execute_schema():
    """Execute the schema.sql file"""
    engine = create_db_connection()
    
    # Read and execute schema.sql
    with open('schema.sql', 'r') as f:
        schema_sql = f.read()
    
    with engine.begin() as conn:
        # Split the SQL file into individual statements
        statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
        for stmt in statements:
            try:
                conn.execute(text(stmt))
                print(f"Executed: {stmt[:50]}...")
            except Exception as e:
                print(f"Error executing statement: {e}")
                print(f"Statement: {stmt[:50]}...")

def check_old_table_exists(engine):
    """Check if the old table exists"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_name = 'gastos_fijos_operativos'
            );
        """))
        return result.scalar()

def get_table_columns(engine, table_name):
    """Get the columns of a table"""
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name)
    return [col['name'] for col in columns]

def migrate_data():
    """Migrate data from old tables to new schema"""
    engine = create_db_connection()
    
    # Check if old table exists
    if not check_old_table_exists(engine):
        print("No existing data to migrate. Creating empty tables.")
        return
    
    # Get the columns of the old table
    old_columns = get_table_columns(engine, 'gastos_fijos_operativos')
    print(f"Found columns in old table: {old_columns}")
    
    with engine.begin() as conn:
        # First, create the new tables if they don't exist
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS empresas (
                id SERIAL PRIMARY KEY,
                nombre_empresa VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS gastos_fijos_operativos (
                id SERIAL PRIMARY KEY,
                empresa_id INTEGER REFERENCES empresas(id) NOT NULL,
                concepto VARCHAR(255) NOT NULL,
                detalle_pgo TEXT,
                enero NUMERIC(15,2),
                febrero NUMERIC(15,2),
                marzo NUMERIC(15,2),
                abril NUMERIC(15,2),
                mayo NUMERIC(15,2),
                junio NUMERIC(15,2),
                julio NUMERIC(15,2),
                agosto NUMERIC(15,2),
                septiembre NUMERIC(15,2),
                octubre NUMERIC(15,2),
                noviembre NUMERIC(15,2),
                diciembre NUMERIC(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Rename old table to preserve it
        conn.execute(text("""
            ALTER TABLE gastos_fijos_operativos 
            RENAME TO gastos_fijos_operativos_old;
        """))
        
        # Get all unique company names from the old table
        # First, try to find the company name column
        company_column = None
        for col in old_columns:
            if 'empresa' in col.lower() or 'company' in col.lower():
                company_column = col
                break
        
        if company_column:
            # First, get all unique company names
            result = conn.execute(text(f"""
                SELECT DISTINCT {company_column} 
                FROM gastos_fijos_operativos_old
                WHERE {company_column} IS NOT NULL;
            """))
            companies = [row[0] for row in result]
            
            # Insert companies into new empresas table
            for company in companies:
                conn.execute(
                    text("INSERT INTO empresas (nombre_empresa) VALUES (:nombre) ON CONFLICT (nombre_empresa) DO NOTHING"),
                    {"nombre": company}
                )
            
            # Migrate expenses data
            # First, find the concept column
            concept_column = None
            for col in old_columns:
                if 'concepto' in col.lower() or 'concept' in col.lower():
                    concept_column = col
                    break
            
            if concept_column:
                # Build the INSERT statement dynamically based on available columns
                insert_columns = ['empresa_id']
                select_columns = ['e.id']
                
                if concept_column:
                    insert_columns.append('concepto')
                    select_columns.append(f'g.{concept_column}')
                
                # Add month columns if they exist
                months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
                for month in months:
                    if month in old_columns:
                        insert_columns.append(month)
                        select_columns.append(f'g.{month}')
                
                # First, get the company names from the old table
                company_names = conn.execute(text(f"""
                    SELECT DISTINCT {company_column}, id
                    FROM gastos_fijos_operativos_old;
                """))
                
                # Create a mapping of company names to their IDs
                company_map = {row[0]: row[1] for row in company_names}
                
                # Now insert the data using the company IDs
                for company_name, company_id in company_map.items():
                    insert_sql = f"""
                        INSERT INTO gastos_fijos_operativos (
                            {', '.join(insert_columns)}
                        )
                        SELECT 
                            {', '.join(select_columns)}
                        FROM gastos_fijos_operativos_old g
                        WHERE g.{company_column} = :company_name;
                    """
                    conn.execute(text(insert_sql), {"company_name": company_name})
                
                print("Data migration completed successfully!")
            else:
                print("Could not find concept column in old table")
        else:
            print("Could not find company name column in old table")

if __name__ == "__main__":
    print("Executing new schema...")
    execute_schema()
    
    print("\nMigrating data...")
    migrate_data()
    
    print("\nMigration completed successfully!") 