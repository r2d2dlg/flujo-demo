"""add start and end dates to scenario projects

Revision ID: d4e3b2a1c567
Revises: create_project_credit_lines_tables
Create Date: 2024-01-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e3b2a1c567'
down_revision = 'create_project_credit_lines_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add start_date and end_date columns to scenario_projects table
    op.add_column('scenario_projects', sa.Column('start_date', sa.Date(), nullable=True))
    op.add_column('scenario_projects', sa.Column('end_date', sa.Date(), nullable=True))


def downgrade() -> None:
    # Remove start_date and end_date columns from scenario_projects table
    op.drop_column('scenario_projects', 'end_date')
    op.drop_column('scenario_projects', 'start_date') 