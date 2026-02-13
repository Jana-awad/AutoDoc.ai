import "../../components/variables.css";
import "../../components/global.css";
import Enavbar from "../../components/Enavbar";
import EDashboardHeader from "../../components/EDashboardHeader";
import EMetricsGrid from "../../components/EMetricsGrid";
import ETopActiveUsers from "../../components/ETopActiveUsers";
import EActivityFeed from "../../components/EActivityFeed";
import ESystemHealth from "../../components/ESystemHealth";
import EAIProcessingAnalytics from "../../components/EAIProcessingAnalytics";
import ETemplateIntelligence from "../../components/ETemplateIntelligence";
import EApiUsageMonitor from "../../components/EApiUsageMonitor";
import EAuditCompliance from "../../components/EAuditCompliance";
import ESupportSla from "../../components/ESupportSla";
import ESecurityAccess from "../../components/ESecurityAccess";
import "./Edashboard.css";

function EDashboard() {
  return (
    <div className="enterprise-dashboard">
      <Enavbar />
      <main className="enterprise-dashboard-main">
        <EDashboardHeader />

        <section className="enterprise-dashboard-section enterprise-dashboard-section--metrics">
          <EMetricsGrid />
        </section>

        <section className="enterprise-dashboard-section enterprise-dashboard-section--tri">
          <ETopActiveUsers />
          <EActivityFeed />
          <ESystemHealth />
        </section>

        <section className="enterprise-dashboard-section enterprise-dashboard-section--analytics">
          <EAIProcessingAnalytics />
          <ETemplateIntelligence />
          <EApiUsageMonitor />
        </section>

        <section className="enterprise-dashboard-section enterprise-dashboard-section--compliance">
          <EAuditCompliance />
          <ESecurityAccess />
          <ESupportSla />
        </section>
      </main>
    </div>
  );
}

export default EDashboard;