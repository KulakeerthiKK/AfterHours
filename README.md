# AEGIS-AGENT — Multi-Agent Security War Room (Front-End Prototype)

[![Prototype Status](https://img.shields.io/badge/status-frontend--prototype-cyan.svg)](#)
[![Authorized Scope](https://img.shields.io/badge/scope-local--authorized--only-blue.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-emerald.svg)](#)

> **Persistent System Notice:**  
> **Front-end demo — no real scans or code changes.**  
> Prototype for authorized local testing only. Arbitrary public scanning and real code modifications are strictly disabled.

---

## 🎯 Overview & Concept

**AEGIS-AGENT** is a cybersecurity war room front-end prototype created for hackathon demonstration. It simulates an autonomous multi-agent security test workflow for an authorized, local test application across four distinct roles:

1. **Red Agent**: Executes selected, predefined security test probes against the authorized local target.
2. **Sentinel Agent**: Ingests, parses, and validates results and raw HTTP evidence to confirm vulnerability signatures.
3. **Fix Agent**: Synthesizes a defensive remediation proposal and before/after code diff.
4. **Auditor Agent**: Runs synthetic regression checks to verify whether the vulnerability is remediated or still reproducible.

---

## ⚡ Quick Start / How to Run

You can run the front end using **any** of the following simple methods:

### Option 1: Double-Click (Zero Setup — Instant)
- Double-click **`start.bat`** in Windows Explorer, OR
- Double-click **`index.html`** directly in any browser (Chrome, Edge, Firefox, Brave).
- Everything is self-contained with zero external downloads required!

### Option 2: Using Node.js (Built-in Server)
```bash
npm start
# OR
node server.js
```
Then open your browser to **[http://localhost:3000](http://localhost:3000)**.

### Option 3: Using Python
```bash
python -m http.server 3000
```
Then open your browser to **[http://localhost:3000](http://localhost:3000)**.

---

## 🖥️ Screens & Features Implemented

### 1. Dashboard & History Overview (`#view-dashboard`)
- **War Room Metrics:** Total Scans, Active Roles, Target Vulnerabilities (High/Medium), Synthetic Regression Pass Rate.
- **Hero Area:** Project description and quick-launch button for demo runs.
- **Agent Roles Roster:** Explains the 4 specialized roles (Red, Sentinel, Fix, Auditor).
- **Recent Runs List:** Interactive history table showing Run ID, Target Label, Test Case, Finding Count, Status, and an **"Inspect Run"** button that immediately loads the run in the War Room.
- **Authorized Scope Banner:** Clear disclosure that testing is limited to authorized local targets.

### 2. New Run Setup Modal (`#modal-new-run`)
- **Target Field:** Pre-filled with `"Local training app (auth-service:v1.4.2)"` and locked. Does not accept arbitrary public URLs.
- **Test Case Selector:** Safe, predefined demo options:
  - `Input validation check` (CWE-89: SQL parameter boundary check on login)
  - `Authentication check` (CWE-287: Broken JWT verification via `alg: none`)
  - `Path traversal check` (CWE-22: Arbitrary file read in report download)
- **Mandatory Scope Confirmation Checkbox:** The "Start Run" action remains disabled until the operator acknowledges:
  *"I confirm scope authorization: This simulation is restricted strictly to the authorized local training environment."*
- **Action Buttons:** "Start Run" and "Cancel".

### 3. War Room / Live Workflow Timeline (`#view-warroom`)
- **5-Stage Synchronous Timeline:**
  1. `Scope accepted` (System Orchestrator)
  2. `Test run` (Red Agent)
  3. `Evidence reviewed` (Sentinel Agent)
  4. `Fix proposed` (Fix Agent)
  5. `Regression checked` (Auditor Agent)
- **Stage State Indicators:** Real-time visual states (`queued`, `running`, `complete`, `needs review`, `failed`) with animated glowing pulse during execution.
- **Multi-Agent Status Cards:** Shows each agent's active status (`Idle`, `Active`, `Complete`) and concise activity message.
- **War Room Control Bar:**
  - `Pause Demo` / `Resume Demo` toggle
  - `Step Forward` (manual single-stage advancement)
  - `Reset Demo` (re-runs from Stage 1)
  - `Speed Selector` (0.5x, 1x, 2x, Fast)
  - Active Run ID tag and live UTC heartbeat clock.

### 4. Finding & Evidence View (`#pane-finding`)
- Clearly labeled mock vulnerability finding (dynamic based on selected test case).
- Displays Severity (`HIGH` / `MEDIUM`), CVSS 3.1 score, Affected Component, CWE mapping, and plain-language explanation.
- **Evidence Inspector Tabs:**
  - `HTTP Probe Request`: Raw HTTP payload sent by Red Agent.
  - `HTTP Response & Body`: Captured server response demonstrating the flaw.
  - `Agent Telemetry Trace`: Chronological log entries from Red and Sentinel agents.
  - `Container Stacktrace`: Mock execution trace in the training container.
- **Watermark:** `"SIMULATED DEMO DATA • AUTHORIZED LOCAL TARGET"`.
- **Interactive Triage Review Controls (Prototype Only):**
  - `[ Confirmed Finding ]`
  - `[ Needs Review ]`
  - `[ Not Confirmed ]`
  - Includes explicit disclaimer: *"Prototype UI controls — updates local front-end review state only"*.

### 5. Proposed Fix View (`#pane-fix`)
- Remediation strategy summary drafted by Fix Agent.
- **Readable Before/After Code Diff Viewer:**
  - Line numbers and gutter indicators.
  - Red highlighting (`-`) for vulnerable lines removed.
  - Green highlighting (`+`) for safe parameterized code added.
  - File path and change stats (`+6 / -4`).
- **Interactive Review Actions:**
  - `[ Approve for Demo ]`
  - `[ Reject Fix ]`
- **Notice Banner:** *"Notice: This action only updates the front-end demonstration state. No code was actually changed and no pull request was created."*

### 6. Regression Result View (`#pane-regression`)
- **Reproducibility Status Banner:** Prominent badge displaying:  
  `🛡️ REMEDIATED — Not Reproducible`.
- **Interactive Re-Test / Toggle Button:** Allows presenters to toggle between `Remediated` and `Reproducible` to demonstrate how the UI reacts if an exploit is still viable.
- **Mock Test Check Matrix:** 4 synthetic verification cases (Exploit payload check, legitimate user flow, boundary edge cases, parameter type safety) with PASS/FAIL status.
- **Distinction Notice:** Confirms all checks are synthetic mock results distinguishable from real CI/CD test execution.

### 7. Agent Telemetry Feed (`#view-logs`)
- Synchronous message bus log feed detailing inter-agent communications between Red, Sentinel, Fix, and Auditor agents.

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

---

## 📁 Project Architecture

```
AfterHours/
├── index.html              # Main single-page application entry point
├── package.json            # Node.js project file with "start" script
├── server.js               # Zero-dependency local static server
├── start.bat               # Windows 1-click launcher
├── README.md               # Documentation & usage guide
├── css/
│   └── war-room.css        # Professional dark cybersecurity operations theme
└── js/
    ├── mockData.js         # Realistic security datasets for all test cases
    ├── simulator.js        # Workflow simulation engine (5 stages & agent state)
    └── app.js              # UI controller, event handlers & keyboard shortcuts
```

---

## 🛡️ Hackathon Prototype Compliance Checklist

- [x] Front-end only (no backend services, credentials, or external API dependencies).
- [x] Four defined agent roles: Red, Sentinel, Fix, Auditor.
- [x] Five workflow stages: Scope accepted → Test run → Evidence reviewed → Fix proposed → Regression checked.
- [x] Professional dark security-operations interface with high contrast.
- [x] Small persistent label: *"Front-end demo — no real scans or code changes"*.
- [x] Scope confirmation checkbox and locked local target (no arbitrary public URLs).
- [x] Realistic mock findings, evidence tabs, code diff viewer, and regression matrix.
- [x] Clear disclaimers that code was not modified and results are simulated.
