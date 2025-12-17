"""Merge Alembic heads

Revision ID: 20251217_merge_heads_001
Revises: add_hr_advanced_001, 20251213_force_add_documents_category, 20251213_add_supplier_contact, 20251213_rebuild_documents_schema, remove_crm_fks_001, perf_indexes_001, remove_crm_001
Create Date: 2025-12-17

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20251217_merge_heads_001"
down_revision = (
    "add_hr_advanced_001",
    "20251213_force_add_documents_category",
    "20251213_add_supplier_contact",
    "20251213_rebuild_documents_schema",
    "remove_crm_fks_001",
    "perf_indexes_001",
    "remove_crm_001",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
