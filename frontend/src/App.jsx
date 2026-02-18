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
import EDashboard from "./pages/enterprise/Edashboard";
import Template from "./pages/enterprise/template";
import Api from "./pages/enterprise/api";
import Profile from "./pages/enterprise/profile";
import BDashboard from "./pages/business/B_dashboard";
import BApi from "./pages/business/B_api";
import BProfileLayout from "./pages/business/B_profile";
import BAccountInfo from "./pages/business/profile/BAccountInfo";
import BManageUsers from "./pages/business/profile/BManageUsers";
import BBilling from "./pages/business/profile/BBilling";
import BSettings from "./pages/business/profile/BSettings";
import ProtectedRoute from "./components/ProtectedRoute";

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
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["enterprise_admin"]} />}>
          <Route path="/enterprise" element={<EDashboard />} />
          <Route path="/enterprise/template" element={<Template />} />
          <Route path="/enterprise/api" element={<Api />} />
          <Route path="/enterprise/profile" element={<Profile />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["business_admin"]} />}>
          <Route path="/business" element={<BDashboard />} />
          <Route path="/business/api" element={<BApi />} />
          <Route path="/business/profile" element={<BProfileLayout />}>
            <Route index element={<BAccountInfo />} />
            <Route path="account" element={<BAccountInfo />} />
            <Route path="users" element={<BManageUsers />} />
            <Route path="billing" element={<BBilling />} />
            <Route path="settings" element={<BSettings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
