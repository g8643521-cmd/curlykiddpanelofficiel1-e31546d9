import { useCallback, useEffect, useState } from "react";

type Namespace = "server" | "cheater";

const STORAGE_KEY = "ckp:custom-icons:v1";
const EVENT = "ckp:custom-icons-changed";

type Store = Record<string, Record<string, string>>; // ns -> key -> dataUrl|url

const read = (): Store => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
};

const write = (store: Store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* quota or serialization issue — ignore */
  }
};

export const useCustomIcons = (namespace: Namespace) => {
  const [store, setStore] = useState<Store>(() => read());

  useEffect(() => {
    const onChange = () => setStore(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const get = useCallback(
    (key: string): string | undefined => store[namespace]?.[key],
    [store, namespace]
  );

  const set = useCallback(
    (key: string, value: string) => {
      const next = read();
      next[namespace] = { ...(next[namespace] || {}), [key]: value };
      write(next);
    },
    [namespace]
  );

  const remove = useCallback(
    (key: string) => {
      const next = read();
      if (next[namespace]) {
        delete next[namespace][key];
        write(next);
      }
    },
    [namespace]
  );

  return { get, set, remove };
};

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
