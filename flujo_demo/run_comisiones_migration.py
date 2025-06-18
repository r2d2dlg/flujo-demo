#!/usr/bin/env python3
"""
Script to migrate plantilla_comisiones_ventas table to dynamic period format
"""

import os
import sys
from sqlalchemy import create_engine, text

def run_migration():
    """Run the migration to convert plantilla_comisiones_ventas to dynamic format"""
    
    # Database URL - adjust as needed
    DATABASE_URL = "postgresql://postgres:admin@localhost:5432/grupo_11_flujo"
    
    try:
        engine = create_engine(DATABASE_URL)
        
        # Read migration SQL
        with open('migrate_comisiones_to_dynamic.sql', 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        # Execute the migration as a single transaction
        with engine.begin() as connection:
            print("Starting migration...")
            connection.execute(text(migration_sql))
            print("Migration completed successfully!")
            
            # Verify the migration
            result = connection.execute(text("SELECT concepto, amount_2025_06 FROM plantilla_comisiones_ventas LIMIT 5"))
            rows = result.fetchall()
            
            print(f"\nVerification: Found {len(rows)} rows in migrated table:")
            for row in rows:
                print(f"  - {row[0]}: ${row[1]}")
                
    except Exception as e:
        print(f"Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = run_migration()
    if success:
        print("\n✅ Migration completed successfully!")
        print("You can now test the new endpoint: http://localhost:8000/api/ventas/consolidated/cash-flow")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1) 