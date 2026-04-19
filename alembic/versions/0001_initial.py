"""Initial Schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-04-19 20:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_initial'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('role', sa.String(), server_default='user', nullable=False),
        sa.Column('password', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('device', sa.String(), nullable=True),
        sa.Column('device_name', sa.String(), nullable=True),
        sa.Column('machine', sa.String(), nullable=True),
        sa.Column('os', sa.String(), nullable=True),
        sa.Column('memory', sa.String(), nullable=True),
        sa.Column('hostname', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('ip', sa.String(), nullable=True),
        sa.Column('ai_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('max_toasts', sa.Integer(), server_default='5', nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_private', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('last_seen', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )

    # 2. Movies Table
    op.create_table(
        'movies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tmdb_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('overview', sa.String(), nullable=True),
        sa.Column('genre_ids', sa.String(), nullable=False),
        sa.Column('vote_average', sa.String(), nullable=True),
        sa.Column('poster_url', sa.String(), nullable=True),
        sa.Column('release_date', sa.String(), nullable=True),
        sa.Column('status', sa.String(), server_default='Not yet', nullable=False),
        sa.Column('is_favorite', sa.Boolean(), server_default='false', nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'tmdb_id', name='uq_user_tmdb_movie')
    )
    op.create_index(op.f('ix_movies_tmdb_id'), 'movies', ['tmdb_id'], unique=False)
    op.create_index(op.f('ix_movies_user_id'), 'movies', ['user_id'], unique=False)

    # 3. WatchedMovies Table
    op.create_table(
        'watched_movies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('movie_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('watched_at', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['movie_id'], ['movies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'movie_id', name='uq_user_watched_movie')
    )
    op.create_index(op.f('ix_watched_movies_movie_id'), 'watched_movies', ['movie_id'], unique=False)
    op.create_index(op.f('ix_watched_movies_user_id'), 'watched_movies', ['user_id'], unique=False)

    # 4. Messages Table
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('receiver_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['receiver_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_receiver_id'), 'messages', ['receiver_id'], unique=False)
    op.create_index(op.f('ix_messages_sender_id'), 'messages', ['sender_id'], unique=False)

    # 5. SimilarityMatches Table
    op.create_table(
        'similarity_matches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('reasons', sa.String(), nullable=False),
        sa.Column('last_updated', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['target_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'target_id', name='uq_user_similarity_pair')
    )
    op.create_index(op.f('ix_similarity_matches_target_id'), 'similarity_matches', ['target_id'], unique=False)
    op.create_index(op.f('ix_similarity_matches_user_id'), 'similarity_matches', ['user_id'], unique=False)

def downgrade() -> None:
    op.drop_table('similarity_matches')
    op.drop_table('messages')
    op.drop_table('watched_movies')
    op.drop_table('movies')
    op.drop_table('users')
