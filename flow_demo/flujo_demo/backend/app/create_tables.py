import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from database import engine
from models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    try:
        logger.info("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created successfully")
    except Exception as e:
        logger.error(f"Error creating tables: {str(e)}")
        raise

if __name__ == "__main__":
    create_tables()
    print("Please ensure your database file (e.g., sql_app.db) is correctly configured and accessible.")
    print("If you are using a persistent database, these tables should now be created.")
    print("For SQLite, the database file will be created/updated in the location specified in database.py.") 