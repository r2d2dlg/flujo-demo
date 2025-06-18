"""create_clientes_table

Revision ID: f93ac3bc8171
Revises: b2dc71bc145e
Create Date: 2025-05-31 12:44:52.335805

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func # For server_default timestamps


# revision identifiers, used by Alembic.
revision: str = 'f93ac3bc8171'
down_revision: Union[str, None] = 'b2dc71bc145e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'clientes',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True, index=True),
        sa.Column('nombre', sa.String(), nullable=False, index=True, unique=True),
        sa.Column('ruc', sa.String(), nullable=True, index=True, unique=True),
        sa.Column('email', sa.String(), nullable=True, index=True, unique=True),
        sa.Column('telefono', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=func.now(), onupdate=func.now(), nullable=False)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('clientes')
