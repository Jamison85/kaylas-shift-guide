import { useMemo, useSyncExternalStore } from "react";

// A failed write must still be available if the user leaves and reopens a task.
const unsaved = new Map();
const listeners = new EventTarget();
const subscribeToWarnings = (notify) => {
  listeners.addEventListener("change", notify);
  return () => listeners.removeEventListener("change", notify);
};
export const useStorageWarning = () => useSyncExternalStore(subscribeToWarnings, () => unsaved.size > 0);

function createStore(key, fallback, normalize) {
  const initial = typeof fallback === "function" ? fallback() : fallback;
  let raw;
  let snapshot = normalize(initial);

  const read = () => {
    if (unsaved.has(key)) return unsaved.get(key);
    try {
      const saved = localStorage.getItem(key);
      if (saved !== raw) {
        snapshot = normalize(saved === null ? initial : JSON.parse(saved));
        raw = saved;
      }
    } catch {
      // Keep the last usable value. Reading a damaged record never replaces it.
    }
    return snapshot;
  };

  const update = (change) => {
    const previous = read();
    const changed = typeof change === "function" ? change(previous) : change;
    if (changed === previous && !unsaved.has(key)) return;
    const next = normalize(changed);
    try {
      const serialized = JSON.stringify(next);
      localStorage.setItem(key, serialized);
      raw = serialized;
      snapshot = next;
      unsaved.delete(key);
    } catch {
      unsaved.set(key, next);
    }
    listeners.dispatchEvent(new Event(key));
    listeners.dispatchEvent(new Event("change"));
  };

  read();
  const subscribe = (notify) => {
    const refresh = () => {
      read();
      notify();
    };
    const onStorage = (event) => {
      if (event.key === key || event.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    listeners.addEventListener(key, refresh);
    refresh();
    return () => {
      window.removeEventListener("storage", onStorage);
      listeners.removeEventListener(key, refresh);
    };
  };
  const getSnapshot = () => unsaved.has(key) ? unsaved.get(key) : snapshot;
  return { getSnapshot, update, subscribe };
}

const asRecord = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
export function useLocalStorage(key, fallback, normalize = asRecord) {
  const store = useMemo(() => createStore(key, fallback, normalize), [key, fallback, normalize]);
  return [useSyncExternalStore(store.subscribe, store.getSnapshot), store.update];
}
