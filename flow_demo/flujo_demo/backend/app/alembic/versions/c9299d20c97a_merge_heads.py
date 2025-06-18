"""merge heads

Revision ID: c9299d20c97a
Revises: 107c9861b052, create_proyeccion_ventas_standard
Create Date: 2025-06-17 15:02:27.855892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9299d20c97a'
down_revision: Union[str, None] = ('107c9861b052', 'b7c8d9e0f1a2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
