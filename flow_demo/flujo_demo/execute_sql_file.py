import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

def execute_sql_file(file_path):
    # Load environment variables from the .env file in the current directory
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(env_path)
    
    # Get database URL from environment variables
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment variables")
        return False
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Read SQL file
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_script = file.read()
        
        # Split the script into individual statements
        statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
        
        # Execute each statement
        with engine.connect() as connection:
            for statement in statements:
                try:
                    print(f"Executing: {statement[:100]}...")
                    connection.execute(text(statement))
                    connection.commit()
                except Exception as e:
                    print(f"Error executing statement: {e}")
                    connection.rollback()
                    return False
        
        print("\nSQL script executed successfully!")
        return True
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python execute_sql_file.py <path_to_sql_file>")
        sys.exit(1)
    
    sql_file = sys.argv[1]
    if not os.path.exists(sql_file):
        print(f"Error: File '{sql_file}' not found")
        sys.exit(1)
    
    success = execute_sql_file(sql_file)
    if not success:
        print("Failed to execute the SQL script.")
        sys.exit(1)
