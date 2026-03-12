import { useEffect, useState, useCallback } from "react";
import "../../components/variables.css";
import "../../components/global.css";
import Enavbar from "../../components/Enavbar";
import { useAuth } from "../../context/AuthContext";
import {
  fetchApiKeys,
  createApiKey,
  revokeApiKey,
  rotateApiKey,
  fetchWebhookConfig,
  saveWebhookConfig,
  validateWebhook,
  fetchRequestLogs,
  downloadRequestLogs as downloadLogsBlob,
  fetchApiUsage,
  fetchRateLimits,
  fetchApiHealth,
  fetchApiSecurity,
  fetchKeyAuditLog,
  fetchWebhookDeliveries,
  fetchApiSupport,
} from "../../services/enterpriseApiManagementApi";
import EApiSecurityAlert from "../../components/EApiSecurityAlert";
import EApiKeyCard from "../../components/EApiKeyCard";
import EGenerateKeyModal from "../../components/EGenerateKeyModal";
import EWebhookForm from "../../components/EWebhookForm";
import ERequestLogsTable from "../../components/ERequestLogsTable";
import EApiUsageStats from "../../components/EApiUsageStats";
import ERateLimitPanel from "../../components/ERateLimitPanel";
import EApiHealthMonitor from "../../components/EApiHealthMonitor";
import EApiSecurityPanel from "../../components/EApiSecurityPanel";
import EIntegrationHelpers from "../../components/EIntegrationHelpers";
import EEnterpriseSupportSection from "../../components/EEnterpriseSupportSection";
import EModal from "../../components/EModal";
import "./api.css";

const ENTERPRISE_UNLIMITED = true;

