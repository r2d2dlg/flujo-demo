import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

import logging
from app.execute_sql import execute_sql_file

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    try:
        sql_file = Path(__file__).parent.parent / 'create_costo_directo.sql'
        execute_sql_file(str(sql_file))
    except Exception as e:
        logger.error(f"Failed to create costo_directo table: {e}")
        raise

if __name__ == "__main__":
    main() 