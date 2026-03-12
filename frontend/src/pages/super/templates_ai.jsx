import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  LayoutTemplate,
  Search,
  LayoutGrid,
  List,
  Pencil,
  Copy,
  Archive,
  Eye,
  X,
  FileStack,
  CheckCircle2,
  FileEdit,
  ArchiveRestore,
} from "lucide-react";
import "../../components/variables.css";
import SuperNav from "../../components/SuperNav";
import "./templates_ai.css";

// ---------------------------------------------------------------------------
// Mock data (ready for API replacement)
// ---------------------------------------------------------------------------

const MOCK_TEMPLATES = [
  {
    id: "1",
    name: "University Transcript",
    documentType: "Transcript",
    language: "en",
    status: "active",
    version: "1.2.0",
    fieldsCount: 12,
    usageCount: 1247,
    createdDate: "2025-01-15",
    lastUpdated: "2025-03-01",
    description: "Extract student transcript data: university name, student name, faculty, grades, and credits.",
    fieldsPreview: ["university_name", "student_name", "faculty", "campus", "gpa", "credits_earned"],
    promptSummary: "Extract structured transcript fields from OCR text. Return JSON with keys matching field names.",
    jsonPreview: { university_name: "", student_name: "", faculty: "", campus: "" },
    versionHistory: [{ version: "1.2.0", date: "2025-03-01" }, { version: "1.1.0", date: "2025-02-10" }],
  },
  {
    id: "2",
    name: "Invoice Header",
    documentType: "Invoice",
    language: "en",
    status: "active",
    version: "2.0.0",
    fieldsCount: 8,
    usageCount: 3420,
    createdDate: "2024-11-20",
    lastUpdated: "2025-02-28",
    description: "Extract invoice metadata: vendor, date, total, line items count.",
    fieldsPreview: ["vendor_name", "invoice_number", "invoice_date", "total_amount", "currency"],
    promptSummary: "Extract invoice header and totals. Currency and amounts as provided.",
    jsonPreview: { vendor_name: "", invoice_number: "", invoice_date: "", total_amount: "" },
    versionHistory: [{ version: "2.0.0", date: "2025-02-28" }],
  },
  {
    id: "3",
    name: "Medical Receipt",
    documentType: "Receipt",
    language: "en",
    status: "draft",
    version: "0.9.0",
    fieldsCount: 6,
    usageCount: 0,
    createdDate: "2025-02-20",
    lastUpdated: "2025-02-25",
    description: "Extract provider, patient ID, date of service, amount paid.",
    fieldsPreview: ["provider_name", "patient_id", "date_of_service", "amount_paid"],
    promptSummary: "Extract medical receipt fields. Handle optional insurance fields.",
    jsonPreview: { provider_name: "", patient_id: "", date_of_service: "", amount_paid: "" },
    versionHistory: [{ version: "0.9.0", date: "2025-02-25" }],
  },
  {
    id: "4",
    name: "Contract Parties",
    documentType: "Contract",
    language: "en",
    status: "archived",
    version: "1.0.0",
    fieldsCount: 10,
    usageCount: 89,
    createdDate: "2024-08-10",
    lastUpdated: "2024-12-01",
    description: "Legacy contract party extraction. Replaced by Contract v2.",
    fieldsPreview: ["party_a", "party_b", "effective_date", "expiry_date"],
    promptSummary: "Extract contracting parties and key dates.",
    jsonPreview: { party_a: "", party_b: "", effective_date: "" },
    versionHistory: [{ version: "1.0.0", date: "2024-12-01" }],
  },
  {
    id: "5",
    name: "Arabic Invoice",
    documentType: "Invoice",
    language: "ar",
    status: "active",
    version: "1.0.0",
    fieldsCount: 7,
    usageCount: 512,
    createdDate: "2025-01-05",
    lastUpdated: "2025-02-15",
    description: "Invoice extraction for Arabic documents.",
    fieldsPreview: ["vendor_name", "invoice_number", "total_amount"],
    promptSummary: "Extract from RTL Arabic invoice text.",
    jsonPreview: { vendor_name: "", invoice_number: "", total_amount: "" },
    versionHistory: [{ version: "1.0.0", date: "2025-02-15" }],
  },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const LANGUAGE_OPTIONS = [
  { value: "", label: "All languages" },
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
];

const SORT_OPTIONS = [
  { value: "created", label: "Created date" },
  { value: "updated", label: "Last updated" },
  { value: "usage", label: "Most used" },
  { value: "version", label: "Version" },
];

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function TemplatesAi() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterDocType, setFilterDocType] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTemplate, setDrawerTemplate] = useState(null);

  const docTypes = useMemo(() => {
    const set = new Set(MOCK_TEMPLATES.map((t) => t.documentType).filter(Boolean));
    return [{ value: "", label: "All types" }, ...Array.from(set).map((v) => ({ value: v, label: v }))];
  }, []);

  const stats = useMemo(() => {
    const total = MOCK_TEMPLATES.length;
    const active = MOCK_TEMPLATES.filter((t) => t.status === "active").length;
    const draft = MOCK_TEMPLATES.filter((t) => t.status === "draft").length;
    const archived = MOCK_TEMPLATES.filter((t) => t.status === "archived").length;
    return { total, active, draft, archived };
  }, []);

  const filteredAndSortedTemplates = useMemo(() => {
    let list = [...MOCK_TEMPLATES];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    if (filterLanguage) list = list.filter((t) => t.language === filterLanguage);
    if (filterDocType) list = list.filter((t) => t.documentType === filterDocType);
    if (sortBy === "created") list.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    else if (sortBy === "updated") list.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    else if (sortBy === "usage") list.sort((a, b) => b.usageCount - a.usageCount);
    else if (sortBy === "version") list.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    return list;
  }, [search, filterStatus, filterLanguage, filterDocType, sortBy]);

  const openDrawer = (template) => {
    setDrawerTemplate(template);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerTemplate(null);
  };

  const statCards = [
    { label: "Total Templates", value: stats.total, desc: "All templates", icon: FileStack, color: "ocean" },
    { label: "Active Templates", value: stats.active, desc: "In use for extraction", icon: CheckCircle2, color: "green" },
    { label: "Draft Templates", value: stats.draft, desc: "Not yet published", icon: FileEdit, color: "amber" },
    { label: "Archived Templates", value: stats.archived, desc: "No longer active", icon: ArchiveRestore, color: "gray" },
  ];

  return (
    <div className="super-templates-ai">
      <SuperNav
        userName="Super Admin"
        userEmail="admin@autodoc.ai"
        onLogout={() => {}}
        onSettings={() => {}}
      />
      <main className="super-templates-ai-main">
        <div className="super-templates-ai-container">
          <header className="super-templates-ai-header">
            <div className="super-templates-ai-header-top">
              <div>
                <div className="super-templates-ai-header-icon">
                  <FileText size={32} strokeWidth={1.5} />
                </div>
                <h1 className="super-templates-ai-title">Templates overview</h1>
                <p className="super-templates-ai-subtitle">
                  Manage extraction templates. Use OCR + LLM; data stored in PostgreSQL.
                </p>
              </div>
              <Link to="/super/templates-ai/builder" className="tpl-overview-btn-primary">
                <LayoutTemplate size={20} />
                New template
              </Link>
            </div>
          </header>

          {/* 1) Stat cards */}
          <section className="tpl-overview-stats">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="tpl-overview-stat-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <span className={`tpl-overview-stat-icon tpl-overview-stat-icon--${stat.color}`}>
                  <stat.icon size={24} strokeWidth={1.5} />
                </span>
                <span className="tpl-overview-stat-value">{stat.value}</span>
                <span className="tpl-overview-stat-label">{stat.label}</span>
                <span className="tpl-overview-stat-desc">{stat.desc}</span>
              </motion.div>
            ))}
          </section>

          {/* 2) Search + Filter */}
          <section className="tpl-overview-toolbar">
            <div className="tpl-overview-search-wrap">
              <Search size={20} className="tpl-overview-search-icon" />
              <input
                type="search"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="tpl-overview-search"
                aria-label="Search templates"
              />
            </div>
            <div className="tpl-overview-filters">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="tpl-overview-select"
                aria-label="Filter by status"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="tpl-overview-select"
                aria-label="Filter by language"
              >
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
                className="tpl-overview-select"
                aria-label="Filter by document type"
              >
                {docTypes.map((o) => (
                  <option key={o.value || "all"} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="tpl-overview-select"
                aria-label="Sort by"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </section>

          {/* 3) View toggle + content */}
          <section className="tpl-overview-content">
            <div className="tpl-overview-view-toggle">
              <span className="tpl-overview-view-label">View</span>
              <div className="tpl-overview-toggle-btns" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`tpl-overview-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  title="Grid view"
                >
                  <LayoutGrid size={18} />
                  Grid
                </button>
                <button
                  type="button"
                  className={`tpl-overview-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => setViewMode("table")}
                  aria-pressed={viewMode === "table"}
                  title="Table view"
                >
                  <List size={18} />
                  Table
                </button>
              </div>
            </div>

            {viewMode === "grid" && (
              <div className="tpl-overview-grid">
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedTemplates.map((tpl, i) => (
                    <motion.article
                      key={tpl.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="tpl-overview-card"
                      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(10, 22, 40, 0.12)", borderColor: "var(--color-ocean)" }}
                    >
                      <div className="tpl-overview-card-header">
                        <h3 className="tpl-overview-card-name">{tpl.name}</h3>
                        <span className={`tpl-overview-badge tpl-overview-badge--${tpl.status}`}>
                          {tpl.status}
                        </span>
                      </div>
                      <div className="tpl-overview-card-meta">
                        <span>{tpl.documentType || "—"}</span>
                        <span>{tpl.language || "—"}</span>
                        <span>v{tpl.version}</span>
                      </div>
                      <div className="tpl-overview-card-stats">
                        <span>{tpl.fieldsCount} fields</span>
                        <span>{tpl.usageCount.toLocaleString()} uses</span>
                      </div>
                      <div className="tpl-overview-card-dates">
                        <span>Created {formatDate(tpl.createdDate)}</span>
                        <span>Updated {formatDate(tpl.lastUpdated)}</span>
                      </div>
                      <div className="tpl-overview-card-actions">
                        <Link to={`/super/templates-ai/builder?edit=${tpl.id}`} className="tpl-overview-card-btn" title="Edit">
                          <Pencil size={16} />
                        </Link>
                        <button type="button" className="tpl-overview-card-btn" title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <button type="button" className="tpl-overview-card-btn" title="Archive">
                          <Archive size={16} />
                        </button>
                        <button
                          type="button"
                          className="tpl-overview-card-btn tpl-overview-card-btn--primary"
                          title="View details"
                          onClick={() => openDrawer(tpl)}
                        >
                          <Eye size={16} />
                          View details
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {viewMode === "table" && (
              <div className="tpl-overview-table-wrap">
                <table className="tpl-overview-table">
                  <thead>
                    <tr>
                      <th>Template name</th>
                      <th>Status</th>
                      <th>Document type</th>
                      <th>Language</th>
                      <th>Version</th>
                      <th>Fields</th>
                      <th>Usage</th>
                      <th>Last updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedTemplates.map((tpl) => (
                      <tr key={tpl.id}>
                        <td>
                          <button type="button" className="tpl-overview-table-name" onClick={() => openDrawer(tpl)}>
                            {tpl.name}
                          </button>
                        </td>
                        <td>
                          <span className={`tpl-overview-badge tpl-overview-badge--${tpl.status}`}>
                            {tpl.status}
                          </span>
                        </td>
                        <td>{tpl.documentType}</td>
                        <td>{tpl.language}</td>
                        <td>v{tpl.version}</td>
                        <td>{tpl.fieldsCount}</td>
                        <td>{tpl.usageCount.toLocaleString()}</td>
                        <td>{formatDate(tpl.lastUpdated)}</td>
                        <td>
                          <div className="tpl-overview-table-actions">
                            <Link to={`/super/templates-ai/builder?edit=${tpl.id}`} className="tpl-overview-card-btn" title="Edit">
                              <Pencil size={14} />
                            </Link>
                            <button type="button" className="tpl-overview-card-btn" title="Duplicate">
                              <Copy size={14} />
                            </button>
                            <button type="button" className="tpl-overview-card-btn" title="Archive">
                              <Archive size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredAndSortedTemplates.length === 0 && (
              <div className="tpl-overview-empty">
                <FileText size={48} />
                <p>No templates match your filters.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 4) Details drawer */}
      <AnimatePresence>
        {drawerOpen && drawerTemplate && (
          <>
            <motion.div
              className="tpl-overview-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              aria-hidden
            />
            <motion.aside
              className="tpl-overview-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="tpl-overview-drawer-header">
                <h2 className="tpl-overview-drawer-title">{drawerTemplate.name}</h2>
                <button type="button" className="tpl-overview-drawer-close" onClick={closeDrawer} aria-label="Close">
                  <X size={24} />
                </button>
              </div>
              <div className="tpl-overview-drawer-body">
                <div className="tpl-overview-drawer-section">
                  <h4>Description</h4>
                  <p>{drawerTemplate.description || "—"}</p>
                </div>
                <div className="tpl-overview-drawer-section">
                  <h4>Field list preview</h4>
                  <ul className="tpl-overview-drawer-list">
                    {(drawerTemplate.fieldsPreview || []).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="tpl-overview-drawer-section">
                  <h4>Prompt summary</h4>
                  <p className="tpl-overview-drawer-mono">{drawerTemplate.promptSummary || "—"}</p>
                </div>
                <div className="tpl-overview-drawer-section">
                  <h4>JSON structure preview</h4>
                  <pre className="tpl-overview-drawer-json">
                    {JSON.stringify(drawerTemplate.jsonPreview || {}, null, 2)}
                  </pre>
                </div>
                <div className="tpl-overview-drawer-section">
                  <h4>Version history</h4>
                  <ul className="tpl-overview-drawer-list">
                    {(drawerTemplate.versionHistory || []).map((v, i) => (
                      <li key={i}>v{v.version} — {formatDate(v.date)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TemplatesAi;
