import { Outlet } from "react-router-dom";
import Enavbar from "../../../components/Enavbar";
import "../../../components/variables.css";
import "../../../components/global.css";
import EnterpriseSidebar from "./EnterpriseSidebar.jsx";
import "../../business/B_profile.css";

function EnterpriseProfileLayout() {
  return (
    <>
      <Enavbar />
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
