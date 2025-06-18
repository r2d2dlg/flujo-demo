"""
agentic_sql_executor.py

Provides a function to safely execute agent-generated SQL statements in a PostgreSQL database.
This version is more permissive: it extracts and executes all CREATE TABLE and CREATE VIEW statements (even if preceded by comments or whitespace), and skips any other statements for safety.
"""

import re
from sqlalchemy import text

def safe_execute_agentic_sql(engine, sql):
    """
    Safely execute agent-generated SQL statements in the database.
    Only executes CREATE TABLE and CREATE VIEW statements (even if preceded by comments or whitespace).
    Skips all other statements for safety.
    """
    # Extract all CREATE TABLE and CREATE VIEW statements (multiline, up to the first semicolon)
    create_stmts = re.findall(r'(CREATE\s+(?:TABLE|VIEW)[\s\S]*?;)', sql, re.IGNORECASE)
    if not create_stmts:
        print("[SAFE EXEC] No CREATE TABLE or CREATE VIEW statements found.")
    for stmt in create_stmts:
        try:
            print(f"[SAFE EXEC] Executing statement:\n{stmt}\n")
            with engine.begin() as conn:
                conn.execute(text(stmt))
        except Exception as e:
            print(f"[SAFE EXEC] Error executing statement:\n{stmt}\nError: {e}\n")
    # Log any skipped statements
    skipped = re.sub(r'(CREATE\s+(?:TABLE|VIEW)[\s\S]*?;)', '', sql, flags=re.IGNORECASE).strip()
    if skipped:
        print(f"[SAFE EXEC] Skipped non-CREATE TABLE/VIEW statements:\n{skipped}\n")

# Placeholder for future SQL execution logic for FastAPI backend

# This file will contain functions to execute raw SQL or ORM queries as needed for the dashboards. 