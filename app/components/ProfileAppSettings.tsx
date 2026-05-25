"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  PROFILE_PREFS_UPDATED_EVENT,
  applyProfilePrefsToDocument,
  defaultProfilePrefs,
  listLocaleOptions,
  readProfilePrefs,
  resetProfilePrefs,
  writeProfilePrefs,
  type ProfileColorScheme,
  type ProfileDateFormat,
  type ProfilePrefs,
  type ProfileWeekStart
} from "@/lib/profilePreferences";

export function ProfileAppSettings() {
  const [prefs, setPrefs] = useState<ProfilePrefs>(defaultProfilePrefs);

  useEffect(() => {
    setPrefs(readProfilePrefs());
  }, []);

  function persist(next: ProfilePrefs) {
    setPrefs(next);
    writeProfilePrefs(next);
    applyProfilePrefsToDocument(next);
    window.dispatchEvent(new CustomEvent(PROFILE_PREFS_UPDATED_EVENT));
  }

  function onReset(e: FormEvent) {
    e.preventDefault();
    setPrefs(resetProfilePrefs());
  }

  const locales = listLocaleOptions();

  return (
    <div className="profile-app-settings">
      <p className="prefs-lead">
        These choices stay in <strong>this browser</strong>. They tune layout, motion, and how dates
        should read once Cloverfinder shows more dates across the app. Account email and password are
        below.
      </p>

      <fieldset className="prefs-fieldset">
        <legend>Language &amp; region</legend>
        <div className="prefs-grid">
          <label>
            Interface language
            <select
              value={prefs.locale}
              onChange={(e) => persist({ ...prefs, locale: e.target.value as ProfilePrefs["locale"] })}
            >
              {locales.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p className="prefs-note">
            Sets the page language for accessibility tools. Cloverfinder screens are still mostly English
            today; more translated copy will follow this setting over time.
          </p>
          <label>
            Preferred date order
            <select
              value={prefs.dateFormat}
              onChange={(e) =>
                persist({ ...prefs, dateFormat: e.target.value as ProfileDateFormat })
              }
            >
              <option value="locale">Match language / region</option>
              <option value="mdy">Month / day / year</option>
              <option value="dmy">Day / month / year</option>
              <option value="ymd">Year / month / day</option>
            </select>
          </label>
          <label>
            Week starts on
            <select
              value={prefs.weekStartsOn}
              onChange={(e) =>
                persist({ ...prefs, weekStartsOn: e.target.value as ProfileWeekStart })
              }
            >
              <option value="locale">Match language / region</option>
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="prefs-fieldset">
        <legend>Appearance</legend>
        <div className="prefs-grid">
          <label>
            Color mode
            <select
              value={prefs.colorScheme}
              onChange={(e) =>
                persist({ ...prefs, colorScheme: e.target.value as ProfileColorScheme })
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">Match system</option>
            </select>
          </label>
          <p className="prefs-note">
            Applies to profile, settings, and the main map header. Saved in this browser.
          </p>
          <label>
            Profile layout density
            <select
              value={prefs.density}
              onChange={(e) =>
                persist({
                  ...prefs,
                  density: e.target.value === "compact" ? "compact" : "comfortable"
                })
              }
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label className="prefs-checkbox">
            <input
              type="checkbox"
              checked={prefs.largerText}
              onChange={(e) => persist({ ...prefs, largerText: e.target.checked })}
            />
            Larger text in profile &amp; settings
          </label>
          <label className="prefs-checkbox">
            <input
              type="checkbox"
              checked={prefs.reduceMotion}
              onChange={(e) => persist({ ...prefs, reduceMotion: e.target.checked })}
            />
            Reduce animations &amp; transitions
          </label>
        </div>
      </fieldset>

      <fieldset className="prefs-fieldset">
        <legend>Notifications (saved here for now)</legend>
        <p className="prefs-note">
          Cloverfinder will connect these to email or push later. For now they are saved only on this
          device as a record of what you want.
        </p>
        <div className="prefs-grid">
          <label className="prefs-checkbox">
            <input
              type="checkbox"
              checked={prefs.productTips}
              onChange={(e) => persist({ ...prefs, productTips: e.target.checked })}
            />
            Tips about new Cloverfinder features
          </label>
          <label className="prefs-checkbox">
            <input
              type="checkbox"
              checked={prefs.findingReminders}
              onChange={(e) => persist({ ...prefs, findingReminders: e.target.checked })}
            />
            Reminders to log new finds
          </label>
          <label className="prefs-checkbox">
            <input
              type="checkbox"
              checked={prefs.weeklySummary}
              onChange={(e) => persist({ ...prefs, weeklySummary: e.target.checked })}
            />
            Weekly summary of activity (when available)
          </label>
        </div>
      </fieldset>

      <fieldset className="prefs-fieldset">
        <legend>Safety &amp; navigation</legend>
        <div className="prefs-grid">
          <label className="prefs-checkbox">
            <input
              type="checkbox"
              checked={prefs.confirmLeave}
              onChange={(e) => persist({ ...prefs, confirmLeave: e.target.checked })}
            />
            Warn before leaving Cloverfinder with unsaved work (where the browser allows it)
          </label>
        </div>
      </fieldset>

      <form className="prefs-reset-form" onSubmit={onReset}>
        <button type="submit" className="secondary">
          Reset app preferences to defaults
        </button>
        <p className="prefs-note">Does not change your username, email, or password.</p>
      </form>
    </div>
  );
}
