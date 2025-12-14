"""No-op migration placeholder: HR UUID fixes are not applied.

This project has removed the HR module. To avoid altering types on
databases that do not have these tables we keep a no-op revision.
"""

from alembic import op

revision = '20241211_fix_hr_uuid'
down_revision = '20241211_accounting_rules'
branch_labels = None
depends_on = None


def upgrade():
    # intentionally left blank
    pass


def downgrade():
    # intentionally left blank
    pass