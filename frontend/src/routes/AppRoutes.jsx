import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import UrlScanner from "../pages/UrlScanner";
import EmailScanner from "../pages/EmailScanner";
import SmsScanner from "../pages/SmsScanner";
import SocialScanner from "../pages/SocialScanner";
import Logs from "../pages/Logs";
import Analytics from "../pages/Analytics";
import ProjectPoster from "../pages/ProjectPoster";
import Settings from "../pages/Settings";
import Auth from "../pages/Auth";
import VerifyEmail from "../pages/VerifyEmail";

function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="auth" element={<Auth />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route path="scan/url" element={<UrlScanner />} />
      <Route path="scan/email" element={<EmailScanner />} />
      <Route path="scan/sms" element={<SmsScanner />} />
      <Route path="scan/social" element={<SocialScanner />} />
      <Route path="logs" element={<Logs />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="poster" element={<ProjectPoster />} />
      <Route path="settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default AppRoutes;
