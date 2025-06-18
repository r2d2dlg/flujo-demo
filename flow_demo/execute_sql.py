import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def execute_sql_file(file_path):
    # Database connection
    DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    engine = create_engine(DATABASE_URL)
    
    try:
        with open(file_path, 'r') as file:
            sql = file.read()
        
        with engine.connect() as connection:
            # Execute the entire SQL as one statement
            connection.execute(sql)
            connection.commit()
            print(f"Successfully executed SQL from {file_path}")
            
    except Exception as e:
        print(f"Error executing SQL: {str(e)}")

if __name__ == "__main__":
    execute_sql_file('create_missing_views.sql')
