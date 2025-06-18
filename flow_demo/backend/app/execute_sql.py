import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def execute_sql_file(file_path):
    try:
        # Read the SQL file
        with open(file_path, 'r') as file:
            sql = file.read()
            
        logger.info(f"Executing SQL from {file_path}")
        logger.info(f"SQL content:\n{sql}")
        
        # Execute the SQL
        with engine.connect() as connection:
            connection.execute(text(sql))
            connection.commit()
            
        logger.info("SQL executed successfully")
        
    except Exception as e:
        logger.error(f"Error executing SQL: {str(e)}")
        raise

if __name__ == "__main__":
    execute_sql_file('create_table.sql') 