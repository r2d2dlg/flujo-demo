import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create database connection
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

try:
    print("Connecting to database...")
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    # Get all table names
    tables = inspector.get_table_names()
    
    if not tables:
        print("No tables found in the database.")
    else:
        print("\nTables in the database:")
        print("=" * 50)
        
        for table in tables:
            print(f"\nTable: {table}")
            print("-" * 50)
            
            # Get columns for the table
            columns = inspector.get_columns(table)
            print("Columns:")
            for column in columns:
                # Handle different column type formats
                col_type = str(column['type']).split('(')[0]  # Remove length/precision info
                print(f"  - {column['name']} ({col_type})")
            
            # Get primary key
            pk = inspector.get_pk_constraint(table)
            if pk['constrained_columns']:
                print(f"\nPrimary Key: {', '.join(pk['constrained_columns'])}")
            
            # Get foreign keys
            fks = inspector.get_foreign_keys(table)
            if fks:
                print("\nForeign Keys:")
                for fk in fks:
                    print(f"  - {fk['constrained_columns']} references {fk['referred_table']}({fk['referred_columns']})")
            
            print("=" * 50)
    
except Exception as e:
    print(f"\nError: {e}")
    print("\nPlease check:")
    print("1. Database server is running")
    print("2. Connection details in .env are correct")
    print("3. Your IP is whitelisted in the database server's firewall")
    print(f"4. Database {os.getenv('DB_NAME')} exists")
    print(f"5. User {os.getenv('DB_USER')} has proper permissions")
