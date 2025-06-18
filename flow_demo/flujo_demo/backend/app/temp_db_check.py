import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import SQLALCHEMY_DATABASE_URL
from sqlalchemy import create_engine, text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database():
    try:
        # Create engine
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        # Try to connect and execute a query
        with engine.connect() as connection:
            # List all tables first
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result]
            logger.info(f"All tables in database: {tables}")
            
            # Check if table exists and get its data
            try:
                result = connection.execute(text('SELECT "NOMBRE", "Horas", "Sal. Bruto", "I.S.R.", "Otros Desc." FROM planilla_administracion;'))
                data = result.fetchall()
                logger.info("Table exists and contains data:")
                for row in data:
                    logger.info(f"Row: {row}")
                
                # Get column information
                result = connection.execute(text("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'planilla_administracion'
                    ORDER BY ordinal_position;
                """))
                logger.info("\nTable structure:")
                for row in result:
                    logger.info(f"Column: {row.column_name}, Type: {row.data_type}, Nullable: {row.is_nullable}")
                    
            except Exception as e:
                logger.error(f"Error querying table: {str(e)}")
                
        logger.info("Database check completed successfully")
        
    except Exception as e:
        logger.error(f"Error checking database: {str(e)}")
        raise

if __name__ == "__main__":
    check_database() 