"""create_vendedores_table

Revision ID: 00b3faac6e55
Revises: 
Create Date: 2025-05-30 21:57:29.403689

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00b3faac6e55'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('vendedores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendedores_id'), 'vendedores', ['id'], unique=False)
    op.create_index(op.f('ix_vendedores_nombre'), 'vendedores', ['nombre'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_vendedores_nombre'), table_name='vendedores')
    op.drop_index(op.f('ix_vendedores_id'), table_name='vendedores')
    op.drop_table('vendedores')
