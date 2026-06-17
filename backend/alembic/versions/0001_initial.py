"""initial schema: users + calculations (+ admin seed)

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-17

"""
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from passlib.context import CryptContext
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Senha padrão do admin — TROQUE após o primeiro login.
_ADMIN_USERNAME = "admin"
_ADMIN_PASSWORD = "master123"


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="comum"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "calculations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(length=80), nullable=False),
        sa.Column("canal", sa.String(length=20), nullable=False),
        sa.Column("inputs", postgresql.JSONB(), nullable=False),
        sa.Column("resultado", postgresql.JSONB(), nullable=False),
        sa.Column("link", sa.Text(), nullable=True),
        sa.Column("foto_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_calculations_user_id", "calculations", ["user_id"])

    # Seed do usuário admin (master)
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    users_table = sa.table(
        "users",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("username", sa.String),
        sa.column("password_hash", sa.String),
        sa.column("role", sa.String),
    )
    op.bulk_insert(
        users_table,
        [{
            "id": uuid.uuid4(),
            "username": _ADMIN_USERNAME,
            "password_hash": pwd.hash(_ADMIN_PASSWORD),
            "role": "master",
        }],
    )


def downgrade() -> None:
    op.drop_index("ix_calculations_user_id", table_name="calculations")
    op.drop_table("calculations")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
