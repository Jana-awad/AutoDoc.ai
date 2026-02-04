# backend/app/models/__init__.py
# Import models in an order that reduces circular-import risk.
# Use only module imports (no logic) so metadata is populated.

from app.models.client import Client
from app.models.user import User
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.payment import Payment
from app.models.template import Template
from app.models.field import Field
from app.models.document import Document
from app.models.extraction import Extraction
from app.models.api_log import ApiLog
