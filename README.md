# AEGIS-AGENT — Red & Black Stealth Security War Room (Front-End Prototype)

[![Theme](https://img.shields.io/badge/theme-red%20%26%20black%20stealth-red.svg)](#)
[![Prototype Status](https://img.shields.io/badge/status-frontend--prototype-crimson.svg)](#)
[![Authorized Scope](https://img.shields.io/badge/scope-local--authorized--only-blue.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-emerald.svg)](#)

> **Persistent System Notice:**  
> **Front-end demo — no real scans or code changes.**  
> Prototype for authorized local testing only. Arbitrary public scanning and real code modifications are strictly disabled.

---

## 🎯 Overview & Concept

**AEGIS-AGENT** is an autonomous security war room front-end prototype crafted with a bold **Red & Black Stealth Operations** visual design. It simulates a multi-agent security test workflow for an authorized local application across four specialized roles:

1. **Red Agent**: Executes selected, predefined security test probes against the authorized local target.
2. **Sentinel Agent**: Ingests, parses, and validates results and raw HTTP evidence to confirm vulnerability signatures.
3. **Fix Agent**: Synthesizes a defensive remediation proposal and before/after code diff.
4. **Auditor Agent**: Runs synthetic regression checks to verify whether the vulnerability is remediated or still reproducible.

---

## ⚡ Quick Start / Localhost Link

Access the live front end at:

👉 **[http://localhost:3000](http://localhost:3000)**

### Alternative Run Commands:
```powershell
npm start
# OR
node server.js
```
Or simply double-click **`start.bat`** or **`index.html`** in Windows Explorer.

---

## 🔴 Visual Design: Red & Black Stealth Architecture

- **Canvas & Background:** Pitch Obsidian (`#08090D`), Deep Carbon (`#0E1017`, `#141722`).
- **Core Accents:** Precision Crimson Red (`#E63946`), Laser Ruby (`#FF2E44`, `#FF4D6D`), and deep blood-red borders (`#800F1D`, `#4D121A`).
- **Typography:** Pure Titanium White (`#F8FAFC`) with Slate Gray (`#94A3B8`) and glowing red heading highlights.
- **HUD & Progress:** Crimson laser progress track with millisecond stopwatch (`⏱ 00:04.2s`).
- **Theme Switcher:** Includes a live 1-click switcher in the top navbar:
  - `🔴 Red & Black (Stealth)` — Default high-impact dark cyber theme.
  - `🏛️ Ivory (Editorial)` — Warm atelier editorial theme.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| <kbd>Space</kbd> | Pause / Resume simulation |
| <kbd>R</kbd> | Reset current simulation run to Stage 1 |
| <kbd>N</kbd> | Open "Configure New Demo Run" modal |
| <kbd>Esc</kbd> | Close active modal |
| <kbd>1</kbd> | Switch to Finding & Evidence tab |
| <kbd>2</kbd> | Switch to Proposed Fix (Diff) tab |
| <kbd>3</kbd> | Switch to Regression Results tab |
| <kbd>4</kbd> | Switch to Live Telemetry tab |
