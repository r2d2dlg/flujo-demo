"""Add tipo_linea column to lineas_credito table

Revision ID: add_tipo_linea_column
Revises: previous_revision_id
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_tipo_linea_column'
down_revision = None  # Replace with the actual previous revision ID
branch_labels = None
depends_on = None


def upgrade():
    # Add the new tipo_linea column
    op.add_column('lineas_credito', sa.Column('tipo_linea', sa.String(50), nullable=False, default='LINEA_CREDITO'))
    
    # Update existing records to have the default value based on es_revolvente
    op.execute("""
        UPDATE lineas_credito 
        SET tipo_linea = CASE 
            WHEN es_revolvente = true THEN 'LINEA_CREDITO'
            ELSE 'TERMINO_FIJO'
        END
    """)


def downgrade():
    # Remove the tipo_linea column
    op.drop_column('lineas_credito', 'tipo_linea') 