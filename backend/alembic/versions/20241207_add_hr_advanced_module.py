"""NO-OP migration placeholder for removed HR module.

This revision used to create HR tables. The HR module has been removed
from the codebase; to avoid creating those tables on new deployments we
replace it with a no-op revision.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = 'add_hr_advanced_001'
down_revision = 'add_quotes_opportunity'
branch_labels = None
depends_on = None


def upgrade():
    # No operation — HR module intentionally removed.
    return


def downgrade():
    # No operation
    return
