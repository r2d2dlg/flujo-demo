import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

import logging
from sqlalchemy import text
from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    try:
        with engine.connect() as conn:
            # Test SELECT from table
            logger.info("Testing SELECT from costo_directo table...")
            result = conn.execute(text("SELECT COUNT(*) FROM costo_directo")).scalar()
            logger.info(f"Found {result} rows in costo_directo table")

            # Test SELECT from view
            logger.info("Testing SELECT from v_costo_directo view...")
            result = conn.execute(text("SELECT * FROM v_costo_directo")).all()
            logger.info(f"Successfully retrieved {len(result)} rows from v_costo_directo view")
            
            # Show some sample data
            if result:
                logger.info("Sample row from view:")
                row = result[0]
                logger.info(f"  ID: {row.id}")
                logger.info(f"  Actividad: {row.actividad}")
                logger.info(f"  Total: {row.total}")

    except Exception as e:
        logger.error(f"Error verifying access: {e}")
        raise

if __name__ == "__main__":
    main() 