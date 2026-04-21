"""add analytics columns + patterns_meta

Revision ID: 0c2e8e704cd4
Revises: a533beaed1f1
Create Date: 2026-04-02 09:40:59.555862

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0c2e8e704cd4'
down_revision: Union[str, Sequence[str], None] = 'a533beaed1f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Use nullable=True so existing rows are not violated
    op.add_column('session_reports', sa.Column('total_words', sa.Integer(), nullable=True))
    op.add_column('session_reports', sa.Column('assertiveness_score', sa.Integer(), nullable=True))
    op.add_column('session_reports', sa.Column('patterns_meta', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    # Drop unused column if it exists (ignore error if already dropped)
    try:
        op.drop_column('users', 'target_language')
    except Exception:
        pass


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('users', sa.Column('target_language', sa.VARCHAR(), server_default=sa.text("'English'::character varying"), autoincrement=False, nullable=True))
    op.drop_column('session_reports', 'patterns_meta')
    op.drop_column('session_reports', 'assertiveness_score')
    op.drop_column('session_reports', 'total_words')
