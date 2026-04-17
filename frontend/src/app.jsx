import "./App.css";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import LandingPage from "./pages/LandingPage";
import AppRoutes from "./routes/AppRoutes";

function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <div className="page-container">
          <AppRoutes />
        </div>
      </div>
    </div>
  );
}

function LegacyAppRedirect() {
  const location = useLocation();
  return <Navigate to={`/app${location.pathname}${location.search}`} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app/*" element={<DashboardLayout />} />
      <Route path="/dashboard/*" element={<Navigate to="/app" replace />} />
      <Route path="/scan/*" element={<LegacyAppRedirect />} />
      <Route path="/auth" element={<LegacyAppRedirect />} />
      <Route path="/verify-email" element={<LegacyAppRedirect />} />
      <Route path="/logs" element={<LegacyAppRedirect />} />
      <Route path="/analytics" element={<LegacyAppRedirect />} />
      <Route path="/settings" element={<LegacyAppRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
