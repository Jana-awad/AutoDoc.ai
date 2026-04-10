"""seed global CV template and fields

Revision ID: b7c8d9e0f1a2
Revises: 20260306_country_industry
Create Date: 2026-04-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "20260306_country_industry"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CV_TEMPLATE_NAME = "CV"


def upgrade() -> None:
    conn = op.get_bind()
    existing = conn.execute(
        sa.text(
            "SELECT id FROM templates WHERE name = :name "
            "AND is_global IS TRUE AND client_id IS NULL LIMIT 1"
        ),
        {"name": CV_TEMPLATE_NAME},
    ).scalar()
    if existing is not None:
        return

    desc = (
        "Curriculum vitae / résumé. Extract structured information from the candidate profile, "
        "work history, education, and skills sections."
    )
    row = conn.execute(
        sa.text(
            "INSERT INTO templates (client_id, name, description, is_global) "
            "VALUES (NULL, :name, :description, true) RETURNING id"
        ),
        {"name": CV_TEMPLATE_NAME, "description": desc},
    ).fetchone()
    template_id = row[0]

    fields: list[tuple[str, str, str, bool, str]] = [
        (
            "full_name",
            "Full name",
            "text",
            True,
            "Full legal or preferred name as shown at the top of the CV.",
        ),
        (
            "professional_title",
            "Professional title",
            "text",
            False,
            "Headline or target role, e.g. Senior Software Engineer.",
        ),
        (
            "email",
            "Email",
            "text",
            False,
            "Primary email address.",
        ),
        (
            "phone",
            "Phone",
            "text",
            False,
            "Phone number with country code if present.",
        ),
        (
            "location",
            "Location",
            "text",
            False,
            "City, region, or country; full address if given.",
        ),
        (
            "summary",
            "Professional summary",
            "text",
            False,
            "Summary, objective, or profile paragraph at the top of the CV.",
        ),
        (
            "work_experience",
            "Work experience",
            "text",
            False,
            "All employment: employer, role, dates, and main responsibilities or achievements. "
            "Preserve order and separate roles clearly.",
        ),
        (
            "education",
            "Education",
            "text",
            False,
            "Degrees, institutions, fields of study, and graduation years.",
        ),
        (
            "skills",
            "Skills",
            "text",
            False,
            "Technical tools, languages, frameworks, and notable soft skills listed on the CV.",
        ),
        (
            "languages",
            "Languages",
            "text",
            False,
            "Spoken languages and proficiency level if stated.",
        ),
        (
            "certifications",
            "Certifications",
            "text",
            False,
            "Professional certifications, licenses, and training with issuer and year if shown.",
        ),
        (
            "projects",
            "Projects",
            "text",
            False,
            "Notable projects (personal, academic, or professional) with brief descriptions.",
        ),
        (
            "linkedin_url",
            "LinkedIn URL",
            "text",
            False,
            "LinkedIn or other professional profile URL if present.",
        ),
    ]

    insert_field = sa.text(
        "INSERT INTO fields (template_id, name, label, field_type, required, description) "
        "VALUES (:template_id, :name, :label, :field_type, :required, :description)"
    )
    for name, label, field_type, required, field_desc in fields:
        conn.execute(
            insert_field,
            {
                "template_id": template_id,
                "name": name,
                "label": label,
                "field_type": field_type,
                "required": required,
                "description": field_desc,
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(
        sa.text(
            "SELECT id FROM templates WHERE name = :name "
            "AND is_global IS TRUE AND client_id IS NULL ORDER BY id DESC LIMIT 1"
        ),
        {"name": CV_TEMPLATE_NAME},
    ).fetchone()
    if row is None:
        return
    template_id = row[0]

    conn.execute(
        sa.text(
            "DELETE FROM extractions WHERE field_id IN "
            "(SELECT id FROM fields WHERE template_id = :tid)"
        ),
        {"tid": template_id},
    )
    conn.execute(
        sa.text("UPDATE documents SET template_id = NULL WHERE template_id = :tid"),
        {"tid": template_id},
    )
    conn.execute(sa.text("DELETE FROM fields WHERE template_id = :tid"), {"tid": template_id})
    conn.execute(sa.text("DELETE FROM templates WHERE id = :tid"), {"tid": template_id})
