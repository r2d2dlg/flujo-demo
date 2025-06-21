"""Create construction quotation system tables

Revision ID: create_construction_quotation
Revises: create_project_credit_lines
Create Date: 2025-01-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_construction_quotation'
down_revision = 'd4e3b2a1c567'
branch_labels = None
depends_on = None


def upgrade():
    # Create construction_projects table
    op.create_table('construction_projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_name', sa.String(length=255), nullable=False),
        sa.Column('client_name', sa.String(length=255), nullable=False),
        sa.Column('client_contact', sa.String(length=255), nullable=True),
        sa.Column('client_email', sa.String(length=255), nullable=True),
        sa.Column('client_phone', sa.String(length=50), nullable=True),
        sa.Column('project_type', sa.String(length=100), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('site_address', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scope_of_work', sa.Text(), nullable=True),
        sa.Column('special_requirements', sa.Text(), nullable=True),
        sa.Column('bid_deadline', sa.DateTime(), nullable=True),
        sa.Column('project_start_date', sa.Date(), nullable=True),
        sa.Column('project_duration_days', sa.Integer(), nullable=True),
        sa.Column('total_area_m2', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('total_floors', sa.Integer(), nullable=True),
        sa.Column('total_units', sa.Integer(), nullable=True),
        sa.Column('location_cost_factor', sa.Numeric(precision=5, scale=4), nullable=False, default=1.0000),
        sa.Column('complexity_factor', sa.Numeric(precision=5, scale=4), nullable=False, default=1.0000),
        sa.Column('status', sa.String(length=50), nullable=False, default='BIDDING'),
        sa.Column('priority', sa.String(length=20), nullable=False, default='MEDIUM'),
        sa.Column('plans_uploaded', sa.Boolean(), nullable=False, default=False),
        sa.Column('specifications_received', sa.Boolean(), nullable=False, default=False),
        sa.Column('site_visit_completed', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_construction_projects_id'), 'construction_projects', ['id'], unique=False)
    op.create_index(op.f('ix_construction_projects_project_name'), 'construction_projects', ['project_name'], unique=False)

    # Create cost_items table
    op.create_table('cost_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('item_type', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('subcategory', sa.String(length=100), nullable=True),
        sa.Column('unit_of_measure', sa.String(length=20), nullable=False),
        sa.Column('base_cost', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False, default='USD'),
        sa.Column('waste_factor', sa.Numeric(precision=5, scale=4), nullable=False, default=0.0500),
        sa.Column('labor_factor', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('preferred_supplier', sa.String(length=255), nullable=True),
        sa.Column('supplier_contact', sa.String(length=255), nullable=True),
        sa.Column('last_price_update', sa.DateTime(), nullable=True),
        sa.Column('panama_city_factor', sa.Numeric(precision=5, scale=4), nullable=False, default=1.0000),
        sa.Column('colon_factor', sa.Numeric(precision=5, scale=4), nullable=False, default=0.9500),
        sa.Column('chiriqui_factor', sa.Numeric(precision=5, scale=4), nullable=False, default=0.9000),
        sa.Column('interior_factor', sa.Numeric(precision=5, scale=4), nullable=False, default=0.8500),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_custom', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('item_code')
    )
    op.create_index(op.f('ix_cost_items_id'), 'cost_items', ['id'], unique=False)

    # Create construction_assemblies table
    op.create_table('construction_assemblies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assembly_code', sa.String(length=50), nullable=False),
        sa.Column('assembly_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('assembly_type', sa.String(length=100), nullable=False),
        sa.Column('system_category', sa.String(length=100), nullable=False),
        sa.Column('unit_of_measure', sa.String(length=20), nullable=False),
        sa.Column('parameters_schema', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('default_parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=False, default=0),
        sa.Column('last_used', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_parametric', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_custom', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assembly_code')
    )
    op.create_index(op.f('ix_construction_assemblies_id'), 'construction_assemblies', ['id'], unique=False)

    # Create assembly_components table
    op.create_table('assembly_components',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assembly_id', sa.Integer(), nullable=False),
        sa.Column('cost_item_id', sa.Integer(), nullable=False),
        sa.Column('quantity_formula', sa.String(length=500), nullable=False),
        sa.Column('base_quantity', sa.Numeric(precision=15, scale=4), nullable=True),
        sa.Column('waste_factor_override', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('productivity_factor', sa.Numeric(precision=5, scale=4), nullable=False, default=1.0000),
        sa.Column('parameter_dependencies', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_optional', sa.Boolean(), nullable=False, default=False),
        sa.Column('sequence_order', sa.Integer(), nullable=False, default=1),
        sa.ForeignKeyConstraint(['assembly_id'], ['construction_assemblies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['cost_item_id'], ['cost_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assembly_components_id'), 'assembly_components', ['id'], unique=False)

    # Create construction_quotes table
    op.create_table('construction_quotes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('construction_project_id', sa.Integer(), nullable=False),
        sa.Column('quote_number', sa.String(length=50), nullable=False),
        sa.Column('quote_name', sa.String(length=255), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, default=1),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('validity_days', sa.Integer(), nullable=False, default=30),
        sa.Column('quote_date', sa.Date(), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('total_direct_costs', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('total_material_costs', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('total_labor_costs', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('total_equipment_costs', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('total_subcontract_costs', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('overhead_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=15.00),
        sa.Column('overhead_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('profit_margin_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=10.00),
        sa.Column('profit_margin_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('contingency_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=5.00),
        sa.Column('contingency_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('itbms_percentage', sa.Numeric(precision=5, scale=2), nullable=False, default=7.00),
        sa.Column('itbms_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('subtotal', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('total_quote_amount', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('payment_terms', sa.Text(), nullable=True),
        sa.Column('payment_schedule', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, default='DRAFT'),
        sa.Column('submitted_date', sa.DateTime(), nullable=True),
        sa.Column('decision_date', sa.DateTime(), nullable=True),
        sa.Column('estimated_competitors', sa.Integer(), nullable=True),
        sa.Column('market_position', sa.String(length=50), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['construction_project_id'], ['construction_projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('quote_number')
    )
    op.create_index(op.f('ix_construction_quotes_id'), 'construction_quotes', ['id'], unique=False)

    # Create quote_line_items table
    op.create_table('quote_line_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('construction_quote_id', sa.Integer(), nullable=False),
        sa.Column('line_number', sa.Integer(), nullable=False),
        sa.Column('item_description', sa.Text(), nullable=False),
        sa.Column('cost_item_id', sa.Integer(), nullable=True),
        sa.Column('assembly_id', sa.Integer(), nullable=True),
        sa.Column('quantity', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('unit_of_measure', sa.String(length=20), nullable=False),
        sa.Column('unit_cost', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('total_cost', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('material_cost', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('labor_cost', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('equipment_cost', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('subcontract_cost', sa.Numeric(precision=15, scale=2), nullable=False, default=0.00),
        sa.Column('waste_factor_applied', sa.Numeric(precision=5, scale=4), nullable=False, default=0.0000),
        sa.Column('location_factor_applied', sa.Numeric(precision=5, scale=4), nullable=False, default=1.0000),
        sa.Column('complexity_factor_applied', sa.Numeric(precision=5, scale=4), nullable=False, default=1.0000),
        sa.Column('assembly_parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('section', sa.String(length=100), nullable=True),
        sa.Column('work_category', sa.String(length=100), nullable=True),
        sa.Column('budget_code', sa.String(length=50), nullable=True),
        sa.Column('is_alternative', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_optional', sa.Boolean(), nullable=False, default=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['assembly_id'], ['construction_assemblies.id'], ),
        sa.ForeignKeyConstraint(['construction_quote_id'], ['construction_quotes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['cost_item_id'], ['cost_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quote_line_items_id'), 'quote_line_items', ['id'], unique=False)

    # Create project_takeoffs table
    op.create_table('project_takeoffs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('construction_project_id', sa.Integer(), nullable=False),
        sa.Column('takeoff_name', sa.String(length=255), nullable=False),
        sa.Column('plan_reference', sa.String(length=255), nullable=True),
        sa.Column('discipline', sa.String(length=50), nullable=True),
        sa.Column('measurement_type', sa.String(length=50), nullable=False),
        sa.Column('measured_quantity', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('unit_of_measure', sa.String(length=20), nullable=False),
        sa.Column('measurement_method', sa.String(length=50), nullable=True),
        sa.Column('scale_factor', sa.String(length=50), nullable=True),
        sa.Column('coordinates_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('area_polygon', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('verified_by', sa.String(length=100), nullable=True),
        sa.Column('verification_date', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['construction_project_id'], ['construction_projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_takeoffs_id'), 'project_takeoffs', ['id'], unique=False)

    # Create quote_templates table
    op.create_table('quote_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_name', sa.String(length=255), nullable=False),
        sa.Column('project_type', sa.String(length=100), nullable=False),
        sa.Column('template_sections', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('default_assemblies', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('default_overhead', sa.Numeric(precision=5, scale=2), nullable=False, default=15.00),
        sa.Column('default_profit', sa.Numeric(precision=5, scale=2), nullable=False, default=10.00),
        sa.Column('default_contingency', sa.Numeric(precision=5, scale=2), nullable=False, default=5.00),
        sa.Column('usage_count', sa.Integer(), nullable=False, default=0),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_system_template', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quote_templates_id'), 'quote_templates', ['id'], unique=False)


def downgrade():
    # Drop tables in reverse order of creation
    op.drop_table('quote_templates')
    op.drop_table('project_takeoffs')
    op.drop_table('quote_line_items')
    op.drop_table('construction_quotes')
    op.drop_table('assembly_components')
    op.drop_table('construction_assemblies')
    op.drop_table('cost_items')
    op.drop_table('construction_projects') 