import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/public/homepage";
import About from "./pages/public/about";
import Pricing from "./pages/public/Pricing";
import Signup from "./pages/public/Signup";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import Sdashboard from "./pages/super/Sdashboard";
import EDashboard from "./pages/enterprise/Edashboard";
import Template from "./pages/enterprise/template";
import Api from "./pages/enterprise/api";
import Profile from "./pages/enterprise/profile";
import BDashboard from "./pages/business/B_dashboard";
import BApi from "./pages/business/B_api";
import BProfile from "./pages/business/B_profile";

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
        <Route path="/super" element={<Sdashboard />} />
        <Route path="/enterprise" element={<EDashboard />} />
        <Route path="/enterprise/template" element={<Template />} />
        <Route path="/enterprise/api" element={<Api />} />
        <Route path="/enterprise/profile" element={<Profile />} />
        <Route path="/business" element={<BDashboard />} />
        <Route path="/business/api" element={<BApi />} />
        <Route path="/business/profile" element={<BProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
