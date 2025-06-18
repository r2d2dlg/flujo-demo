"""create_presupuesto_gastos_fijos_view

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2024-03-19 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Create the view for fixed operational expenses summary."""
    # Drop the view if it exists
    op.execute('DROP VIEW IF EXISTS v_presupuesto_gastos_fijos_operativos_resumen CASCADE;')
    
    # Create the summary view
    op.execute("""
    CREATE VIEW v_presupuesto_gastos_fijos_operativos_resumen AS
    SELECT 
        "CONCEPTO",
        SUM("ENERO") as "ENERO",
        SUM("FEBRERO") as "FEBRERO",
        SUM("MARZO") as "MARZO",
        SUM("ABRIL") as "ABRIL",
        SUM("MAYO") as "MAYO",
        SUM("JUNIO") as "JUNIO",
        SUM("JULIO") as "JULIO",
        SUM("AGOSTO") as "AGOSTO",
        SUM("SEPTIEMBRE") as "SEPTIEMBRE",
        SUM("OCTUBRE") as "OCTUBRE",
        SUM("NOVIEMBRE") as "NOVIEMBRE",
        SUM("DICIEMBRE") as "DICIEMBRE",
        SUM("ENERO" + "FEBRERO" + "MARZO" + "ABRIL" + "MAYO" + "JUNIO" + 
            "JULIO" + "AGOSTO" + "SEPTIEMBRE" + "OCTUBRE" + "NOVIEMBRE" + "DICIEMBRE") as "TOTAL_ANUAL"
    FROM presupuesto_gastos_fijos_operativos
    GROUP BY "CONCEPTO"
    
    UNION ALL
    
    SELECT 
        'TOTAL' as "CONCEPTO",
        SUM("ENERO") as "ENERO",
        SUM("FEBRERO") as "FEBRERO",
        SUM("MARZO") as "MARZO",
        SUM("ABRIL") as "ABRIL",
        SUM("MAYO") as "MAYO",
        SUM("JUNIO") as "JUNIO",
        SUM("JULIO") as "JULIO",
        SUM("AGOSTO") as "AGOSTO",
        SUM("SEPTIEMBRE") as "SEPTIEMBRE",
        SUM("OCTUBRE") as "OCTUBRE",
        SUM("NOVIEMBRE") as "NOVIEMBRE",
        SUM("DICIEMBRE") as "DICIEMBRE",
        SUM("ENERO" + "FEBRERO" + "MARZO" + "ABRIL" + "MAYO" + "JUNIO" + 
            "JULIO" + "AGOSTO" + "SEPTIEMBRE" + "OCTUBRE" + "NOVIEMBRE" + "DICIEMBRE") as "TOTAL_ANUAL"
    FROM presupuesto_gastos_fijos_operativos;
    """)

def downgrade() -> None:
    """Remove the view."""
    op.execute('DROP VIEW IF EXISTS v_presupuesto_gastos_fijos_operativos_resumen;') 