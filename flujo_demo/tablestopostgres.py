import os
import pandas as pd
from sqlalchemy import create_engine, text, Table, Column, Integer, String, Numeric, MetaData
import re
import unicodedata
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

def normalize_str(s):
    """Normalize a string by removing accents and converting to uppercase"""
    if not isinstance(s, str):
        return s
    s = s.strip().upper()
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s

def sanitize_table_name(name):
    """Sanitize a table name to be valid in PostgreSQL"""
    return (
        name.upper()
        .replace(' ', '_')
        .replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
        .replace('Ñ', 'N')
        .replace('?', '').replace('¿', '').replace('!', '').replace('¡', '')
        .replace('.', '').replace(',', '').replace('-', '_').replace('/', '_').replace(':', '_')
        .replace('__', '_')
    )

def safe_float(val):
    """Convert a value to float safely, returning 0.0 if conversion fails"""
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0

def process_excel_sheet(excel_path, sheet_name):
    """Process an Excel sheet and extract structured data"""
    print(f"Processing sheet: {sheet_name} from {excel_path}")
    df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
    
    # Look for the header row (column names)
    header_row = None
    for i in range(min(10, len(df))):
        first_col = df.iloc[i, 0]
        if isinstance(first_col, str) and 'concepto' in first_col.lower():
            header_row = i
            break
    
    if header_row is None:
        print(f"Could not find header row in sheet {sheet_name}")
        return None
    
    # Extract the columns
    columns = df.iloc[header_row].tolist()
    columns = [str(col).strip() if col is not None else f"column_{i}" for i, col in enumerate(columns)]
    
    # Extract data rows (after the header)
    data_df = df.iloc[header_row + 1:].reset_index(drop=True)
    data_df.columns = columns
    
    # Clean up the data
    data_df = data_df.dropna(how='all')
    
    return data_df

def create_table_for_dataframe(engine, table_name, df):
    """Create a table in the database based on the DataFrame structure"""
    print(f"Creating table: {table_name}")
    
    # Create column definitions
    column_defs = []
    for col in df.columns:
        col_name = sanitize_table_name(str(col))
        if col_name.lower() == 'concepto':
            column_defs.append(f"{col_name} TEXT PRIMARY KEY")
        elif any(month in col_name.lower() for month in ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 'total']):
            column_defs.append(f"{col_name} NUMERIC(15,2)")
        else:
            column_defs.append(f"{col_name} TEXT")
    
    # Create table
    create_table_sql = f"""
    CREATE TABLE IF NOT EXISTS {table_name} (
        {', '.join(column_defs)}
    );
    """
    
    with engine.begin() as conn:
        conn.execute(text(create_table_sql))
    
    return create_table_sql

def insert_data_into_table(engine, table_name, df):
    """Insert data from DataFrame into the database table"""
    print(f"Inserting data into table: {table_name}")
    
    # First, truncate the table
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE TABLE {table_name};"))
    
    # Sanitize column names
    df.columns = [sanitize_table_name(str(col)) for col in df.columns]
    
    # Insert data row by row
    rows_inserted = 0
    with engine.begin() as conn:
        for _, row in df.iterrows():
            # Skip empty rows
            if pd.isna(row.iloc[0]) or (isinstance(row.iloc[0], str) and not row.iloc[0].strip()):
                continue
            
            columns = ', '.join(df.columns)
            placeholders = ', '.join([f":{col}" for col in df.columns])
            
            # Convert values to the right types
            values = {}
            for col in df.columns:
                val = row[col]
                if any(month in col.lower() for month in ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 'total']):
                    values[col] = safe_float(val)
                else:
                    values[col] = str(val) if val is not None else None
            
            # Insert the row
            insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
            conn.execute(text(insert_sql), values)
            rows_inserted += 1
    
    print(f"Inserted {rows_inserted} rows into {table_name}")
    return rows_inserted

def create_view_for_table(engine, table_name, group_by_column="CONCEPTO"):
    """Create a view that computes totals for the table"""
    view_name = f"v_{table_name}_totals"
    
    # Get table columns
    with engine.connect() as conn:
        result = conn.execute(text(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name.lower()}'
            ORDER BY ordinal_position;
        """))
        columns = [row[0] for row in result]
    
    # Identify the month columns
    month_columns = [col for col in columns if any(month in col.lower() for month in 
                   ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'])]
    
    # Create the view SQL
    agg_functions = []
    for col in month_columns:
        agg_functions.append(f"SUM({col}) AS {col}")
    
    view_sql = f"""
    CREATE OR REPLACE VIEW {view_name} AS
    SELECT 
        {group_by_column},
        {', '.join(agg_functions)},
        SUM({'+'.join(f'COALESCE({col}, 0)' for col in month_columns)}) AS TOTAL
    FROM {table_name}
    GROUP BY {group_by_column};
    """
    
    with engine.begin() as conn:
        conn.execute(text(view_sql))
    
    print(f"Created view: {view_name}")
    return view_name

def process_all_tables(excel_path, sheet_names=None):
    """Process all specified sheets in an Excel file and create corresponding tables"""
    engine = create_db_connection()
    
    # If no sheet names are provided, get all sheets
    if sheet_names is None:
        xls = pd.ExcelFile(excel_path)
        sheet_names = xls.sheet_names
    
    # Process each sheet
    for sheet_name in sheet_names:
        try:
            print(f"\nProcessing sheet: {sheet_name}")
            df = process_excel_sheet(excel_path, sheet_name)
            
            if df is not None and not df.empty:
                table_name = sanitize_table_name(f"table_{sheet_name}")
                create_table_for_dataframe(engine, table_name, df)
                insert_data_into_table(engine, table_name, df)
                create_view_for_table(engine, table_name)
                print(f"Successfully processed sheet: {sheet_name}")
            else:
                print(f"Skipping sheet: {sheet_name} - No data found")
        except Exception as e:
            print(f"Error processing sheet {sheet_name}: {e}")

def main():
    """Main entry point for the script"""
    print("Tables to Postgres - Starting Data Migration")
    
    # Get Excel file path
    excel_path = os.path.join('Excel', 'Flujo de Caja Grupo 11 2025 Abril.xlsx')
    if not os.path.exists(excel_path):
        print(f"Error: Excel file not found at {excel_path}")
        return
    
    # Process all sheets
    process_all_tables(excel_path)
    
    print("\nData migration completed!")

if __name__ == "__main__":
    main()
