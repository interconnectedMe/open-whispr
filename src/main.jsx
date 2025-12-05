import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ControlPanel from "./components/ControlPanel.tsx";
import OnboardingFlow from "./components/OnboardingFlow.tsx";
import { ToastProvider } from "./components/ui/Toast.tsx";
import "./index.css";

function AppRouter() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is the control panel window
  const isControlPanel =
    window.location.pathname.includes("control") ||
    window.location.search.includes("panel=true");

  // Check if this is the dictation panel (main app)
  const isDictationPanel = !isControlPanel;

  // Keep app theme in sync with system dark/light preference
  useEffect(() => {
    const applyTheme = (isDark) => {
      const root = document.documentElement;
      if (!root) return;
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    try {
      const mediaQuery =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)");

      if (!mediaQuery) {
        return;
      }

      // Set initial theme
      applyTheme(mediaQuery.matches);

      // Listen for changes
      const listener = (event) => applyTheme(event.matches);
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", listener);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(listener);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", listener);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(listener);
        }
      };
    } catch {
      // If anything goes wrong, just leave the default light theme.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      // Start from localStorage flag
      let onboardingCompleted =
        localStorage.getItem("onboardingCompleted") === "true";
      const currentStep = parseInt(
        localStorage.getItem("onboardingCurrentStep") || "0"
      );

      // Ask main process for a persistent onboarding flag
      try {
        if (window.electronAPI?.isOnboardingComplete) {
          const flag = await window.electronAPI.isOnboardingComplete();
          if (flag) {
            onboardingCompleted = true;
            // Keep localStorage in sync so future logic is simple
            localStorage.setItem("onboardingCompleted", "true");
          }
        }
      } catch {
        // If IPC fails for any reason, fall back to localStorage only
      }

      if (cancelled) return;

      if (isControlPanel && !onboardingCompleted) {
        setShowOnboarding(true);
      }

      // Hide dictation panel window unless onboarding is complete or we're past the permissions step
      if (isDictationPanel && !onboardingCompleted && currentStep < 4) {
        window.electronAPI?.hideWindow?.();
      }

      setIsLoading(false);
    };

    void checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [isControlPanel, isDictationPanel]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem("onboardingCompleted", "true");
    // Also persist completion via main process flag
    try {
      window.electronAPI?.markOnboardingComplete?.();
    } catch {
      // Non-fatal if this fails; localStorage still has the flag
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading OpenWhispr...</p>
        </div>
      </div>
    );
  }

  if (isControlPanel && showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return isControlPanel ? <ControlPanel /> : <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  </React.StrictMode>
);
