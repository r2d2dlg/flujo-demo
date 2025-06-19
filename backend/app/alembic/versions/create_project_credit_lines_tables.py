"""create project credit lines tables

Revision ID: create_project_credit_lines
Revises: add_specific_fields_to_lineas_credito
Create Date: 2025-06-19 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_project_credit_lines'
down_revision = 'add_specific_fields_to_lineas_credito'
branch_labels = None
depends_on = None


def upgrade():
    # Create lineas_credito_proyecto table
    op.create_table('lineas_credito_proyecto',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('scenario_project_id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=255), nullable=False),
        sa.Column('fecha_inicio', sa.Date(), nullable=False),
        sa.Column('monto_total_linea', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('monto_disponible', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('fecha_fin', sa.Date(), nullable=False),
        sa.Column('interest_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('tipo_linea', sa.String(length=50), nullable=False),
        sa.Column('cargos_apertura', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('plazo_meses', sa.Integer(), nullable=True),
        sa.Column('periodicidad_pago', sa.String(length=20), nullable=True),
        sa.Column('valor_activo', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('valor_residual', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('porcentaje_financiamiento', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('garantia_tipo', sa.String(length=100), nullable=True),
        sa.Column('garantia_descripcion', sa.Text(), nullable=True),
        sa.Column('limite_sobregiro', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('moneda', sa.String(length=10), nullable=False),
        sa.Column('beneficiario', sa.String(length=255), nullable=True),
        sa.Column('banco_emisor', sa.String(length=255), nullable=True),
        sa.Column('documento_respaldo', sa.String(length=255), nullable=True),
        sa.Column('estado', sa.String(length=20), nullable=False),
        sa.Column('es_simulacion', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['scenario_project_id'], ['scenario_projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lineas_credito_proyecto_id'), 'lineas_credito_proyecto', ['id'], unique=False)

    # Create linea_credito_proyecto_usos table
    op.create_table('linea_credito_proyecto_usos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('linea_credito_proyecto_id', sa.Integer(), nullable=False),
        sa.Column('fecha_uso', sa.Date(), nullable=False),
        sa.Column('monto_usado', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('tipo_transaccion', sa.String(length=50), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('cargo_transaccion', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('scenario_cost_item_id', sa.Integer(), nullable=True),
        sa.Column('es_simulacion', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['linea_credito_proyecto_id'], ['lineas_credito_proyecto.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scenario_cost_item_id'], ['scenario_cost_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_linea_credito_proyecto_usos_id'), 'linea_credito_proyecto_usos', ['id'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_linea_credito_proyecto_usos_id'), table_name='linea_credito_proyecto_usos')
    op.drop_table('linea_credito_proyecto_usos')
    op.drop_index(op.f('ix_lineas_credito_proyecto_id'), table_name='lineas_credito_proyecto')
    op.drop_table('lineas_credito_proyecto') 