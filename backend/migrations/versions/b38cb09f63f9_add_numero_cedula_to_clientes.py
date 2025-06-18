"""add_numero_cedula_to_clientes

Revision ID: b38cb09f63f9
Revises: f93ac3bc8171
Create Date: 2025-05-31 13:45:21.017007

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b38cb09f63f9'
down_revision: Union[str, None] = 'f93ac3bc8171' # Ensure this points to the previous client migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('clientes', sa.Column('numero_cedula', sa.String(), nullable=True, index=True, unique=True))


def downgrade() -> None:
    op.drop_column('clientes', 'numero_cedula')
