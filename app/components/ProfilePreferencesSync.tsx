"use client";

import { useEffect, useState } from "react";
import {
  PROFILE_PREFS_UPDATED_EVENT,
  applyProfilePrefsToDocument,
  readProfilePrefs,
  type ProfilePrefs
} from "@/lib/profilePreferences";

export function ProfilePreferencesSync() {
  const [prefs, setPrefs] = useState<ProfilePrefs | null>(null);

  useEffect(() => {
    function sync() {
      const next = readProfilePrefs();
      setPrefs(next);
      applyProfilePrefsToDocument(next);
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PROFILE_PREFS_UPDATED_EVENT, sync);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => sync();
    mq.addEventListener("change", onScheme);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PROFILE_PREFS_UPDATED_EVENT, sync);
      mq.removeEventListener("change", onScheme);
    };
  }, []);

  useEffect(() => {
    if (!prefs?.confirmLeave) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [prefs?.confirmLeave]);

  return null;
}
