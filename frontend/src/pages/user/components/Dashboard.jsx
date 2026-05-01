import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/Toast";
import {
  fetchAccessibleTemplates,
  fetchLogDetail,
  fetchUserKpis,
  fetchUserLogs,
} from "../../../services/userDashboardApi";
import KPICards from "./KPICards";
import LogsTable from "./LogsTable";
import OutputModal from "./OutputModal";
import "./Dashboard.css";

function Dashboard() {
  const { token } = useAuth();
  const { push } = useToast();

  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState(null);

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(null);

  // Templates power the activity filter dropdown + name display.
  const [templates, setTemplates] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalData, setModalData] = useState(null);

  const loadKpis = useCallback(
    async (signal) => {
      setKpisLoading(true);
      setKpisError(null);
      try {
        const data = await fetchUserKpis({ token, signal });
        setKpis(data);
      } catch (e) {
        if (e.name !== "AbortError") setKpisError(e.message || "Could not load KPIs.");
      } finally {
        setKpisLoading(false);
      }
    },
    [token]
  );

  const loadLogs = useCallback(
    async (signal) => {
      setLogsLoading(true);
      setLogsError(null);
      try {
        const data = await fetchUserLogs({ token, signal });
        setLogs(data?.items || []);
      } catch (e) {
        if (e.name !== "AbortError") setLogsError(e.message || "Could not load logs.");
      } finally {
        setLogsLoading(false);
      }
    },
    [token]
  );

  const loadTemplates = useCallback(
    async (signal) => {
      try {
        const data = await fetchAccessibleTemplates({ token, signal });
        setTemplates(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          // Templates are an enrichment for filter UX; if unavailable we
          // still render with raw template IDs.
          setTemplates([]);
        }
      }
    },
    [token]
  );

  const refreshAll = useCallback(
    async (signal) => {
      await Promise.all([loadKpis(signal), loadLogs(signal), loadTemplates(signal)]);
    },
    [loadKpis, loadLogs, loadTemplates]
  );

  useEffect(() => {
    const ac = new AbortController();
    refreshAll(ac.signal);
    return () => ac.abort();
  }, [refreshAll]);

  const handleViewOutput = async (logId) => {
    setModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    setModalData(null);
    try {
      const data = await fetchLogDetail({ token, id: logId });
      setModalData(data);
    } catch (e) {
      setModalError(e.message || "Could not load output.");
      push({ type: "error", title: "Failed to load output", message: e.message });
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
    setModalError(null);
  };

  return (
    <div className="user-dashboard">
      <header className="user-dashboard__hero">
        <div className="user-dashboard__hero-glow" aria-hidden />
        <p className="user-dashboard__eyebrow">USER PORTAL</p>
        <h1 className="user-dashboard__title">Your Intelligent Workspace</h1>
        <p className="user-dashboard__lede">
          Process documents, monitor live activity, and review outputs in a single premium command center.
        </p>
      </header>

      <section className="user-dashboard__section" aria-labelledby="kpi-heading">
        <div className="user-dashboard__section-head">
          <h2 id="kpi-heading">Performance Snapshot</h2>
          <p>Real-time extraction metrics from your production data.</p>
        </div>
        <KPICards
          kpis={kpis}
          loading={kpisLoading}
          error={kpisError}
          onRetry={() => loadKpis()}
        />
      </section>

      <section className="user-dashboard__section" aria-labelledby="logs-heading">
        <div className="user-dashboard__section-head">
          <h2 id="logs-heading">Activity Timeline</h2>
          <p>Search, filter, and export every processing event from your workspace.</p>
        </div>
        <LogsTable
          items={logs}
          loading={logsLoading}
          error={logsError}
          templates={templates}
          onViewOutput={handleViewOutput}
          onRetry={() => loadLogs()}
        />
      </section>

      <OutputModal
        open={modalOpen}
        loading={modalLoading}
        error={modalError}
        data={modalData}
        onClose={closeModal}
      />
    </div>
  );
}

export default Dashboard;
