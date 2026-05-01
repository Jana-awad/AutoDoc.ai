import { Link, useLocation } from "react-router-dom";
import "./SuperBreadcrumbs.css";

const EXACT = {
  "/enterprise": "Dashboard",
  "/enterprise/templates-ai": "Templates overview",
  "/enterprise/templates-ai/builder": "Template builder",
  "/enterprise/documents": "Documents",
  "/enterprise/api": "API",
  "/enterprise/profile": "Profile",
};

function titleCase(s) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EnterpriseBreadcrumbs() {
  const { pathname } = useLocation();
  if (!pathname.startsWith("/enterprise")) return null;

  const exact = EXACT[pathname];
  if (exact) {
    return (
      <nav className="super-breadcrumbs" aria-label="Breadcrumb">
        <ol className="super-breadcrumbs__list">
          <li className="super-breadcrumbs__item">
            <Link className="super-breadcrumbs__link" to="/enterprise">
              Enterprise
            </Link>
            <span className="super-breadcrumbs__sep" aria-hidden>
              {" "}
              /{" "}
            </span>
            <span className="super-breadcrumbs__current" aria-current="page">
              {exact}
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  const segs = pathname.split("/").filter(Boolean);
  const items = [{ href: "/enterprise", label: "Enterprise", last: segs.length === 1 }];
  for (let i = 1; i < segs.length; i += 1) {
    const full = `/${segs.slice(0, i + 1).join("/")}`;
    const label = titleCase(segs[i]);
    items.push({ href: full, label, last: i === segs.length - 1 });
  }

  return (
    <nav className="super-breadcrumbs" aria-label="Breadcrumb">
      <ol className="super-breadcrumbs__list">
        {items.map((c, idx) => (
          <li key={c.href} className="super-breadcrumbs__item">
            {idx > 0 ? <span className="super-breadcrumbs__sep"> / </span> : null}
            {c.last ? (
              <span className="super-breadcrumbs__current" aria-current="page">
                {c.label}
              </span>
            ) : (
              <Link className="super-breadcrumbs__link" to={c.href}>
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

