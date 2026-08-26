import { useEffect, useState } from "react";

const runningStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => runningStandalone());
  const [isStandalone, setIsStandalone] = useState(() => runningStandalone());

  useEffect(() => {
    const displayMode = window.matchMedia?.("(display-mode: standalone)");
    const rememberPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const rememberInstall = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    const watchDisplayMode = () => {
      const standalone = runningStandalone();
      setIsStandalone(standalone);
      if (standalone) setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", rememberPrompt);
    window.addEventListener("appinstalled", rememberInstall);
    displayMode?.addEventListener?.("change", watchDisplayMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", rememberPrompt);
      window.removeEventListener("appinstalled", rememberInstall);
      displayMode?.removeEventListener?.("change", watchDisplayMode);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return "unavailable";
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      return choice.outcome;
    } catch {
      setInstallPrompt(null);
      return "unavailable";
    }
  };

  return { canInstall: Boolean(installPrompt) && !installed, installed, isStandalone, install };
}
