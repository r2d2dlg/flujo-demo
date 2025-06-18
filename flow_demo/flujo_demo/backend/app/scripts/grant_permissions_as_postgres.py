import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

import os
import logging
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    try:
        # Store original env vars
        original_user = os.environ.get('DB_USER')
        
        # Set postgres credentials
        os.environ['DB_USER'] = 'postgres'
        # You'll need to enter the postgres password when running the script
        postgres_password = input("Enter postgres user password: ")
        os.environ['DB_PASSWORD'] = postgres_password

        # Get other connection details from environment
        DB_HOST = os.getenv("DB_HOST", "34.174.189.231")
        DB_PORT = os.getenv("DB_PORT", "5432")
        DB_NAME = os.getenv("DB_NAME", "grupo11flujo")

        # Create connection URL
        db_url = f"postgresql://postgres:{quote_plus(postgres_password)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        
        # Create engine
        engine = create_engine(db_url)
        
        # SQL statements to grant permissions
        grant_statements = """
        GRANT ALL ON costo_directo TO arturodlg;
        GRANT ALL ON costo_directo_id_seq TO arturodlg;
        GRANT ALL ON v_costo_directo TO arturodlg;
        GRANT USAGE ON SCHEMA public TO arturodlg;
        """
        
        # Execute the statements
        with engine.connect() as conn:
            logger.info("Executing GRANT statements...")
            conn.execute(text(grant_statements))
            conn.commit()
            logger.info("Permissions granted successfully!")

    except Exception as e:
        logger.error(f"Error granting permissions: {e}")
        raise
    finally:
        # Restore original env vars
        if original_user:
            os.environ['DB_USER'] = original_user

if __name__ == "__main__":
    main() 