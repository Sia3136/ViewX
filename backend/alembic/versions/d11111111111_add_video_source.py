"""add video source

Revision ID: d11111111111
Revises: c612a97c8ef9
Create Date: 2026-08-22 04:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd11111111111'
down_revision = 'c612a97c8ef9'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Create video_sources table
    video_sources_table = op.create_table('video_sources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default="STOPPED"),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_video_sources_id'), 'video_sources', ['id'], unique=False)

    # 2. Add nullable source_id column to events
    op.add_column('events', sa.Column('source_id', sa.Integer(), nullable=True))
    
    # 3. Insert default legacy video source
    op.bulk_insert(video_sources_table, [
        {
            'id': 1, 
            'name': 'Legacy Camera', 
            'type': 'FILE', 
            'location': 'legacy', 
            'status': 'STOPPED'
        }
    ])

    # 4. Update existing events to point to legacy source
    op.execute("UPDATE events SET source_id = 1 WHERE source_id IS NULL")

    # 5. Make source_id non-nullable
    op.alter_column('events', 'source_id', existing_type=sa.Integer(), nullable=False)

    # 6. Add foreign key constraint and index
    op.create_index(op.f('ix_events_source_id'), 'events', ['source_id'], unique=False)
    op.create_foreign_key(None, 'events', 'video_sources', ['source_id'], ['id'])


def downgrade():
    op.drop_constraint(None, 'events', type_='foreignkey')
    op.drop_index(op.f('ix_events_source_id'), table_name='events')
    op.drop_column('events', 'source_id')
    op.drop_index(op.f('ix_video_sources_id'), table_name='video_sources')
    op.drop_table('video_sources')
