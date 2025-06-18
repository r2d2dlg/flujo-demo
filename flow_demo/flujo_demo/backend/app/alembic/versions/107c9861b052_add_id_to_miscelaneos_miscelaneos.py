"""add_id_to_miscelaneos_miscelaneos

Revision ID: 107c9861b052
Revises: d4e5f6a7b8c9
Create Date: 2025-06-08 19:36:37.633026

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '107c9861b052'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # op.add_column('miscelaneos_miscelaneos', sa.Column('id', sa.Integer(), nullable=False, primary_key=True, autoincrement=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('miscelaneos_miscelaneos', 'id')
