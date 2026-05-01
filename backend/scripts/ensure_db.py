"""Create database autodoc if it does not exist (local dev)."""
import sys
from pathlib import Path

# Run from repo: python scripts/ensure_db.py with cwd = backend/
_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from app.core.config import settings

# Parse host/db/user/password from SQLAlchemy URL without extra deps
from sqlalchemy.engine.url import make_url

url = make_url(settings.DATABASE_URL.replace("postgresql+psycopg2", "postgresql"))
user = url.username or "postgres"
password = url.password or ""
host = url.host or "localhost"
port = url.port or 5432
dbname = url.database or "autodoc"

conn = psycopg2.connect(
    host=host, port=port, user=user, password=password, dbname="postgres"
)
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()
cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,))
if cur.fetchone():
    print(f"DB {dbname!r}: already exists", file=sys.stderr)
else:
    cur.execute(f'CREATE DATABASE "{dbname}"')
    print(f"DB {dbname!r}: created", file=sys.stderr)
cur.close()
conn.close()
