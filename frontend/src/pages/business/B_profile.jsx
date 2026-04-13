import { Outlet } from "react-router-dom";
import "../../components/variables.css";
import "../../components/global.css";
import BusinessSidebar from "./profile/BusinessSidebar.jsx";
import "./B_profile.css";

function BProfileLayout() {
  return (
    <div className="b-profile-layout">
      <BusinessSidebar />
      <div className="b-profile-content">
        <div className="b-profile-content-inner">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default BProfileLayout;