function Api() {
  const { token } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [apiKeysError, setApiKeysError] = useState(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [newKeyReveal, setNewKeyReveal] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  const [webhookConfig, setWebhookConfig] = useState(null);
  const [webhookLoading, setWebhookLoading] = useState(true);
  const [webhookSaving, setWebhookSaving] = useState(false);

  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsStatus, setLogsStatus] = useState("");
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsDownloading, setLogsDownloading] = useState(false);

  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState(null);

  const [rateLimits, setRateLimits] = useState(null);
  const [rateLimitsLoading, setRateLimitsLoading] = useState(true);
  const [rateLimitsError, setRateLimitsError] = useState(null);

  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const [security, setSecurity] = useState(null);
  const [keyAudit, setKeyAudit] = useState([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState([]);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securityError, setSecurityError] = useState(null);

  const [support, setSupport] = useState(null);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState(null);

  const loadApiKeys = useCallback(
    async (signal) => {
      if (!token) return;
      setApiKeysLoading(true);
      setApiKeysError(null);
      try {
        const data = await fetchApiKeys({ token, signal });
        setApiKeys(Array.isArray(data) ? data : data?.keys ?? []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setApiKeysError(err);
          setApiKeys([]);
        }
      } finally {
        setApiKeysLoading(false);
      }
    },
    [token]
  );

  const handleCreateKey = useCallback(
    async ({ name, environment }) => {
      if (!token) return;
      setGenerateLoading(true);
      try {
        const result = await createApiKey({ token, name, environment });
        const key = result?.key ?? result?.secret ?? result?.api_key;
        const keyId = result?.id ?? result?.key_id;
        if (key) {
          setNewKeyReveal({ key, name, environment, id: keyId });
          setGenerateModalOpen(false);
          loadApiKeys();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setGenerateLoading(false);
      }
    },
    [token, loadApiKeys]
  );

  const handleRevokeKey = useCallback(
    async (keyId) => {
      if (!token || !keyId) return;
      setRevokingId(keyId);
      try {
        await revokeApiKey({ token, keyId });
        loadApiKeys();
      } catch (err) {
        console.error(err);
      } finally {
        setRevokingId(null);
      }
    },
    [token, loadApiKeys]
  );

  const handleRotateKey = useCallback(
    async (keyId) => {
      if (!token || !keyId) return;
      try {
        const result = await rotateApiKey({ token, keyId });
        const key = result?.key ?? result?.secret;
        if (key) setNewKeyReveal({ key, id: keyId });
        loadApiKeys();
      } catch (err) {
        console.error(err);
      }
    },
    [token, loadApiKeys]
  );

  const loadWebhook = useCallback(
    async (signal) => {
      if (!token) return;
      setWebhookLoading(true);
      try {
        const data = await fetchWebhookConfig({ token, signal });
        setWebhookConfig(data);
      } catch (err) {
        if (err.name !== "AbortError") setWebhookConfig(null);
      } finally {
        setWebhookLoading(false);
      }
    },
    [token]
  );

  const handleSaveWebhook = useCallback(
    async (payload) => {
      if (!token) return;
      setWebhookSaving(true);
      try {
        const data = await saveWebhookConfig({ token, ...payload });
        setWebhookConfig(data ?? payload);
      } catch (err) {
        console.error(err);
      } finally {
        setWebhookSaving(false);
      }
    },
    [token]
  );

  const handleValidateWebhook = useCallback(
    async (url) => {
      if (!token) return false;
      try {
        const result = await validateWebhook({ token, url });
        return result?.valid === true || result?.ok === true ? true : result;
      } catch {
        return { ok: false, message: "Validation request failed." };
      }
    },
    [token]
  );

  const loadLogs = useCallback(
    async (signal) => {
      if (!token) return;
      setLogsLoading(true);
      try {
        const data = await fetchRequestLogs({
          token,
          signal,
          search: logsSearch || undefined,
          status: logsStatus || undefined,
          page: logsPage,
          perPage: 20,
        });
        const list = data?.logs ?? data?.items ?? (Array.isArray(data) ? data : []);
        setLogs(list);
        setLogsTotal(data?.total ?? data?.count ?? list.length);
      } catch (err) {
        if (err.name !== "AbortError") {
          setLogs([]);
          setLogsTotal(0);
        }
      } finally {
        setLogsLoading(false);
      }
    },
    [token, logsSearch, logsStatus, logsPage]
  );

  const handleDownloadLogs = useCallback(async () => {
    if (!token) return;
    setLogsDownloading(true);
    try {
      const blob = await downloadLogsBlob({
        token,
        format: "csv",
        search: logsSearch || undefined,
        status: logsStatus || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `api-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsDownloading(false);
    }
  }, [token, logsSearch, logsStatus]);

  const loadUsage = useCallback(
    async (signal) => {
      if (!token) return;
      setUsageLoading(true);
      setUsageError(null);
      try {
        const data = await fetchApiUsage({ token, signal, period: "24h" });
        setUsage(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setUsageError(err);
          setUsage(null);
        }
      } finally {
        setUsageLoading(false);
      }
    },
    [token]
  );

  const loadRateLimits = useCallback(
    async (signal) => {
      if (!token) return;
      setRateLimitsLoading(true);
      setRateLimitsError(null);
      try {
        const data = await fetchRateLimits({ token, signal });
        setRateLimits(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setRateLimitsError(err);
          setRateLimits(null);
        }
      } finally {
        setRateLimitsLoading(false);
      }
    },
    [token]
  );

  const loadHealth = useCallback(
    async (signal) => {
      if (!token) return;
      setHealthLoading(true);
      setHealthError(null);
      try {
        const data = await fetchApiHealth({ token, signal });
        setHealth(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setHealthError(err);
          setHealth(null);
        }
      } finally {
        setHealthLoading(false);
      }
    },
    [token]
  );

  const loadSecurity = useCallback(
    async (signal) => {
      if (!token) return;
      setSecurityLoading(true);
      setSecurityError(null);
      try {
        const [sec, audit, deliveries] = await Promise.all([
          fetchApiSecurity({ token, signal }),
          fetchKeyAuditLog({ token, signal }).catch(() => []),
          fetchWebhookDeliveries({ token, signal }).catch(() => []),
        ]);
        setSecurity(sec);
        setKeyAudit(Array.isArray(audit) ? audit : audit?.entries ?? []);
        setWebhookDeliveries(Array.isArray(deliveries) ? deliveries : deliveries?.items ?? []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSecurityError(err);
          setSecurity(null);
          setKeyAudit([]);
          setWebhookDeliveries([]);
        }
      } finally {
        setSecurityLoading(false);
      }
    },
    [token]
  );

  const loadSupport = useCallback(
    async (signal) => {
      if (!token) return;
      setSupportLoading(true);
      setSupportError(null);
      try {
        const data = await fetchApiSupport({ token, signal });
        setSupport(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSupportError(err);
          setSupport(null);
        }
      } finally {
        setSupportLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const c = new AbortController();
    loadApiKeys(c.signal);
    return () => c.abort();
  }, [loadApiKeys]);

  useEffect(() => {
    const c = new AbortController();
    loadWebhook(c.signal);
    return () => c.abort();
  }, [loadWebhook]);

  useEffect(() => {
    const c = new AbortController();
    loadLogs(c.signal);
    return () => c.abort();
  }, [loadLogs]);

  useEffect(() => {
    const c = new AbortController();
    loadUsage(c.signal);
    return () => c.abort();
  }, [loadUsage]);

  useEffect(() => {
    const c = new AbortController();
    loadRateLimits(c.signal);
    return () => c.abort();
  }, [loadRateLimits]);

  useEffect(() => {
    const c = new AbortController();
    loadHealth(c.signal);
    return () => c.abort();
  }, [loadHealth]);

  useEffect(() => {
    const c = new AbortController();
    loadSecurity(c.signal);
    return () => c.abort();
  }, [loadSecurity]);

  useEffect(() => {
    const c = new AbortController();
    loadSupport(c.signal);
    return () => c.abort();
  }, [loadSupport]);

  const copyKey = (key) => {
    navigator.clipboard?.writeText(key);
  };

  const keyList = Array.isArray(apiKeys) ? apiKeys : [];

  return (
    <div className="enterprise-api">
      <Enavbar />
      <main className="enterprise-api-main">
        <header className="enterprise-api-header">
          <h1 className="enterprise-api-title">API management</h1>
          <p className="enterprise-api-subtitle">
            Manage API keys, webhooks, view request logs, usage, rate limits, and security.
          </p>
        </header>

        <section className="enterprise-api-section">
          <div className="enterprise-api-section-head">
            <h2 className="enterprise-api-section-title">API keys</h2>
            <button
              type="button"
              className="enterprise-api-btn enterprise-api-btn--primary"
              onClick={() => setGenerateModalOpen(true)}
            >
              Generate new key
            </button>
          </div>
          <EApiSecurityAlert />
          {apiKeysLoading && (
            <div className="enterprise-api-loading">
              <div className="enterprise-api-skeleton enterprise-api-skeleton--card" />
            </div>
          )}
          {!apiKeysLoading && apiKeysError && (
            <div className="enterprise-api-error">
              <p>Unable to load API keys.</p>
              <button type="button" className="enterprise-api-retry" onClick={() => loadApiKeys()}>
                Retry
              </button>
            </div>
          )}
          {!apiKeysLoading && !apiKeysError && keyList.length === 0 && (
            <div className="enterprise-api-empty">
              <p>No API keys yet. Generate one to start making requests.</p>
            </div>
          )}
          {!apiKeysLoading && !apiKeysError &&
            keyList.map((k) => (
              <EApiKeyCard
                key={k.id || k.key_id}
                id={k.id || k.key_id}
                name={k.name}
                keyPreview={k.key_preview ?? k.preview ?? k.masked ?? k.key}
                environment={k.environment ?? "development"}
                createdAt={k.created_at ?? k.createdAt}
                lastUsedAt={k.last_used_at ?? k.lastUsedAt}
                onCopy={copyKey}
                onRevoke={handleRevokeKey}
                onRotate={handleRotateKey}
                isRevoking={revokingId === (k.id || k.key_id)}
              />
            ))}
        </section>

        <EGenerateKeyModal
          open={generateModalOpen}
          onClose={() => setGenerateModalOpen(false)}
          onCreate={handleCreateKey}
          loading={generateLoading}
        />

        {newKeyReveal && (
          <EModal
            open={!!newKeyReveal}
            onClose={() => setNewKeyReveal(null)}
            title="Your new API key"
            size="medium"
          >
            <p className="enterprise-api-newkey-hint">
              Copy this key now. It won’t be shown again.
            </p>
            <div className="enterprise-api-newkey-wrap">
              <code className="enterprise-api-newkey-code">{newKeyReveal.key}</code>
              <button
                type="button"
                className="enterprise-api-btn enterprise-api-btn--secondary"
                onClick={() => copyKey(newKeyReveal.key)}
              >
                Copy
              </button>
            </div>
            <button
              type="button"
              className="enterprise-api-btn enterprise-api-btn--primary enterprise-api-newkey-done"
              onClick={() => setNewKeyReveal(null)}
            >
              Done
            </button>
          </EModal>
        )}

        <section className="enterprise-api-section">
          <h2 className="enterprise-api-section-title">Webhook configuration</h2>
          <EWebhookForm
            config={webhookConfig}
            loading={webhookLoading}
            saving={webhookSaving}
            onSave={handleSaveWebhook}
            onValidate={handleValidateWebhook}
          />
        </section>

        <section className="enterprise-api-section">
          <EApiUsageStats
            data={usage}
            loading={usageLoading}
            error={usageError}
            onRetry={loadUsage}
            isUnlimited={ENTERPRISE_UNLIMITED}
          />
        </section>

        <section className="enterprise-api-section enterprise-api-section--grid">
          <ERateLimitPanel
            data={rateLimits}
            loading={rateLimitsLoading}
            error={rateLimitsError}
            onRetry={loadRateLimits}
            isUnlimited={ENTERPRISE_UNLIMITED}
          />
          <EApiHealthMonitor
            data={health}
            loading={healthLoading}
            error={healthError}
            onRetry={loadHealth}
          />
        </section>

        <section className="enterprise-api-section">
          <ERequestLogsTable
            logs={logs}
            total={logsTotal}
            page={logsPage}
            perPage={20}
            loading={logsLoading}
            search={logsSearch}
            statusFilter={logsStatus}
            onSearchChange={(v) => { setLogsSearch(v); setLogsPage(1); }}
            onStatusFilterChange={(v) => { setLogsStatus(v); setLogsPage(1); }}
            onPageChange={setLogsPage}
            onRefresh={() => loadLogs()}
            onDownload={handleDownloadLogs}
            downloading={logsDownloading}
          />
        </section>

        <section className="enterprise-api-section enterprise-api-section--grid">
          <EApiSecurityPanel
            data={security}
            keyAudit={keyAudit}
            webhookDeliveries={webhookDeliveries}
            loading={securityLoading}
            error={securityError}
            onRetry={loadSecurity}
          />
          <EIntegrationHelpers templateId="inv_std_001" authMethod="Bearer token (API key)" />
        </section>

        <section className="enterprise-api-section">
          <EEnterpriseSupportSection
            data={support}
            loading={supportLoading}
            error={supportError}
            onRetry={loadSupport}
          />
        </section>
      </main>
    </div>
  );
}

export default Api;
