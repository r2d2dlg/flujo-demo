import os
import glob
import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
import pandas as pd
from pathlib import Path

# Load environment variables from .env file
print("Loading environment variables...")
load_dotenv(override=True)  # Force reload of environment variables

# Debug: Print all database-related environment variables
print("Current environment variables:")
for var in ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']:
    print(f"{var}: {'*' * len(os.getenv(var, '')) if 'PASSWORD' in var else os.getenv(var, 'Not set')}")

def get_db_connection():
    """Create and return a database connection to Google Cloud SQL."""
    try:
        # Get connection parameters from environment variables
        db_host = os.getenv('DB_HOST', '')
        db_port = os.getenv('DB_PORT', '5432')
        db_name = os.getenv('DB_NAME')
        db_user = os.getenv('DB_USER')
        db_password = os.getenv('DB_PASSWORD')
        
        # Check if port is included in DB_HOST (e.g., 'host:port')
        if ':' in db_host:
            db_host, db_port = db_host.split(':', 1)
        
        if not all([db_host, db_name, db_user, db_password]):
            raise ValueError("Missing required database connection parameters in .env file")
        
        print(f"Connecting to {db_user}@{db_host}:{db_port}/{db_name}")
        
        # Construct connection string without SSL
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port,
            # Disable SSL for development
            sslmode='disable',
            connect_timeout=10  # Add timeout to prevent hanging
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        print("Please check your .env file and database connection settings.")
        print("Make sure your IP is whitelisted in Google Cloud SQL.")
        raise

def create_table_from_csv(conn, table_name, csv_path):
    """Create a table in the database based on the CSV structure."""
    try:
        # Read the first few rows to get the structure
        df = pd.read_csv(csv_path, nrows=5)
        
        # Generate column definitions
        columns = []
        for col, dtype in df.dtypes.items():
            if 'int' in str(dtype):
                col_type = 'INTEGER'
            elif 'float' in str(dtype):
                col_type = 'FLOAT'
            elif 'datetime' in str(dtype):
                col_type = 'TIMESTAMP'
            else:
                col_type = 'TEXT'
            columns.append(f'"{col}" {col_type}')
        
        # Create the table
        with conn.cursor() as cur:
            # Drop table if it exists
            cur.execute(f'DROP TABLE IF EXISTS \"{table_name}\" CASCADE')
            
            # Create new table
            create_table_sql = f'CREATE TABLE \"{table_name}\" (\n    ' + ',\n    '.join(columns) + '\n)'
            cur.execute(create_table_sql)
            
            # Import data using COPY
            with open(csv_path, 'r', encoding='utf-8') as f:
                next(f)  # Skip the header
                cur.copy_expert(f'COPY \"{table_name}\" FROM STDIN WITH CSV HEADER', f)
            
            print(f"Successfully imported {os.path.basename(csv_path)} into table {table_name}")
            
    except Exception as e:
        print(f"Error processing {csv_path}: {e}")
        raise

def main():
    # Directory containing CSV files
    csv_dir = Path('backend/tableexport')
    
    # Get all CSV files
    csv_files = list(csv_dir.glob('*.csv'))
    
    if not csv_files:
        print(f"No CSV files found in {csv_dir}")
        return
    
    try:
        # Connect to the database
        conn = get_db_connection()
        
        # Process each CSV file
        for csv_file in csv_files:
            # Generate table name from filename (remove extension and replace special chars)
            table_name = csv_file.stem.lower()
            
            print(f"Processing {csv_file.name}...")
            create_table_from_csv(conn, table_name, csv_file)
        
        print("\nAll files have been imported successfully!")
        
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
