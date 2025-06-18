"""create_lineas_credito_and_usos_tables

Revision ID: 1e87ee09ea29
Revises: b38cb09f63f9
Create Date: 2025-05-31 15:17:10.047924

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e87ee09ea29'
down_revision: Union[str, None] = 'b38cb09f63f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
