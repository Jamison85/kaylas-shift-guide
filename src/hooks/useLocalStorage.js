import { useEffect, useState } from "react";
export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => { try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback; } catch { return fallback; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}
