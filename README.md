# AEGIS-AGENT — Multi-Agent Security War Room Prototype

[![Theme](https://img.shields.io/badge/theme-red%20%26%20black%20stealth-red.svg)](#)
[![Secondary Theme](https://img.shields.io/badge/theme-warm%20ivory%20editorial-amber.svg)](#)
[![Prototype Status](https://img.shields.io/badge/status-multi--agent--prototype-crimson.svg)](#)
[![Authorized Scope](https://img.shields.io/badge/scope-local--authorized--only-blue.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-emerald.svg)](#)

> **Persistent System Notice:**  
> **Front-end demo — no real scans or code changes.**  
> Prototype for explicitly authorized local testing only. Arbitrary public scanning, automated repository writing, and destructive exploit execution are strictly disabled. All candidate code changes require human-in-the-loop approval.

---

## 🎯 Overview & Concept

**AEGIS-AGENT** is a cybersecurity war room prototype designed for authorized local applications. It implements a multi-agent security test workflow with mandatory **human-in-the-loop review**, decomposing application security review into specialized, auditable roles:

1. **Scope Controller (`scope_check`)**: Validates target whitelist authorization and explicit user scope consent.
2. **Red Agent (`red_agent`)**: Executes predefined, non-destructive test probes against the authorized local fixture.
3. **Sentinel Agent (`sentinel_agent`)**: Ingests HTTP evidence and verifies exploit signatures to confirm findings before any fix can be proposed.
4. **Fix Agent (`fix_agent`)**: Synthesizes defensive remediation code diffs in an isolated memory sandbox (human approval required; never auto-applied).
5. **Auditor Agent (`auditor_agent`)**: Runs independent regression test matrices to verify whether the vulnerability is remediated or remains reproducible.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Scope Check  │ ───►  │  2. Red Agent   │ ───►  │3. Sentinel Agent│ ───►  │  4. Fix Agent   │ ───►  │5. Auditor Agent │
│ (Target Bounds) │       │ (Probing)       │       │ (Confirm Evid.) │       │ (Remediation)   │       │ (Indep. Check)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
                                                                                       │
                                                                                       ▼
                                                                           ┌───────────────────────┐
                                                                           │  Human Approval Gate  │
                                                                           │ (Never Auto-Applied)  │
                                                                           └───────────────────────┘
```

---

## ⚡ Quick Start & Live Application

Access the live interface locally at:

👉 **[http://localhost:3000](http://localhost:3000)**

### Start Server:
```powershell
npm start
# OR
node server.js
```
The application runs on native Node.js core modules with **zero external npm dependencies**. Both the frontend UI and the REST API are co-hosted on port `3000` with zero CORS issues.

---

## 📚 Complete PDF Documentation

Two comprehensive visual PDF guides have been compiled and are directly accessible:

| Document | Format | Direct In-Browser Link | Description |
|:---|:---|:---|:---|
| **Demo Runbook & Judges Guide** | [PDF](file:///c:/Users/dell/Desktop/AfterHours/AEGIS-AGENT_Demo_and_Judges_Guide.pdf) | [Open in Browser](http://localhost:3000/AEGIS-AGENT_Demo_and_Judges_Guide.pdf) | Complete operational runbook, executive pitch deck, 2-minute live demo script, and Q&A defense answers for hackathon judges. |
| **Frontend Architecture & UI Guide** | [PDF](file:///c:/Users/dell/Desktop/AfterHours/AEGIS-AGENT_Frontend_Architecture_and_UI_Guide.pdf) | [Open in Browser](http://localhost:3000/AEGIS-AGENT_Frontend_Architecture_and_UI_Guide.pdf) | Technical deep-dive on Vanilla JS architecture, dual themes, HUD mechanics, 4-pane workbench, and Web Audio API sound synthesis. |

---

## 📁 Repository Directory Structure

```text
AfterHours/
├── server.js                                     # Zero-dependency Node.js HTTP server (co-hosts UI & API on port 3000)
├── index.html                                    # Single-page war room interface, HUD, and modal dialogs
├── package.json                                  # Project manifest (scripts: "start", "dev")
├── README.md                                     # Main documentation and guide
├── AEGIS-AGENT_Demo_and_Judges_Guide.pdf         # Judges pitch, demonstration runbook, and Q&A guide
├── AEGIS-AGENT_Frontend_Architecture_and_UI_Guide.pdf # Deep-dive frontend architecture & UI manual
├── backend/
│   ├── coordinator.js                            # Server-side 5-stage workflow coordinator state machine
│   ├── redAgent.js                               # Controlled local test prober & allowlist checker
│   ├── sentinelAgent.js                          # Heuristic evidence reviewer & signature validator
│   ├── fixAgent.js                               # Isolated defensive remediation module & test runner
│   ├── fixAgentAdapter.js                        # Team boundary integration adapter & output validator
│   ├── auditorAgent.js                           # Independent 4-point regression verification engine
│   ├── reportGenerator.js                        # Sanitized JSON & Markdown audit report generator
│   ├── runsStore.js                              # In-memory runs store with deduplication & retry logic
│   ├── routes.js                                 # RESTful API route dispatcher & JSON serializer
│   └── mockData.js                               # Seeded historical datasets & test case templates
├── css/
│   └── war-room.css                              # Dual-theme visual styling, animations, and responsive layout
└── js/
    ├── app.js                                    # Frontend application controller & API polling engine
    ├── mockData.js                               # Client-side fallback fixtures & templates
    └── simulator.js                              # Web Audio API sound synthesizer
```

---

## 🎨 Frontend Architecture & Features

The frontend is built on **pure browser standards (HTML5 / CSS3 / Vanilla JS)**:

### 1. Dual Visual Themes (1-Click Navbar Switcher)
- **🔴 Red & Black Stealth Operations (Default):** Pitch obsidian carbon surfaces (`#08090D`, `#0E1017`), glowing crimson ruby accents (`#E63946`, `#FF2E44`), and titanium white typography.
- **🏛️ Warm Ivory Editorial Atelier:** Warm ivory background (`#F4F0E8`), editorial serif typography, muted terracotta accents (`#A75D43`), and soft taupe dividers (`#D8CFC2`).

### 2. Live War Room Cockpit & HUD
- **Live Status HUD:** Run ID tag, sweeping laser progress track, digital UTC clock, and millisecond stopwatch (`⏱ 00:04.2s`).
- **Synchronous 5-Stage Timeline:** Real-time state indicators (`✓` complete, `●` running, `⚠️` review, `✕` failed, `1-5` queued).
- **Multi-Agent Roster:** Live activity pills for **Red**, **Sentinel**, **Fix**, and **Auditor** agents.

### 3. Investigation & Remediation Workbench (4 Detail Panes)
1. **Finding & Evidence (`1`):** CVSS severity rating, CWE tag, and tabbed evidence viewer (`HTTP Request`, `HTTP Response`, `Raw Trace`, `Call Stack`).
2. **Proposed Fix / Diff (`2`):** Remediation strategy, technical rationale, allowlisted test validation badge (`python -m py_compile` &bull; `PASSED`), and an interactive **Unified & Split diff viewer** with line gutters.
3. **Regression Results (`3`):** Prominent reproducibility banner (`REMEDIATED` vs. `REPRODUCIBLE`), 4-check regression test matrix, and live replay controls.
4. **Live Telemetry (`4`):** Auto-scrolling terminal feed streaming inter-agent telemetry with real-time timestamps.

### 4. Keyboard Shortcuts
| Key | Action | Description |
|:---|:---|:---|
| <kbd>N</kbd> | **New Demo Run** | Opens the run configuration modal dialog. |
| <kbd>Space</kbd> | **Pause / Resume** | Freezes simulation timer to explain an active stage to judges. |
| <kbd>R</kbd> | **Reset Active Run** | Resets active simulation view back to Stage 1. |
| <kbd>Esc</kbd> | **Close Modal** | Dismisses active dialogs. |
| <kbd>1</kbd> | **Finding Tab** | Switches to finding details & raw HTTP evidence. |
| <kbd>2</kbd> | **Proposed Fix Tab** | Switches to code diff viewer & human approval actions. |
| <kbd>3</kbd> | **Regression Tab** | Switches to independent regression checks. |
| <kbd>4</kbd> | **Telemetry Logs** | Switches to live streaming logs. |

---

## 🔒 Safety Scope & Boundaries

This prototype is built exclusively for authorized local testing:
- **Allowed Targets:** Strictly bounded to `Local training app (auth-service:v1.4.2)`, `Local training app (session-gateway:v1.4.2)`, `Local training app (report-service:v1.4.2)`, `local-demo-target`, or `http://localhost:8080`.
- **Blocked:** Arbitrary URLs, public hostnames, third-party internet endpoints, and unknown test parameters are rejected with HTTP 400.
- **Non-Destructive:** Test cases inject only bounded syntax and header probes against the demo fixture; no destructive actions, persistence, or data exfiltration.
- **No Automatic Code Changes:** Candidate diffs are held in `PENDING_HUMAN_APPROVAL` status. They are never committed, merged, or pushed to any repository without explicit operator action.

---

## 🤝 Fix Agent Remediation Module & Collaborator Contract

The Fix Agent module is isolated in [`backend/fixAgent.js`](file:///c:/Users/dell/Desktop/AfterHours/backend/fixAgent.js) and wired through [`backend/fixAgentAdapter.js`](file:///c:/Users/dell/Desktop/AfterHours/backend/fixAgentAdapter.js).

### Input Contract (Sent to Fix Agent):
```typescript
interface FixAgentInput {
  run_id: string;             // e.g. "RUN-1050"
  finding_id: string;         // e.g. "VULN-2026-0814"
  status: 'confirmed';        // Mandatory: Must be confirmed by Sentinel
  title: string;              // Finding title
  cwe: string;                // e.g. "CWE-89"
  severity: string;           // "HIGH" | "CRITICAL" | "MEDIUM"
  affected_component: string;
  test_case: string;          // "input-validation" | "authentication-check" | "path-traversal" | "command-injection"
  short_explanation: string;
  evidence: {
    http_request?: string;
    http_response?: string;
    captured_trace?: string;
    call_stack?: string;
  };
  workspace_id: string;       // Authorized local fixture identifier (e.g. "auth-service:v1.4.2")
}
```

### Result Contract (Returned by Fix Agent):
```typescript
interface FixAgentResult {
  run_id: string;             // Associated run identifier
  finding_id: string;         // Finding identifier
  status: 'proposed' | 'needs_review' | 'failed' | 'rejected';
  summary: string;            // Concise remediation strategy
  rationale: string;          // Technical defensive explanation
  changed_files: string[];    // Array of sanitized relative file paths (max 1-2 files)
  unified_diff: string;       // Unified diff representation
  diff_stats: { additions: number; deletions: number };
  validation_status: 'passed' | 'failed' | 'not_run';
  configured_test_command: string | null; // e.g. "python -m py_compile backend/services/auth_service.py"
  test_output: string | null; // Output from allowlisted test execution
  approval_state: 'PENDING_HUMAN_APPROVAL';
  applied: false;             // Safety invariant: strictly false
  limitations: string;        // Explicit safety bounds and isolation notes
  is_simulated: boolean;
}
```

### Configured Allowlisted Validation Tests:
Only explicitly allowlisted project test commands are permitted to validate candidate changes:
- `input-validation`: `python -m py_compile backend/services/auth_service.py`
- `authentication-check`: `go vet ./gateway/middleware/...`
- `path-traversal`: `python -m py_compile reports/controller.py`
- `command-injection`: `python -m py_compile diagnostics/ping_service.py`

*Arbitrary shell commands found in findings or model output are strictly rejected.*

---

## 🔌 API Endpoints & cURL Examples

| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/runs` | `GET` | List all historical and recent runs. |
| `/api/runs` | `POST` | Create a new run (requires `target_id`, `test_case`, `scope_confirmed: true`). |
| `/api/runs/:run_id` | `GET` | Retrieve live run state, stage statuses, evidence, fix proposal, and regression checks. |
| `/api/runs/:run_id/report` | `GET` | Export structured audit report (`application/json` or Markdown via `?format=md`). |
| `/api/runs/:run_id/approve-fix` | `POST` | Record human operator approval for local demo fix. |
| `/api/runs/:run_id/reject-fix` | `POST` | Record human operator rejection of proposed fix. |
| `/api/runs/:run_id/retry` | `POST` | Re-queue run (bounded: maximum 3 retries). |
| `/api/reset` | `POST` | Reset store to clean initial state. |

### Example 1: Launch a Run
```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "target_id": "Local training app (auth-service:v1.4.2)",
    "test_case": "input-validation",
    "scope_confirmed": true,
    "simulation_outcome": "complete"
  }'
```

### Example 2: Inspect Live Progress
```bash
curl http://localhost:3000/api/runs/RUN-1050
```

### Example 3: Export Compliance Audit Report
```bash
# JSON Format
curl http://localhost:3000/api/runs/RUN-1049/report

# Markdown Format
curl http://localhost:3000/api/runs/RUN-1049/report?format=md
```

### Example 4: Approve Fix for Local Demo
```bash
curl -X POST http://localhost:3000/api/runs/RUN-1050/approve-fix
```

---

## 🎬 Demo Walkthrough Paths

Trigger three distinct deterministic demo flows from the **"New Demo Run"** modal (<kbd>N</kbd>):

### Path 1: Successful Remediation Pass (`complete`)
1. Press <kbd>N</kbd>, select **Input validation check (CWE-89)**.
2. Select **Simulation Workflow Outcome:** `[PASS] Complete`.
3. Check **"I confirm scope authorization"** and click **Start Run**.
4. **Expected Outcome:** `scope_check` passes ➔ `red_agent` executes controlled probe & captures SQL error ➔ `sentinel_agent` verifies evidence (99% confidence) ➔ `fix_agent` synthesizes prepared statement diff & allowlisted `py_compile` test passes ➔ `auditor_agent` verifies 4/4 regression checks ➔ Status finishes as **COMPLETED**.

### Path 2: Sentinel Alert / Operator Review Required (`needs_review`)
1. Press <kbd>N</kbd>, select **Authentication check (CWE-287)**.
2. Select **Simulation Workflow Outcome:** `[ALERT] Needs Review`.
3. Click **Start Run**.
4. **Expected Outcome:** `scope_check` and `red_agent` complete ➔ `sentinel_agent` flags ambiguous reflection: marks stage `needs_review` ➔ **Pipeline halts immediately**. Fix Agent and Auditor remain `queued`. Demonstrates that code changes are never attempted without confirmed evidence!

### Path 3: Auditor Regression Failure (`failed`)
1. Press <kbd>N</kbd>, select **Path traversal check (CWE-22)**.
2. Select **Simulation Workflow Outcome:** `[FAIL] Regression Fail`.
3. Click **Start Run**.
4. **Expected Outcome:** Stages 1–4 complete ➔ `auditor_agent` runs regression suite: 1 check fails on secondary directory escape probe ➔ Reproducibility marked `REPRODUCIBLE — Secondary Bypass Detected` ➔ Status finishes as **FAILED** (demonstrating honest, independent verification).

---

## 🔄 Reset Procedure

To reset all run records and return the demo to its clean initial state:
- **Via API:**
  ```bash
  curl -X POST http://localhost:3000/api/reset
  ```
- **Via Browser Console:**
  ```javascript
  fetch('/api/reset', { method: 'POST' }).then(() => location.reload());
  ```
- **Via Keyboard:** Press <kbd>R</kbd> on the War Room screen to reset the current active simulation to Stage 1.

---

## 📊 Local Processing vs. Simulated Data Status

| Component | Status | Behavior in Prototype |
|:---|:---|:---|
| **Scope Controller** | **Real Local** | Real whitelist matching, reject logic, and scope validation. |
| **Workflow Coordinator** | **Real Local** | Real server-side state machine; strictly blocks execution on stage failures. |
| **Deduplication & Retries** | **Real Local** | Real duplicate request debouncing and bounded retry enforcement (max 3). |
| **Target Probing** | **Simulated Fixture** | Controlled mock probes; zero network packets sent to external internet hosts. |
| **Evidence Review** | **Real Local** | Real signature heuristic matching in Sentinel Agent. |
| **Remediation Synthesis** | **Isolated Module** | Synthesizes minimal diffs in memory; runs allowlisted test validation. |
| **Code Application** | **Disabled** | Strictly requires human approval; no automatic Git commits, PRs, or file writes. |
| **Regression Checks** | **Real Local** | Independent 4-point check matrix evaluation with pass/fail reporting. |
| **Audit Reporting** | **Real Local** | Dynamic JSON/Markdown report generator with automatic secret sanitization. |
