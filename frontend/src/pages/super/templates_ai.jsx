import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArchiveRestore,
  CheckCircle2,
  Copy,
  Eye,
  FileEdit,
  FileStack,
  FileText,
  LayoutGrid,
  LayoutTemplate,
  List,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import "../../components/variables.css";
import SuperNav from "../../components/SuperNav";
import { useAuth } from "../../context/AuthContext";
import {
  buildTemplatePayload,
  builderResponseToFormState,
  createTemplateFromBuilder,
  deleteTemplate,
  fetchTemplateFull,
  fetchTemplates,
  uploadTemplateFile,
} from "../../services/templatesApi";
import "./templates_ai.css";

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
  { value: "de", label: "German" },
];

const SORT_OPTIONS = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Created date" },
  { value: "name", label: "Name (A→Z)" },
  { value: "fields", label: "Most fields" },
];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function statusBadge(status) {
  const normalized = (status || "active").toLowerCase();
  return ["active", "draft", "archived"].includes(normalized) ? normalized : "active";
}

function TemplatesAi() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterDocType, setFilterDocType] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [viewMode, setViewMode] = useState("grid");
  const [drawerTemplate, setDrawerTemplate] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [importInputKey, setImportInputKey] = useState(0);

  const importInputRef = useRef(null);

  const reload = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await fetchTemplates({ token });
        setTemplates(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const docTypes = useMemo(() => {
    const set = new Set(
      templates.map((t) => t.document_type).filter((v) => typeof v === "string" && v.trim())
    );
    return [
      { value: "", label: "All types" },
      ...Array.from(set).map((v) => ({ value: v, label: v })),
    ];
  }, [templates]);

  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((t) => statusBadge(t.status) === "active").length;
    const draft = templates.filter((t) => statusBadge(t.status) === "draft").length;
    const archived = templates.filter((t) => statusBadge(t.status) === "archived").length;
    return { total, active, draft, archived };
  }, [templates]);

  const filteredAndSortedTemplates = useMemo(() => {
    let list = [...templates];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.template_key || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter((t) => statusBadge(t.status) === filterStatus);
    if (filterLanguage) list = list.filter((t) => (t.language || "") === filterLanguage);
    if (filterDocType) list = list.filter((t) => (t.document_type || "") === filterDocType);

    if (sortBy === "created") {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortBy === "updated") {
      list.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "fields") {
      list.sort((a, b) => (b.fields_count || 0) - (a.fields_count || 0));
    }
    return list;
  }, [templates, search, filterStatus, filterLanguage, filterDocType, sortBy]);

  const openDrawer = useCallback(
    async (tpl) => {
      setDrawerTemplate({ ...tpl });
      setDrawerLoading(true);
      try {
        const data = await fetchTemplateFull(tpl.id, { token });
        setDrawerTemplate({ summary: tpl, full: data });
      } catch (err) {
        setError(`Failed to load template details: ${err.message}`);
        setDrawerTemplate(null);
      } finally {
        setDrawerLoading(false);
      }
    },
    [token]
  );

  const closeDrawer = useCallback(() => {
    setDrawerTemplate(null);
    setDrawerLoading(false);
  }, []);

  const handleDelete = useCallback(
    async (tpl) => {
      if (!window.confirm(`Delete "${tpl.name}"? This cannot be undone.`)) return;
      setBusyId(tpl.id);
      try {
        await deleteTemplate(tpl.id, { token });
        await reload({ silent: true });
        if (drawerTemplate?.full?.id === tpl.id) {
          closeDrawer();
        }
      } catch (err) {
        setError(`Failed to delete: ${err.message}`);
      } finally {
        setBusyId(null);
      }
    },
    [closeDrawer, drawerTemplate, reload, token]
  );

  const handleDuplicate = useCallback(
    async (tpl) => {
      setBusyId(tpl.id);
      try {
        const full = await fetchTemplateFull(tpl.id, { token });
        const formState = builderResponseToFormState(full);
        formState.id = null;
        formState.template_key = "";  // backend will pick a unique key
        formState.name = `${formState.name} (copy)`;
        const payload = buildTemplatePayload(formState);
        const created = await createTemplateFromBuilder(payload, { token });
        await reload({ silent: true });
        navigate(`/super/templates-ai/builder?edit=${created.id}`);
      } catch (err) {
        setError(`Failed to duplicate: ${err.message}`);
      } finally {
        setBusyId(null);
      }
    },
    [navigate, reload, token]
  );

  const handleImportClick = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleImportChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      setError(null);
      try {
        const created = await uploadTemplateFile(file, { token });
        await reload({ silent: true });
        navigate(`/super/templates-ai/builder?edit=${created.id}`);
      } catch (err) {
        setError(`Import failed: ${err.message}`);
      } finally {
        setImporting(false);
        setImportInputKey((k) => k + 1);  // reset the input so the same file can be reselected
      }
    },
    [navigate, reload, token]
  );

  const statCards = [
    {
      label: "Total Templates",
      value: stats.total,
      desc: "All templates in DB",
      icon: FileStack,
      color: "ocean",
    },
    {
      label: "Active",
      value: stats.active,
      desc: "Ready for extraction",
      icon: CheckCircle2,
      color: "green",
    },
    {
      label: "Drafts",
      value: stats.draft,
      desc: "In progress",
      icon: FileEdit,
      color: "amber",
    },
    {
      label: "Archived",
      value: stats.archived,
      desc: "No longer active",
      icon: ArchiveRestore,
      color: "gray",
    },
  ];

  return (
    <div className="super-templates-ai">
      <SuperNav
        userName="Super Admin"
        userEmail="admin@autodoc.ai"
        onLogout={() => {}}
        onSettings={() => {}}
        onSearch={() => {}}
      />
      <main id="main-content" className="super-templates-ai-main" role="main">
        <div className="super-templates-ai-container">
          <header className="super-templates-ai-header">
            <div className="super-templates-ai-header-top">
              <div>
                <div className="super-templates-ai-header-icon">
                  <FileText size={32} strokeWidth={1.5} />
                </div>
                <h1 className="super-templates-ai-title">Templates overview</h1>
                <p className="super-templates-ai-subtitle">
                  Real templates from PostgreSQL. Create, edit, duplicate, import, and delete —
                  no seeds required.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <input
                  key={importInputKey}
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportChange}
                  hidden
                />
                <button
                  type="button"
                  className="tpl-overview-btn-secondary"
                  onClick={handleImportClick}
                  disabled={importing}
                >
                  {importing ? <Loader2 size={18} className="tpl-spin" /> : <Upload size={18} />}
                  {importing ? "Importing…" : "Import JSON"}
                </button>
                <Link to="/super/templates-ai/builder" className="tpl-overview-btn-primary">
                  <LayoutTemplate size={20} />
                  New template
                </Link>
              </div>
            </div>
          </header>

          {error && (
            <div className="tpl-overview-banner tpl-overview-banner--error" role="alert">
              <AlertTriangle size={18} />
              <span style={{ flex: 1 }}>{error}</span>
              <button
                type="button"
                className="tpl-overview-banner-close"
                onClick={() => setError(null)}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

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

          <section className="tpl-overview-toolbar">
            <div className="tpl-overview-search-wrap">
              <Search size={20} className="tpl-overview-search-icon" />
              <input
                type="search"
                placeholder="Search by name, key, or description…"
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
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="tpl-overview-select"
                aria-label="Filter by language"
              >
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
                className="tpl-overview-select"
                aria-label="Filter by document type"
              >
                {docTypes.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="tpl-overview-select"
                aria-label="Sort by"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

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

            {loading && (
              <div className="tpl-overview-empty">
                <Loader2 size={32} className="tpl-spin" />
                <p>Loading templates…</p>
              </div>
            )}

            {!loading && viewMode === "grid" && (
              <div className="tpl-overview-grid">
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedTemplates.map((tpl) => (
                    <motion.article
                      key={tpl.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="tpl-overview-card"
                      whileHover={{
                        y: -4,
                        boxShadow: "0 12px 40px rgba(10, 22, 40, 0.12)",
                        borderColor: "var(--color-ocean)",
                      }}
                    >
                      <div className="tpl-overview-card-header">
                        <h3 className="tpl-overview-card-name">{tpl.name}</h3>
                        <span
                          className={`tpl-overview-badge tpl-overview-badge--${statusBadge(
                            tpl.status
                          )}`}
                        >
                          {statusBadge(tpl.status)}
                        </span>
                      </div>
                      <div className="tpl-overview-card-meta">
                        <span title="Template key">
                          {tpl.template_key ? `id: ${tpl.template_key}` : "—"}
                        </span>
                        <span>{tpl.document_type || "—"}</span>
                        <span>{tpl.language || "en"}</span>
                        <span>v{tpl.version || "1.0.0"}</span>
                      </div>
                      <div className="tpl-overview-card-stats">
                        <span>{tpl.fields_count ?? 0} fields</span>
                        <span>{tpl.is_global ? "Global" : `Client #${tpl.client_id ?? ""}`}</span>
                      </div>
                      <div className="tpl-overview-card-dates">
                        <span>Created {formatDate(tpl.created_at)}</span>
                        <span>Updated {formatDate(tpl.updated_at)}</span>
                      </div>
                      <div className="tpl-overview-card-actions">
                        <Link
                          to={`/super/templates-ai/builder?edit=${tpl.id}`}
                          className="tpl-overview-card-btn"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          type="button"
                          className="tpl-overview-card-btn"
                          title="Duplicate"
                          onClick={() => handleDuplicate(tpl)}
                          disabled={busyId === tpl.id}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          type="button"
                          className="tpl-overview-card-btn tpl-overview-card-btn--danger"
                          title="Delete"
                          onClick={() => handleDelete(tpl)}
                          disabled={busyId === tpl.id}
                        >
                          <Trash2 size={16} />
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

            {!loading && viewMode === "table" && (
              <div className="tpl-overview-table-wrap">
                <table className="tpl-overview-table">
                  <thead>
                    <tr>
                      <th>Template name</th>
                      <th>ID (key)</th>
                      <th>Status</th>
                      <th>Document type</th>
                      <th>Language</th>
                      <th>Version</th>
                      <th>Fields</th>
                      <th>Last updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedTemplates.map((tpl) => (
                      <tr key={tpl.id}>
                        <td>
                          <button
                            type="button"
                            className="tpl-overview-table-name"
                            onClick={() => openDrawer(tpl)}
                          >
                            {tpl.name}
                          </button>
                        </td>
                        <td>{tpl.template_key || "—"}</td>
                        <td>
                          <span
                            className={`tpl-overview-badge tpl-overview-badge--${statusBadge(
                              tpl.status
                            )}`}
                          >
                            {statusBadge(tpl.status)}
                          </span>
                        </td>
                        <td>{tpl.document_type || "—"}</td>
                        <td>{tpl.language || "en"}</td>
                        <td>v{tpl.version || "1.0.0"}</td>
                        <td>{tpl.fields_count ?? 0}</td>
                        <td>{formatDate(tpl.updated_at)}</td>
                        <td>
                          <div className="tpl-overview-table-actions">
                            <Link
                              to={`/super/templates-ai/builder?edit=${tpl.id}`}
                              className="tpl-overview-card-btn"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              type="button"
                              className="tpl-overview-card-btn"
                              title="Duplicate"
                              onClick={() => handleDuplicate(tpl)}
                              disabled={busyId === tpl.id}
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              type="button"
                              className="tpl-overview-card-btn tpl-overview-card-btn--danger"
                              title="Delete"
                              onClick={() => handleDelete(tpl)}
                              disabled={busyId === tpl.id}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredAndSortedTemplates.length === 0 && (
              <div className="tpl-overview-empty">
                <FileText size={48} />
                <p>
                  {templates.length === 0
                    ? "No templates yet. Create one or import a JSON file to get started."
                    : "No templates match your filters."}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <AnimatePresence>
        {drawerTemplate && (
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
                <h2 className="tpl-overview-drawer-title">
                  {drawerTemplate.full?.template?.name || drawerTemplate.summary?.name}
                </h2>
                <button
                  type="button"
                  className="tpl-overview-drawer-close"
                  onClick={closeDrawer}
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="tpl-overview-drawer-body">
                {drawerLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Loader2 size={18} className="tpl-spin" />
                    Loading details…
                  </div>
                )}
                {!drawerLoading && drawerTemplate.full && (
                  <>
                    <div className="tpl-overview-drawer-section">
                      <h4>Identification</h4>
                      <p>
                        <strong>Key:</strong>{" "}
                        {drawerTemplate.full.template.template_key || "—"}
                        <br />
                        <strong>Document type:</strong>{" "}
                        {drawerTemplate.full.template.document_type || "—"} •{" "}
                        <strong>Language:</strong>{" "}
                        {drawerTemplate.full.template.language || "en"} •{" "}
                        <strong>Version:</strong>{" "}
                        v{drawerTemplate.full.template.version || "1.0.0"}
                      </p>
                    </div>
                    <div className="tpl-overview-drawer-section">
                      <h4>Description</h4>
                      <p>{drawerTemplate.full.template.description || "—"}</p>
                    </div>
                    <div className="tpl-overview-drawer-section">
                      <h4>Fields ({drawerTemplate.full.fields.length})</h4>
                      <ul className="tpl-overview-drawer-list">
                        {drawerTemplate.full.fields.map((f) => (
                          <li key={f.id}>
                            <code>{f.name}</code>{" "}
                            <span style={{ opacity: 0.7 }}>
                              ({f.data_type}
                              {f.required ? ", required" : ""})
                            </span>
                            {f.display_label ? ` — ${f.display_label}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="tpl-overview-drawer-section">
                      <h4>System prompt</h4>
                      <p className="tpl-overview-drawer-mono">
                        {drawerTemplate.full.ai_config.system_prompt || "—"}
                      </p>
                    </div>
                    <div className="tpl-overview-drawer-section">
                      <h4>JSON output template</h4>
                      <pre className="tpl-overview-drawer-json">
                        {drawerTemplate.full.ai_config.json_output_template || "—"}
                      </pre>
                    </div>
                    <div className="tpl-overview-drawer-section">
                      <Link
                        to={`/super/templates-ai/builder?edit=${drawerTemplate.full.id}`}
                        className="tpl-overview-btn-primary"
                      >
                        <Pencil size={16} />
                        Open in builder
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TemplatesAi;
