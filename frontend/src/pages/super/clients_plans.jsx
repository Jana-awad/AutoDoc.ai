import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SuperNav from "../../components/SuperNav";
import {
  fetchClientsStats,
  fetchClients,
  fetchClientDetails,
  fetchPlans,
  createClient,
  deleteClient,
  resetClientApiKey,
  changeClientPlan,
} from "../../services/clientsPlansApi";
import ClientsPlansStatsCards from "./components/ClientsPlansStatsCards";
import ClientsPlansTable from "./components/ClientsPlansTable";
import ClientDetailsDrawer from "./components/ClientDetailsDrawer";
import AddClientModal from "./components/AddClientModal";
import "./clients_plans.css";

const PLAN_OPTIONS = [
  { value: "", label: "All Plans" },
  { value: "Business", label: "Business" },
  { value: "Enterprise", label: "Enterprise" },
  { value: "Trial", label: "Trial" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "Active", label: "Active" },
  { value: "Trial", label: "Trial" },
  { value: "Inactive", label: "Inactive" },
];

function ClientsPlans() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState(null);
  const [plans, setPlans] = useState(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [drawerClientId, setDrawerClientId] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionMenuClientId, setActionMenuClientId] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const data = await fetchClientsStats({ token });
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  const loadClients = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const data = await fetchClients({
        token,
        search: searchDebounced || undefined,
        plan: planFilter || undefined,
        status: statusFilter || undefined,
      });
      setClients(Array.isArray(data) ? data : null);
    } catch {
      setClients(null);
    } finally {
      setLoadingList(false);
    }
  }, [token, searchDebounced, planFilter, statusFilter]);

  const loadPlans = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchPlans({ token });
      setPlans(Array.isArray(data) ? data : null);
    } catch {
      setPlans(null);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (!drawerClientId) {
      setDetailsData(null);
      return;
    }
    let cancelled = false;
    setDetailsLoading(true);
    setDetailsData(null);
    fetchClientDetails({ clientId: drawerClientId, token })
      .then((data) => {
        if (!cancelled) {
          setDetailsData(data);
        }
      })
      .catch(() => {
        if (!cancelled) setDetailsData(null);
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [drawerClientId, token]);

  const handleRowClick = useCallback((row) => {
    setDrawerClientId(row.id);
    setActionMenuClientId(null);
  }, []);

  const handleActionsClick = useCallback((row) => {
    setActionMenuClientId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const handleCloseActionMenu = useCallback(() => {
    setActionMenuClientId(null);
  }, []);

  const handleAddClient = useCallback(
    async (payload) => {
      setAddLoading(true);
      try {
        await createClient({ token, data: payload });
        await loadClients();
        await loadStats();
      } finally {
        setAddLoading(false);
      }
    },
    [token, loadClients, loadStats]
  );

  const handleResetApiKey = useCallback(async () => {
    if (!drawerClientId || !token) return;
    try {
      await resetClientApiKey({ clientId: drawerClientId, token });
      const updated = await fetchClientDetails({ clientId: drawerClientId, token });
      setDetailsData(updated);
    } catch (e) {
      console.error(e);
    }
  }, [drawerClientId, token]);

  const handleUpgradePlan = useCallback(() => {
    if (!detailsData?.id || !plans?.length) return;
    const currentPlanId = detailsData.plan_id;
    const otherPlans = plans.filter((p) => p.id !== currentPlanId);
    if (otherPlans.length === 0) return;
    const nextPlan = otherPlans[0];
    changeClientPlan({ token, clientId: detailsData.id, newPlanId: nextPlan.id })
      .then(() => {
        return fetchClientDetails({ clientId: detailsData.id, token });
      })
      .then((updated) => {
        setDetailsData(updated);
        loadClients();
        loadStats();
      })
      .catch(console.error);
  }, [detailsData, plans, token, loadClients, loadStats]);

  const handleManageUsers = useCallback(() => {
    if (detailsData?.id) {
      setDrawerClientId(null);
      navigate(`/super/clients-plans?client=${detailsData.id}`);
    }
  }, [detailsData?.id, navigate]);

  const handleOpenLogs = useCallback(() => {
    setDrawerClientId(null);
    navigate("/super/monitoring");
  }, [navigate]);

  const handleDeleteClient = useCallback(async () => {
    if (!drawerClientId || !token) return;
    await deleteClient({ clientId: drawerClientId, token });
    setDrawerClientId(null);
    setDetailsData(null);
    await loadClients();
    await loadStats();
  }, [drawerClientId, token, loadClients, loadStats]);

  return (
    <div className="super-clients-plans">
      <SuperNav
        userName="Super Admin"
        userEmail="admin@autodoc.ai"
        onLogout={() => {}}
        onSettings={() => {}}
        onSearch={() => {}}
      />
      <main className="super-clients-plans-main">
        <div className="super-clients-plans-container">
          <header className="cp-header">
            <div className="cp-header-left">
              <h1 className="cp-title">Clients & Plans</h1>
              <nav className="cp-breadcrumb" aria-label="Breadcrumb">
                Super Admin &gt; Clients
              </nav>
            </div>
            <div className="cp-header-controls">
              <div className="cp-search-wrap">
                <span className="cp-search-icon" aria-hidden>
                  🔍
                </span>
                <input
                  type="search"
                  className="cp-search-input"
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search clients"
                />
              </div>
              <select
                className="cp-select"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                aria-label="Filter by plan"
              >
                {PLAN_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                className="cp-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="cp-btn-primary"
                onClick={() => setAddModalOpen(true)}
              >
                + Add New Client
              </button>
            </div>
          </header>

          <ClientsPlansStatsCards data={stats} loading={loadingStats} />

          <ClientsPlansTable
            clients={clients}
            loading={loadingList}
            onRowClick={handleRowClick}
            onActionsClick={handleActionsClick}
            actionMenuClientId={actionMenuClientId}
            onCloseActionMenu={handleCloseActionMenu}
          />
        </div>
      </main>

      <ClientDetailsDrawer
        open={Boolean(drawerClientId)}
        onClose={() => setDrawerClientId(null)}
        data={detailsData}
        loading={detailsLoading}
        onUpgradePlan={handleUpgradePlan}
        onResetApiKey={handleResetApiKey}
        onManageUsers={handleManageUsers}
        onOpenLogs={handleOpenLogs}
        onDeleteClient={handleDeleteClient}
      />

      <AddClientModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddClient}
        loading={addLoading}
        plans={plans || []}
      />
    </div>
  );
}

export default ClientsPlans;
