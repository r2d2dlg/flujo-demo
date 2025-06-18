#!/usr/bin/env python3
"""
Dynamic View Creator for Marketing Budget Tables
Generates SQL views that show the last 3 months + next 36 months based on current date.
"""

import os
from datetime import datetime
from dateutil.relativedelta import relativedelta
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

# Project and category mappings
PROJECT_CATEGORIES = {
    'argentina': [
        'casa_modelo',
        'feria_eventos',
        'gastos_casa_model',
        'gastos_publicitarios',
        'gastos_tramites',
        'promociones_y_bonos',
        'redes_sociales'
    ],
    'chepo': [
        'casa_modelo',
        'feria_eventos',
        'gastos_casa_modelo',
        'gastos_publicitarios',
        'gastos_tramites',
        'promociones_y_bonos',
        'redes_sociales'
    ],
    'tanara': [
        'casa_modelo',
        'ferias_eventos',
        'gastos_casa_modelo',
        'gastos_publicitarios',
        'gastos_tramites',
        'promociones_y_bonos',
        'redes_sociales'
    ]
}

def get_dynamic_month_columns():
    """Generate month columns for last 3 months + next 36 months."""
    months = []
    now = datetime.now()
    # Start from 3 months ago
    start = now - relativedelta(months=3)
    
    # Generate 39 months (3 past + current + 35 future)
    for i in range(39):
        month_date = start + relativedelta(months=i)
        month_str = month_date.strftime('%Y/%m')
        months.append(month_str)
    
    return months

def generate_view_sql(project, category, month_columns):
    """Generate SQL for a single view."""
    table_name = f"presupuesto_mercadeo_{project}_{category}"
    view_name = f"v_{table_name}"
    
    # Generate COALESCE columns for main SELECT
    main_columns = []
    for month in month_columns:
        main_columns.append(f'    COALESCE("{month}", 0) AS "{month}"')
    
    # Generate SUM columns for TOTAL row
    sum_columns = []
    for month in month_columns:
        sum_columns.append(f'    SUM(COALESCE("{month}", 0)) AS "{month}"')
    
    sql = f"""-- View for {project} - {category}
CREATE OR REPLACE VIEW {view_name} AS
SELECT
    actividad,
{',\n'.join(main_columns)}
FROM {table_name}
WHERE actividad != 'TOTAL'

UNION ALL

SELECT
    'TOTAL' AS actividad,
{',\n'.join(sum_columns)}
FROM {table_name};
"""
    return sql

def generate_consolidated_view_sql(project, month_columns):
    """Generate SQL for consolidated project view."""
    categories = PROJECT_CATEGORIES.get(project, [])
    if not categories:
        return ""
    
    view_name = f"v_presupuesto_mercadeo_{project}_consolidado"
    
    # Generate COALESCE columns
    coalesce_columns = []
    for month in month_columns:
        coalesce_columns.append(f'        COALESCE("{month}", 0) AS "{month}"')
    
    # Generate UNION clauses for each category
    union_clauses = []
    for category in categories:
        source_view = f"v_presupuesto_mercadeo_{project}_{category}"
        category_display = category.replace('_', ' ').upper()
        
        union_clause = f"""    -- {category_display}
    SELECT 
        '{category_display}' AS categoria,
        actividad,
{',\n'.join(coalesce_columns)}
    FROM {source_view}
    WHERE actividad != 'TOTAL'"""
        union_clauses.append(union_clause)
    
    # Generate final SELECT columns
    select_columns = []
    for month in month_columns:
        select_columns.append(f'    "{month}"')
    
    sql = f"""-- Consolidated view for {project.upper()} project
CREATE OR REPLACE VIEW {view_name} AS
WITH {project}_combined AS (
{'\n    \n    UNION ALL\n    \n'.join(union_clauses)}
)
SELECT 
    '{project.upper()}' AS proyecto,
    categoria,
    actividad,
{',\n'.join(select_columns)}
FROM {project}_combined
ORDER BY categoria, actividad;
"""
    return sql

def generate_summary_view_sql(project, month_columns):
    """Generate SQL for project summary view."""
    consolidated_view = f"v_presupuesto_mercadeo_{project}_consolidado"
    summary_view = f"v_presupuesto_mercadeo_{project}_resumen"
    
    # Generate SUM columns
    sum_columns = []
    for month in month_columns:
        sum_columns.append(f'    SUM("{month}") AS "{month}"')
    
    sql = f"""-- Summary view for {project.upper()} project
CREATE OR REPLACE VIEW {summary_view} AS
SELECT 
    '{project.upper()}' AS proyecto,
    'TOTAL GENERAL' AS categoria,
    'TODAS LAS CATEGORÍAS' AS actividad,
{',\n'.join(sum_columns)}
FROM {consolidated_view};
"""
    return sql

def main():
    """Generate and optionally execute dynamic view SQL."""
    print("🔄 Generating dynamic marketing budget views...")
    print(f"📅 Current date: {datetime.now().strftime('%Y-%m-%d')}")
    
    # Get dynamic month columns
    month_columns = get_dynamic_month_columns()
    print(f"📊 Date range: {month_columns[0]} to {month_columns[-1]} ({len(month_columns)} months)")
    
    # Generate SQL for all views
    all_sql = []
    all_sql.append("-- Dynamic Marketing Budget Views")
    all_sql.append(f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    all_sql.append(f"-- Date range: {month_columns[0]} to {month_columns[-1]}")
    all_sql.append("")
    
    # Generate individual category views
    for project in PROJECT_CATEGORIES:
        all_sql.append(f"-- === {project.upper()} PROJECT VIEWS ===")
        all_sql.append("")
        
        for category in PROJECT_CATEGORIES[project]:
            view_sql = generate_view_sql(project, category, month_columns)
            all_sql.append(view_sql)
            all_sql.append("")
        
        # Generate consolidated view
        consolidated_sql = generate_consolidated_view_sql(project, month_columns)
        all_sql.append(consolidated_sql)
        all_sql.append("")
        
        # Generate summary view
        summary_sql = generate_summary_view_sql(project, month_columns)
        all_sql.append(summary_sql)
        all_sql.append("")
    
    # Write to file
    output_file = "create_dynamic_views.sql"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(all_sql))
    
    print(f"✅ SQL generated and saved to: {output_file}")
    
    # Ask user if they want to execute
    execute = input("\n🤔 Do you want to execute this SQL against the database? (y/N): ").lower().strip()
    
    if execute == 'y':
        try:
            engine = create_engine(DATABASE_URL)
            print("🔄 Executing SQL...")
            
            with engine.begin() as conn:
                conn.execute(text('\n'.join(all_sql)))
            
            print("✅ Views created successfully!")
            
        except Exception as e:
            print(f"❌ Error executing SQL: {e}")
            print("💡 You can manually execute the generated SQL file instead.")
    else:
        print("💡 SQL saved to file. You can review and execute it manually.")
    
    print(f"\n📝 To regenerate views next month, simply run: python {__file__}")

if __name__ == "__main__":
    main() 