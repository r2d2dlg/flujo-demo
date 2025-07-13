"""Re-add project_unit_id to LineaCreditoProyectoUso

Revision ID: b295b6d0c8f7
Revises: a99b3c2476b8
Create Date: 2024-08-01 13:05:45.123456

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b295b6d0c8f7'
down_revision = 'a99b3c2476b8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('linea_credito_proyecto_usos', sa.Column('project_unit_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        op.f('fk_linea_credito_proyecto_usos_project_unit_id_project_units'),
        'linea_credito_proyecto_usos', 'project_units',
        ['project_unit_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    op.drop_constraint(op.f('fk_linea_credito_proyecto_usos_project_unit_id_project_units'), 'linea_credito_proyecto_usos', type_='foreignkey')
    op.drop_column('linea_credito_proyecto_usos', 'project_unit_id')
