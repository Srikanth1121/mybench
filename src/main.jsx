import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { RecruiterProvider } from "./context/RecruiterContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RecruiterProvider>
        <App />
      </RecruiterProvider>
    </AuthProvider>
  </StrictMode>
);
