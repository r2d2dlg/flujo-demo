import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / 'app'))

from database import get_db_connection

def create_sales_projections_table():
    """Create the sales_projections table manually"""
    
    create_table_sql = '''
    CREATE TABLE IF NOT EXISTS sales_projections (
        id SERIAL PRIMARY KEY,
        scenario_project_id INTEGER NOT NULL REFERENCES scenario_projects(id),
        scenario_name VARCHAR NOT NULL,
        monthly_revenue JSONB NOT NULL,
        is_active BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_sales_projections_scenario_project_id ON sales_projections(scenario_project_id);
    CREATE INDEX IF NOT EXISTS idx_sales_projections_is_active ON sales_projections(is_active);
    '''
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(create_table_sql)
        conn.commit()
        print('✅ sales_projections table created successfully!')
        return True
    except Exception as e:
        print(f'❌ Error creating table: {e}')
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    success = create_sales_projections_table()
    sys.exit(0 if success else 1) 