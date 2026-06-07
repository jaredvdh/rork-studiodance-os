import { createRoot } from "react-dom/client";

import { AuthProvider } from "@/hooks/useAuth";
import { validateEnvironment } from "@/lib/env";
import App from "./App.tsx";
import "./index.css";

// Surface clear errors at startup if production configuration is missing.
validateEnvironment();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
