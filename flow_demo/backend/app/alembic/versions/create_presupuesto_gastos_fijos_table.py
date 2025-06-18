"""create_presupuesto_gastos_fijos_table

Revision ID: c3d4e5f6a7b8
Revises: 69d1c74b8719
Create Date: 2024-03-19 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = '69d1c74b8719'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Create the table for fixed operational expenses."""
    op.create_table(
        'presupuesto_gastos_fijos_operativos',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('CONCEPTO', sa.String(255), nullable=False),
        sa.Column('ENERO', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('FEBRERO', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('MARZO', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('ABRIL', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('MAYO', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('JUNIO', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('JULIO', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('AGOSTO', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('SEPTIEMBRE', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('OCTUBRE', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('NOVIEMBRE', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('DICIEMBRE', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False)
    )

def downgrade() -> None:
    """Remove the table."""
    op.drop_table('presupuesto_gastos_fijos_operativos') 