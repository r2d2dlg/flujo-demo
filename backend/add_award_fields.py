#!/usr/bin/env python3
"""
Script to add award fields to construction_projects table
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    sys.exit(1)

print(f"Connecting to database...")

# Create engine
engine = create_engine(DATABASE_URL)

# SQL statements to add the fields
sql_statements = [
    "ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS award_amount NUMERIC(15, 2);",
    "ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS award_date TIMESTAMP;",
    "ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS contract_duration_days INTEGER;",
    "ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS award_notes TEXT;",
    "ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS estimated_completion_date DATE;",
]

try:
    with engine.connect() as conn:
        # Begin transaction
        trans = conn.begin()
        
        try:
            for sql in sql_statements:
                print(f"Executing: {sql}")
                conn.execute(text(sql))
            
            # Commit transaction
            trans.commit()
            print("✅ Award fields added successfully to construction_projects table!")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Error executing SQL: {e}")
            sys.exit(1)
            
except Exception as e:
    print(f"❌ Error connecting to database: {e}")
    sys.exit(1)

print("🎉 Database schema updated successfully!") 