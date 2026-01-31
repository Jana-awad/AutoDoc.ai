import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/public/homepage";
import About from "./pages/public/about";
import Pricing from "./pages/public/Pricing";
import Signup from "./pages/public/Signup";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";

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
      </Routes>
    </Router>
  );
}

export default App;
