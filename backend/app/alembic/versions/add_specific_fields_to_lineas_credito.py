"""Add specific fields to lineas_credito table

Revision ID: add_specific_fields_to_lineas_credito
Revises: latest_revision
Create Date: 2024-01-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_specific_fields_to_lineas_credito'
down_revision = None  # Will be set to the latest revision
branch_labels = None
depends_on = None


def upgrade():
    # Agregar nuevos campos específicos para diferentes tipos de líneas de crédito
    
    # Agregar campo tipo_linea si no existe
    op.add_column('lineas_credito', sa.Column('tipo_linea', sa.String(50), nullable=True, default='LINEA_CREDITO'))
    
    # Campos para préstamos con plazo fijo
    op.add_column('lineas_credito', sa.Column('plazo_meses', sa.Integer, nullable=True))
    op.add_column('lineas_credito', sa.Column('periodicidad_pago', sa.String(20), nullable=True))
    
    # Campos para leasing
    op.add_column('lineas_credito', sa.Column('valor_activo', sa.Numeric(15, 2), nullable=True))
    op.add_column('lineas_credito', sa.Column('valor_residual', sa.Numeric(15, 2), nullable=True))
    
    # Campos para factoring
    op.add_column('lineas_credito', sa.Column('porcentaje_financiamiento', sa.Numeric(5, 2), nullable=True))
    
    # Campos para garantías
    op.add_column('lineas_credito', sa.Column('garantia_tipo', sa.String(30), nullable=True))
    op.add_column('lineas_credito', sa.Column('garantia_descripcion', sa.Text, nullable=True))
    
    # Campos para sobregiro
    op.add_column('lineas_credito', sa.Column('limite_sobregiro', sa.Numeric(15, 2), nullable=True))
    
    # Campos generales adicionales
    op.add_column('lineas_credito', sa.Column('moneda', sa.String(3), nullable=True, default='USD'))
    op.add_column('lineas_credito', sa.Column('beneficiario', sa.String(255), nullable=True))
    op.add_column('lineas_credito', sa.Column('banco_emisor', sa.String(255), nullable=True))
    op.add_column('lineas_credito', sa.Column('documento_respaldo', sa.String(255), nullable=True))
    
    # Actualizar registros existentes con valores por defecto
    op.execute("UPDATE lineas_credito SET tipo_linea = 'LINEA_CREDITO' WHERE tipo_linea IS NULL")
    op.execute("UPDATE lineas_credito SET moneda = 'USD' WHERE moneda IS NULL")
    op.execute("UPDATE lineas_credito SET garantia_tipo = 'NINGUNA' WHERE garantia_tipo IS NULL")
    op.execute("UPDATE lineas_credito SET periodicidad_pago = 'MENSUAL' WHERE periodicidad_pago IS NULL AND plazo_meses IS NOT NULL")
    
    # Crear índices para campos que se consultarán frecuentemente
    op.create_index('idx_lineas_credito_tipo_linea', 'lineas_credito', ['tipo_linea'])
    op.create_index('idx_lineas_credito_moneda', 'lineas_credito', ['moneda'])
    op.create_index('idx_lineas_credito_garantia_tipo', 'lineas_credito', ['garantia_tipo'])


def downgrade():
    # Eliminar índices
    op.drop_index('idx_lineas_credito_garantia_tipo', table_name='lineas_credito')
    op.drop_index('idx_lineas_credito_moneda', table_name='lineas_credito')
    op.drop_index('idx_lineas_credito_tipo_linea', table_name='lineas_credito')
    
    # Eliminar columnas agregadas
    op.drop_column('lineas_credito', 'documento_respaldo')
    op.drop_column('lineas_credito', 'banco_emisor')
    op.drop_column('lineas_credito', 'beneficiario')
    op.drop_column('lineas_credito', 'moneda')
    op.drop_column('lineas_credito', 'limite_sobregiro')
    op.drop_column('lineas_credito', 'garantia_descripcion')
    op.drop_column('lineas_credito', 'garantia_tipo')
    op.drop_column('lineas_credito', 'porcentaje_financiamiento')
    op.drop_column('lineas_credito', 'valor_residual')
    op.drop_column('lineas_credito', 'valor_activo')
    op.drop_column('lineas_credito', 'periodicidad_pago')
    op.drop_column('lineas_credito', 'plazo_meses')
    op.drop_column('lineas_credito', 'tipo_linea') 