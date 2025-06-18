"""Creates the standardized pagos_tierra table

Revision ID: create_pagos_tierra_standard
Revises: create_estudios_permisos_standard

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text
from datetime import datetime
from dateutil.relativedelta import relativedelta

# revision identifiers, used by Alembic.
revision = 'create_pagos_tierra_standard'
down_revision = 'a1b2c3d4e5f6' # Chain this migration
branch_labels = None
depends_on = None

def get_dynamic_month_columns() -> list[str]:
    """
    Generates a list of 39 monthly column names in 'amount_YYYY_MM' format.
    """
    columns = []
    start_date = datetime.now() - relativedelta(months=3)
    for i in range(39):
        current_month = start_date + relativedelta(months=i)
        columns.append(f"amount_{current_month.strftime('%Y_%m')}")
    return columns

def upgrade():
    op.execute("DROP TABLE IF EXISTS pagos_tierra CASCADE")

    dynamic_columns = get_dynamic_month_columns()
    column_definitions = [f'"{col}" NUMERIC(15, 2)' for col in dynamic_columns]
    
    create_table_sql = f"""
    CREATE TABLE pagos_tierra (
        id SERIAL PRIMARY KEY,
        actividad VARCHAR(255) NOT NULL,
        {', '.join(column_definitions)},
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    """
    op.execute(create_table_sql)
    op.create_index(op.f('ix_pagos_tierra_id'), 'pagos_tierra', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_pagos_tierra_id'), table_name='pagos_tierra')
    op.drop_table('pagos_tierra')
