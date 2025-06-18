"""Creates the standardized estudios_disenos_permisos table

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2025-06-12 10:52:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text
from datetime import datetime
from dateutil.relativedelta import relativedelta

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = None # Set to previous migration ID if applicable
branch_labels = None
depends_on = None

def get_dynamic_month_columns() -> list[str]:
    """
    Generates a list of 39 monthly column names in 'amount_YYYY_MM' format:
    3 months in the past, the current month, and 35 months in the future.
    """
    columns = []
    start_date = datetime.now() - relativedelta(months=3)
    for i in range(39):
        current_month = start_date + relativedelta(months=i)
        columns.append(f"amount_{current_month.strftime('%Y_%m')}")
    return columns

def upgrade():
    # Drop old table if it exists
    op.execute("DROP TABLE IF EXISTS estudios_disenos_permisos CASCADE")

    dynamic_columns = get_dynamic_month_columns()
    column_definitions = [f'"{col}" NUMERIC(15, 2)' for col in dynamic_columns]
    
    create_table_sql = f"""
    CREATE TABLE estudios_disenos_permisos (
        id SERIAL PRIMARY KEY,
        actividad VARCHAR(255) NOT NULL,
        {', '.join(column_definitions)},
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    """
    op.execute(create_table_sql)
    op.create_index(op.f('ix_estudios_disenos_permisos_id'), 'estudios_disenos_permisos', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_estudios_disenos_permisos_id'), table_name='estudios_disenos_permisos')
    op.drop_table('estudios_disenos_permisos')
