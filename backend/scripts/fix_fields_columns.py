"""
One-shot schema repair: add missing columns on `fields` that the ORM model expects
but the live database is missing. Safe to re-run (checks information_schema first).
"""
from __future__ import annotations

from sqlalchemy import text

from app.db.session import engine


def main() -> int:
    with engine.begin() as conn:
        rows = conn.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'fields'
                """
            )
        ).fetchall()
        cols = {r[0] for r in rows}
        print("Existing fields columns:", sorted(cols))

        if "label" not in cols:
            conn.execute(text("ALTER TABLE fields ADD COLUMN label VARCHAR(255)"))
            print("Added column: fields.label")
        else:
            print("Column fields.label already exists")

        if "description" not in cols:
            conn.execute(text("ALTER TABLE fields ADD COLUMN description TEXT"))
            print("Added column: fields.description")
        else:
            print("Column fields.description already exists")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
