import { useCallback, useState } from "react";
import "../../components/variables.css";
import "../../components/global.css";
import Bnavbar from "../../components/Bnavbar";
import BDashboardHeader from "../../components/BDashboardHeader";
import BMetricsGrid from "../../components/BMetricsGrid";
import BTopActiveUsers from "../../components/BTopActiveUsers";
import BActivityFeed from "../../components/BActivityFeed";
import BSystemHealth from "../../components/BSystemHealth";
import BAIProcessingAnalytics from "../../components/BAIProcessingAnalytics";
import BTemplateIntelligence from "../../components/BTemplateIntelligence";
import BApiUsageMonitor from "../../components/BApiUsageMonitor";
import BAuditCompliance from "../../components/BAuditCompliance";
import BSupportSla from "../../components/BSupportSla";
import BSecurityAccess from "../../components/BSecurityAccess";
import "./B_dashboard.css";

function BDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  return (
    <div className="business-dashboard">
      <Bnavbar />
      <main className="business-dashboard-main">
        <BDashboardHeader
          refreshKey={refreshKey}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <section className="business-dashboard-section business-dashboard-section--metrics">
          <BMetricsGrid refreshKey={refreshKey} />
        </section>

        <section className="business-dashboard-section business-dashboard-section--users">
          <BTopActiveUsers refreshKey={refreshKey} />
          <BActivityFeed refreshKey={refreshKey} />
        </section>

        <section className="business-dashboard-section business-dashboard-section--systems">
          <BSystemHealth refreshKey={refreshKey} />
          <BAIProcessingAnalytics refreshKey={refreshKey} />
          <BApiUsageMonitor refreshKey={refreshKey} />
        </section>

        <section className="business-dashboard-section business-dashboard-section--intel">
          <BTemplateIntelligence refreshKey={refreshKey} />
          <BAuditCompliance refreshKey={refreshKey} />
        </section>

        <section className="business-dashboard-section business-dashboard-section--trust">
          <BSupportSla refreshKey={refreshKey} />
          <BSecurityAccess refreshKey={refreshKey} />
        </section>
      </main>
    </div>
  );
}

export default BDashboard;