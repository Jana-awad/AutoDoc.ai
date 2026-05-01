import { Outlet, useNavigate } from "react-router-dom";
import EnterpriseNav from "../../../components/EnterpriseNav";
import "../../../components/variables.css";
import "../../../components/global.css";
import EnterpriseSidebar from "./EnterpriseSidebar.jsx";
import "../../business/B_profile.css";

function EnterpriseProfileLayout() {
  const navigate = useNavigate();
  return (
    <>
      <EnterpriseNav
        userName="Enterprise Admin"
        userEmail="admin@autodoc.ai"
        onSettings={() => navigate("/enterprise/profile/settings")}
      />
      <div className="b-profile-layout">
      <EnterpriseSidebar />
      <main id="main-content" className="b-profile-content">
        <div className="b-profile-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
    </>
  );
}

export default EnterpriseProfileLayout;
