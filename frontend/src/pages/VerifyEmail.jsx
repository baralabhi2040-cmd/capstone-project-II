import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmailToken } from "../api/api";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("This verification link is missing a token.");
        return;
      }

      try {
        const response = await verifyEmailToken(token);
        setStatus("success");
        setMessage(response.message);
        try {
          await refreshUser();
        } catch {
          // The user may be verifying from a fresh browser session.
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error?.response?.data?.detail ||
            "We could not verify this email address."
        );
      }
    };

    verify();
  }, [token]);

  if (status === "loading") {
    return <Loader text="Verifying your email..." />;
  }

  return (
    <div className="page-stack">
      <div className="card auth-hero-card centered">
        <p className="hero-kicker">Verification flow</p>
        <h3 className="hero-title">
          {status === "success" ? "Email verified" : "Verification failed"}
        </h3>
        <p className="hero-description" style={{ margin: "12px auto 0", maxWidth: 720 }}>
          {message}
        </p>
        <div className="row wrap" style={{ justifyContent: "center", marginTop: 18 }}>
          <Link className="button button-primary topbar-link-button" to="/app/settings">
            Open account settings
          </Link>
          <Link className="button button-secondary topbar-link-button" to="/app/scan/email">
            Go to scanners
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
