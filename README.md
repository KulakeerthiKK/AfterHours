# AEGIS-AGENT — Multi-Agent Security War Room Prototype

[![Theme](https://img.shields.io/badge/theme-red%20%26%20black%20stealth-red.svg)](#)
[![Prototype Status](https://img.shields.io/badge/status-multi--agent--prototype-crimson.svg)](#)
[![Authorized Scope](https://img.shields.io/badge/scope-local--authorized--only-blue.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-emerald.svg)](#)

> **Persistent System Notice:**  
> **Front-end demo — no real scans or code changes.**  
> Prototype for explicitly authorized local testing only. Arbitrary public scanning, credential theft, and automated repository modifications are strictly disabled.

---

## 🎯 Overview & Concept

**AEGIS-AGENT** is a cybersecurity war room prototype designed for authorized local applications. It implements a multi-agent security test workflow with mandatory human-in-the-loop review, decomposing review into specialized, auditable roles:

1. **Scope Controller (`scope_check`)**: Validates target whitelist authorization and explicit user scope consent.
2. **Red Agent (`red_agent`)**: Executes predefined, non-destructive test probes against the authorized local fixture.
3. **Sentinel Agent (`sentinel_agent`)**: Ingests HTTP evidence and verifies exploit signatures to confirm findings before any fix can be proposed.
4. **Fix Agent (`fix_agent`)**: Synthesizes defensive remediation code diffs via an isolated collaborator adapter interface (human approval required; never auto-applied).
5. **Auditor Agent (`auditor_agent`)**: Runs independent regression test matrices to verify whether the vulnerability is remediated or remains reproducible.

---

## ⚡ Quick Start / Localhost Link

Access the live interface at:

👉 **[http://localhost:3000](http://localhost:3000)**

### Start Server:
```powershell
npm start
# OR
node server.js
```
The server runs on native Node.js with **zero external npm dependencies**.

---

## 🔒 Safety Scope & Boundaries

This prototype is built exclusively for authorized local testing:
- **Allowed Targets:** Strictly bounded to `Local training app (auth-service:v1.4.2)`, `Local training app (session-gateway:v1.4.2)`, `Local training app (report-service:v1.4.2)`, `local-demo-target`, or `http://localhost:8080`.
- **Blocked:** Arbitrary URLs, public hostnames, third-party internet endpoints, and unknown test parameters are rejected with HTTP 400.
- **Non-Destructive:** Test cases inject only bounded syntax and header probes against the demo fixture; no destructive actions, persistence, or data exfiltration.
- **No Automatic Code Changes:** Candidate diffs are held in `PENDING_HUMAN_APPROVAL` status. They are never committed, merged, or pushed to any repository without explicit operator action.

---

## 🤝 Collaborator Fix Agent Interface Contract

The Fix Agent module is isolated behind an adapter located in [`backend/fixAgentAdapter.js`](file:///c:/Users/dell/Desktop/AfterHours/backend/fixAgentAdapter.js). This ensures team boundaries are preserved.

### Input Contract (Sent to Fix Agent):
```typescript
interface FixAgentInput {
  finding: {
    id: string;               // e.g. "VULN-2026-0814"
    title: string;            // Finding title
    cwe: string;              // e.g. "CWE-89"
    severity: string;         // "HIGH" | "CRITICAL" | "MEDIUM"
    affected_component: string;
    test_case: string;        // "input-validation" | "authentication-check" | "path-traversal" | "command-injection"
    short_explanation: string;
    evidence: {
      http_request?: string;
      http_response?: string;
      captured_trace?: string;
      call_stack?: string;
    };
  };
  workspace_id: string;       // Authorized local fixture identifier (e.g. "auth-service:v1.4.2")
}
```

### Result Contract (Returned by Fix Agent):
```typescript
interface FixAgentResult {
  run_id: string;             // Associated run identifier (e.g. "RUN-1050")
  finding_id: string;         // Finding identifier (e.g. "VULN-2026-0814")
  status: 'proposed' | 'needs_review' | 'failed' | 'rejected';
  summary: string;            // Concise remediation strategy
  rationale: string;          // Technical defensive explanation
  changed_files: string[];    // Array of sanitized relative file paths (max 1-2 files)
  unified_diff: string;       // Unified diff representation
  diff_stats: { additions: number; deletions: number };
  validation_status: 'passed' | 'failed' | 'not_run';
  configured_test_command: string | null; // e.g. "python -m py_compile backend/services/auth_service.py"
  test_output: string | null; // Concise output from allowlisted test execution
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

### Implementation Files:
- Module: [`backend/fixAgent.js`](file:///c:/Users/dell/Desktop/AfterHours/backend/fixAgent.js)
- Adapter: [`backend/fixAgentAdapter.js`](file:///c:/Users/dell/Desktop/AfterHours/backend/fixAgentAdapter.js)


---

## 🎬 Demo Walkthrough Paths

You can trigger three distinct deterministic demo flows from the **"New Demo Run"** modal:

### Path 1: Successful Remediation Pass (`complete`)
1. Click **"New Demo Run"** (or press <kbd>N</kbd>).
2. Select **Input validation check (CWE-89)**.
3. Select **Simulation Workflow Outcome:** `[PASS] Complete`.
4. Check **"I confirm scope authorization"** and click **Start Run**.
5. **Expected Outcome:**
   - `scope_check` passes.
   - `red_agent` executes controlled probe and captures raw SQL syntax error evidence.
   - `sentinel_agent` verifies evidence signature (99% confidence) and passes finding to Fix Agent.
   - `fix_agent` generates parameterized query diff; status sets to `Pending Operator Approval`.
   - `auditor_agent` runs 4 regression checks: all 4 pass (`REMEDIATED — Not Reproducible`).
   - Run finishes with status `COMPLETED`.

### Path 2: Sentinel Alert / Operator Review Required (`needs_review`)
1. Click **"New Demo Run"** (or press <kbd>N</kbd>).
2. Select **Authentication check (CWE-287)**.
3. Select **Simulation Workflow Outcome:** `[ALERT] Needs Review`.
4. Check scope authorization and click **Start Run**.
5. **Expected Outcome:**
   - `scope_check` and `red_agent` complete.
   - `sentinel_agent` flags ambiguous reflection: marks stage `needs_review`.
   - **Pipeline halts immediately.** Fix Agent and Auditor remain `queued`.
   - Run finishes with status `NEEDS REVIEW` requiring operator review before any fix is generated.

### Path 3: Auditor Regression Failure (`failed`)
1. Click **"New Demo Run"** (or press <kbd>N</kbd>).
2. Select **Path traversal check (CWE-22)**.
3. Select **Simulation Workflow Outcome:** `[FAIL] Regression Fail`.
4. Check scope authorization and click **Start Run**.
5. **Expected Outcome:**
   - Stages 1–4 complete.
   - `auditor_agent` runs regression suite: 1 check fails on secondary directory escape probe.
   - Overall reproducibility is marked `REPRODUCIBLE — Secondary Bypass Detected`.
   - Stage and run finish with status `FAILED` (clearly distinguishing failure from remediation success).

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

## 🔌 API Endpoints Summary

| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/runs` | `GET` | List all recent and historical runs. |
| `/api/runs` | `POST` | Create a new run (requires `target_id`, `test_case`, `scope_confirmed: true`). |
| `/api/runs/:run_id` | `GET` | Retrieve live run state, stage statuses, evidence, fix proposal, and regression checks. |
| `/api/runs/:run_id/report` | `GET` | Export structured audit report (`application/json` or Markdown via `?format=md`). |
| `/api/runs/:run_id/approve-fix` | `POST` | Record human operator approval for local demo fix. |
| `/api/runs/:run_id/reject-fix` | `POST` | Record human operator rejection of proposed fix. |
| `/api/runs/:run_id/retry` | `POST` | Re-queue run (bounded: maximum 3 retries). |
| `/api/reset` | `POST` | Reset store to clean initial state. |

---

## 📊 Local Processing vs. Simulated Data Status

| Component | Status | Behavior in Prototype |
|:---|:---|:---|
| **Scope Controller** | **Real Local** | Real whitelist matching, reject logic, and scope validation. |
| **Workflow Coordinator** | **Real Local** | Real server-side state machine; strictly blocks execution on stage failures. |
| **Deduplication & Retries** | **Real Local** | Real duplicate request debouncing and bounded retry enforcement (max 3). |
| **Target Probing** | **Simulated** | Controlled mock probes; zero network packets sent to external internet hosts. |
| **Evidence Review** | **Real Local** | Real signature heuristic matching in Sentinel Agent. |
| **Remediation Synthesis** | **Adapter Mock** | Isolated adapter awaiting collaborator Fix Agent; deterministic diffs. |
| **Code Application** | **Disabled** | Strictly requires human approval; no automatic Git commits, PRs, or file writes. |
| **Regression Checks** | **Real Local** | Independent 4-point check matrix evaluation with pass/fail reporting. |
| **Audit Reporting** | **Real Local** | Dynamic JSON/Markdown report generator with automatic secret sanitization. |
