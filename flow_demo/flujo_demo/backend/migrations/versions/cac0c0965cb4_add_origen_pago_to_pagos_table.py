"""add_origen_pago_to_pagos_table

Revision ID: cac0c0965cb4
Revises: 1e87ee09ea29
Create Date: 2025-05-31 16:07:44.149526

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cac0c0965cb4'
down_revision: Union[str, None] = '1e87ee09ea29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('pagos', sa.Column('origen_pago', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('pagos', 'origen_pago')
