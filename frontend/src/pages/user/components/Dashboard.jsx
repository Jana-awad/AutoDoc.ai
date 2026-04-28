import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchAccessibleTemplates,
  fetchLogDetail,
  fetchUserKpis,
  fetchUserLogs,
} from "../../../services/userDashboardApi";
import KPICards from "./KPICards";
import LogsTable from "./LogsTable";
import OutputModal from "./OutputModal";
import QuickActions from "./QuickActions";
import "./Dashboard.css";

function Dashboard() {
  const { token } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState(null);

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);

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
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const data = await fetchAccessibleTemplates({ token, signal });
        setTemplates(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") setTemplatesError(e.message || "Could not load templates.");
      } finally {
        setTemplatesLoading(false);
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
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
    setModalError(null);
  };

  const handleProcessSuccess = useCallback(() => {
    const ac = new AbortController();
    loadKpis(ac.signal);
    loadLogs(ac.signal);
  }, [loadKpis, loadLogs]);

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

      <section className="user-dashboard__section">
        <div className="user-dashboard__section-head">
          <h2>Performance Snapshot</h2>
          <p>Real-time extraction metrics from your production data.</p>
        </div>
        <KPICards kpis={kpis} loading={kpisLoading} error={kpisError} />
      </section>

      <section className="user-dashboard__section">
        <div className="user-dashboard__section-head">
          <h2>Activity Timeline</h2>
          <p>Track every processing event and inspect output payloads.</p>
        </div>
        <LogsTable
          items={logs}
          loading={logsLoading}
          error={logsError}
          onViewOutput={handleViewOutput}
        />
      </section>

      <section className="user-dashboard__section">
        <div className="user-dashboard__section-head">
          <h2>Quick Processing Studio</h2>
          <p>Select a template, upload a file, and launch extraction instantly.</p>
        </div>
        <QuickActions
          templates={templates}
          loading={templatesLoading}
          error={templatesError}
          token={token}
          onSubmitSuccess={handleProcessSuccess}
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
