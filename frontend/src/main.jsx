import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app.jsx";
import { DemoGuideProvider } from "./components/demoGuide/DemoGuideProvider";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DemoGuideProvider>
          <App />
        </DemoGuideProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
