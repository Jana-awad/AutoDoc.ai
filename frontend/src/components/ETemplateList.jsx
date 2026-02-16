/**
 * ETemplateList - List all templates with search, filter, sort, and table/card layout toggle.
 */
import { useState, useMemo } from "react";
import ETemplateCard from "./ETemplateCard";
import ETemplateTable from "./ETemplateTable";
import { DOCUMENT_TYPES, TEMPLATE_STATUS } from "../services/enterpriseTemplatesApi";
import "./ETemplateList.css";

function ETemplateList({
  templates,
  onEdit,
  onTrain,
  onViewApi,
  onCreate,
  loading = false,
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [sortDir, setSortDir] = useState("desc");
  const [layout, setLayout] = useState("table"); // 'table' | 'card'

  // Filter and sort templates
  const filtered = useMemo(() => {
    let list = [...(templates || [])];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.templateId?.toLowerCase().includes(q) ||
          t.documentType?.toLowerCase().includes(q)
      );
    }
    if (filterType) list = list.filter((t) => t.documentType === filterType);
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);

    list.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const cmp = aVal == null ? 1 : bVal == null ? -1 : aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [templates, search, filterType, filterStatus, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="e-template-list">
      <div className="e-template-list-toolbar">
        <div className="e-template-list-search-wrap">
          <span className="e-template-list-search-icon" aria-hidden>🔍</span>
          <input
            type="search"
            className="e-template-list-search"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="e-template-list-filters">
          <select
            className="e-template-list-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All types</option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="e-template-list-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value={TEMPLATE_STATUS.ACTIVE}>Active</option>
            <option value={TEMPLATE_STATUS.TRAINING}>Training</option>
            <option value={TEMPLATE_STATUS.DISABLED}>Disabled</option>
          </select>
        </div>
        <div className="e-template-list-layout">
          <button
            type="button"
            className={`e-template-list-layout-btn ${layout === "table" ? "e-template-list-layout-btn--active" : ""}`}
            onClick={() => setLayout("table")}
            title="Table view"
            aria-label="Table view"
          >
            ☰
          </button>
          <button
            type="button"
            className={`e-template-list-layout-btn ${layout === "card" ? "e-template-list-layout-btn--active" : ""}`}
            onClick={() => setLayout("card")}
            title="Card view"
            aria-label="Card view"
          >
            ⊞
          </button>
        </div>
        {onCreate && (
          <button type="button" className="e-template-list-create btn btn-primary" onClick={onCreate}>
            + New Template
          </button>
        )}
      </div>

      {loading ? (
        <div className="e-template-list-loading">Loading templates...</div>
      ) : filtered.length === 0 ? (
        <div className="e-template-list-empty">
          <p>No templates match your filters.</p>
          {(search || filterType || filterStatus) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch("");
                setFilterType("");
                setFilterStatus("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : layout === "table" ? (
        <ETemplateTable
          templates={filtered}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onEdit={onEdit}
          onTrain={onTrain}
          onViewApi={onViewApi}
        />
      ) : (
        <div className="e-template-list-cards">
          {filtered.map((t) => (
            <ETemplateCard
              key={t.id}
              template={t}
              onEdit={onEdit}
              onTrain={onTrain}
              onViewApi={onViewApi}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ETemplateList;
