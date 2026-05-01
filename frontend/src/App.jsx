import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/public/homepage";
import About from "./pages/public/about";
import Pricing from "./pages/public/Pricing";
import Signup from "./pages/public/Signup";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import Sdashboard from "./pages/super/Sdashboard";
import ClientsPlans from "./pages/super/clients_plans";
import Monitoring from "./pages/super/monitoring";
import TemplatesAi from "./pages/super/templates_ai";
import TemplateBuilder from "./pages/super/TemplateBuilder";
import AiOverview from "./pages/super/AiOverview";
import SuperOperations from "./pages/super/SuperOperations";
import ClientLens from "./pages/super/ClientLens";
import EDashboard from "./pages/enterprise/Edashboard";
import Template from "./pages/enterprise/template";
import EnterpriseTemplatesAi from "./pages/enterprise/templates_ai";
import EnterpriseTemplateBuilder from "./pages/enterprise/TemplateBuilder";
import Api from "./pages/enterprise/api";
import EDocuments from "./pages/enterprise/EDocuments";
import EnterpriseProfileLayout from "./pages/enterprise/profile/EnterpriseProfileLayout";
import EAccountInfo from "./pages/enterprise/profile/EAccountInfo";
import EManageUsers from "./pages/enterprise/profile/EManageUsers";
import EBilling from "./pages/enterprise/profile/EBilling";
import ESettings from "./pages/enterprise/profile/ESettings";
import BDashboard from "./pages/business/B_dashboard";
import BApi from "./pages/business/B_api";
import BDocuments from "./pages/business/BDocuments";
import BProfileLayout from "./pages/business/B_profile";
import BAccountInfo from "./pages/business/profile/BAccountInfo";
import BManageUsers from "./pages/business/profile/BManageUsers";
import BBilling from "./pages/business/profile/BBilling";
import BSettings from "./pages/business/profile/BSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import UserAppShell from "./pages/user/UserAppShell";
import UserDashboard from "./pages/user/components/Dashboard";
import UserProfilePage from "./pages/user/UserProfilePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route path="/super" element={<Sdashboard />} />
          <Route path="/super/clients-plans" element={<ClientsPlans />} />
          <Route path="/super/templates-ai" element={<TemplatesAi />} />
          <Route path="/super/monitoring" element={<Monitoring />} />
          <Route path="/super/operations" element={<SuperOperations />} />
          <Route path="/super/clients/:clientId/lens" element={<ClientLens />} />
          <Route path="/super/templates-ai/builder" element={<TemplateBuilder />} />
          <Route path="/super/templates-ai/ai-overview" element={<AiOverview />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["enterprise_admin"]} />}>
          <Route path="/enterprise" element={<EDashboard />} />
          <Route path="/enterprise/template" element={<Template />} />
          <Route path="/enterprise/templates-ai" element={<EnterpriseTemplatesAi />} />
          <Route path="/enterprise/templates-ai/builder" element={<EnterpriseTemplateBuilder />} />
          <Route path="/enterprise/documents" element={<EDocuments />} />
          <Route path="/enterprise/api" element={<Api />} />
          <Route path="/enterprise/profile" element={<EnterpriseProfileLayout />}>
            <Route index element={<EAccountInfo />} />
            <Route path="account" element={<EAccountInfo />} />
            <Route path="users" element={<EManageUsers />} />
            <Route path="billing" element={<EBilling />} />
            <Route path="settings" element={<ESettings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["business_admin"]} />}>
          <Route path="/business" element={<BDashboard />} />
          <Route path="/business/documents" element={<BDocuments />} />
          <Route path="/business/api" element={<BApi />} />
          <Route path="/business/profile" element={<BProfileLayout />}>
            <Route index element={<BAccountInfo />} />
            <Route path="account" element={<BAccountInfo />} />
            <Route path="users" element={<BManageUsers />} />
            <Route path="billing" element={<BBilling />} />
            <Route path="settings" element={<BSettings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route path="/user" element={<UserAppShell />}>
            <Route index element={<UserDashboard />} />
            <Route path="documents" element={<UApp />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
