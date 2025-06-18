"""create_pagos_table

Revision ID: b2dc71bc145e
Revises: 00b3faac6e55
Create Date: 2025-05-31 12:21:00.314389

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func # For server_default timestamps


# revision identifiers, used by Alembic.
revision: str = 'b2dc71bc145e'
down_revision: Union[str, None] = '00b3faac6e55'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'pagos',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True, index=True),
        sa.Column('cliente_id', sa.Integer(), nullable=False, index=True),
        sa.Column('proyecto_keyword', sa.String(), nullable=True, index=True),
        sa.Column('monto', sa.Numeric(15, 2), nullable=False),
        sa.Column('fecha_pago', sa.Date(), nullable=False, index=True),
        sa.Column('metodo_pago', sa.String(), nullable=False),
        sa.Column('referencia', sa.String(), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=func.now(), onupdate=func.now(), nullable=False)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('pagos')
