"""Add payment distribution config to ScenarioProject

Revision ID: a99b3c2476b8
Revises: b19ad19a4779
Create Date: 2024-07-31 16:30:13.432692

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a99b3c2476b8'
down_revision = 'b19ad19a4779'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('scenario_projects', sa.Column('payment_distribution_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade():
    op.drop_column('scenario_projects', 'payment_distribution_config')
