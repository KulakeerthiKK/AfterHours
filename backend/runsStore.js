// AEGIS-AGENT In-Memory Runs Store
// Integrates with Workflow Coordinator, Red Agent, Sentinel, Fix Agent Adapter, and Auditor
// =========================================================================

const { coordinateRun, checkDuplicateSubmission, STAGE_ORDER } = require('./coordinator');
const { PREDEFINED_TEST_CASES, isAllowlistedTarget, normalizeTestCase } = require('./redAgent');
const { generateAuditReport } = require('./reportGenerator');

class RunsStore {
  constructor() {
    this.runs = new Map();
    this.counter = 1050;

    // Seed initial historical demo runs
    this.seedInitialRuns();
  }

  seedInitialRuns() {
    this.runs.clear();

    const seeds = [
      {
        run_id: 'RUN-1049',
        test_case: 'input-validation',
        target_id: 'Local training app (auth-service:v1.4.2)',
        status: 'complete',
        approval_state: 'APPROVED_FOR_DEMO',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        run_id: 'RUN-1048',
        test_case: 'authentication-check',
        target_id: 'Local training app (session-gateway:v1.4.2)',
        status: 'needs_review',
        approval_state: 'PENDING_HUMAN_APPROVAL',
        created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString()
      },
      {
        run_id: 'RUN-1047',
        test_case: 'path-traversal',
        target_id: 'Local training app (report-service:v1.4.2)',
        status: 'failed',
        approval_state: 'PENDING_HUMAN_APPROVAL',
        created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString()
      }
    ];

    seeds.forEach(seed => {
      const testSpec = PREDEFINED_TEST_CASES[seed.test_case] || PREDEFINED_TEST_CASES['input-validation'];
      const stages = {};

      STAGE_ORDER.forEach(stg => {
        let stgStatus = 'complete';
        if (seed.status === 'needs_review') {
          if (stg === 'sentinel_agent') stgStatus = 'needs_review';
          else if (stg === 'fix_agent' || stg === 'auditor_agent') stgStatus = 'queued';
        } else if (seed.status === 'failed') {
          if (stg === 'auditor_agent') stgStatus = 'failed';
        }

        stages[stg] = {
          stage_id: stg,
          agent: stg === 'scope_check' ? 'Scope Controller' :
                 stg === 'red_agent' ? 'Red Agent' :
                 stg === 'sentinel_agent' ? 'Sentinel Agent' :
                 stg === 'fix_agent' ? 'Fix Agent' : 'Auditor Agent',
          status: stgStatus,
          started_at: 'Done',
          completed_at: 'Done',
          summary: `Stage ${stg} execution complete.`
        };
      });

      this.runs.set(seed.run_id, {
        run_id: seed.run_id,
        target_id: seed.target_id,
        test_case: seed.test_case,
        test_name: testSpec.title,
        status: seed.status,
        current_stage: seed.status === 'needs_review' ? 'sentinel_agent' : 'auditor_agent',
        simulation_outcome: seed.status,
        scope_confirmed: true,
        approval_state: seed.approval_state,
        retry_count: 0,
        created_at: seed.created_at,
        stage_order: [...STAGE_ORDER],
        stage_statuses: stages,
        mock_results: {
          finding: {
            id: `VULN-2026-${seed.run_id.slice(-4)}`,
            title: testSpec.title,
            cwe: testSpec.cwe,
            severity: testSpec.severity,
            affected_component: testSpec.affected_component,
            test_case: seed.test_case,
            short_explanation: testSpec.short_explanation,
            payload_description: testSpec.payload_description,
            evidence: testSpec.evidence
          },
          proposed_fix: seed.status !== 'needs_review' ? {
            status: 'PROPOSED',
            id: `FIX-${seed.run_id.slice(-4)}`,
            remediation_summary: 'Parameterize inputs and enforce cryptographic signatures.',
            file_path: 'backend/services/auth_service.py',
            diff_stats: { additions: 6, deletions: 4 },
            candidate_diff: '@@ -42,4 +42,6 @@',
            validation_status: 'SYNTACTICALLY_VALID',
            review_state: seed.approval_state,
            applied: false,
            collaborator_module: 'ADAPTER_SIMULATION'
          } : null,
          regression: seed.status !== 'needs_review' ? {
            overall_status: seed.status === 'failed' ? 'Vulnerable' : 'Remediated',
            is_reproducible: seed.status === 'failed',
            reproducibility_label: seed.status === 'failed' ? 'REPRODUCIBLE — Secondary Bypass Detected' : 'REMEDIATED — Not Reproducible',
            checks_passed: seed.status === 'failed' ? 3 : 4,
            checks_total: 4,
            summary: seed.status === 'failed' ? 'Regression check failed on secondary bypass.' : 'All 4 verification checks passed.'
          } : null
        },
        logs: [
          `[System] Initialized seeded run record ${seed.run_id}`,
          `[Auditor Agent] Workflow outcome: ${seed.status}`
        ],
        is_simulated: true,
        notice: 'Front-end demo — no real scans or code changes'
      });
    });
  }

  validateNewRunRequest(body) {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Request body must be a JSON object' };
    }

    const { target_id, test_case, scope_confirmed } = body;

    // Check scope confirmation
    if (scope_confirmed !== true && scope_confirmed !== 'true') {
      return {
        valid: false,
        error: 'Scope confirmation required',
        message: 'You must confirm scope authorization (scope_confirmed: true) before initiating a run.'
      };
    }

    // Check target allowlist
    if (!target_id || !isAllowlistedTarget(target_id)) {
      return {
        valid: false,
        error: 'Unauthorized target',
        message: `Target '${target_id || ''}' is not permitted. Please specify an authorized target fixture or staging environment.`
      };
    }

    // Check test case validity (with alias normalization)
    const normalizedCase = normalizeTestCase(test_case);
    if (test_case && !PREDEFINED_TEST_CASES[normalizedCase]) {
      return {
        valid: false,
        error: 'Unsupported test case',
        message: `Test case '${test_case}' is not supported. Supported test cases: ${Object.keys(PREDEFINED_TEST_CASES).join(', ')}`
      };
    }

    // Deduplication check
    if (checkDuplicateSubmission(target_id, normalizedCase)) {
      return {
        valid: false,
        error: 'Duplicate run suppressed',
        message: 'A run with the same target and test case was initiated moments ago. Please wait a moment before launching another run.'
      };
    }

    return { valid: true };
  }

  createRun({ target_id, test_case, scope_confirmed, simulation_outcome }) {
    const run_id = `RUN-${this.counter++}`;
    const testCaseKey = normalizeTestCase(test_case);
    const testSpec = PREDEFINED_TEST_CASES[testCaseKey] || PREDEFINED_TEST_CASES['input-validation'];

    const outcome = simulation_outcome === 'needs_review' || simulation_outcome === 'failed'
      ? simulation_outcome
      : 'complete';

    // Format target display nicely if custom staging was submitted
    const displayTarget = (target_id && (target_id.startsWith('http://') || target_id.startsWith('https://')))
      ? `${target_id} [Sandbox SEC-LOCAL-8080]`
      : target_id;

    const stage_statuses = {};
    STAGE_ORDER.forEach((stageId, idx) => {
      stage_statuses[stageId] = {
        stage_id: stageId,
        agent: stageId === 'scope_check' ? 'Scope Controller' :
               stageId === 'red_agent' ? 'Red Agent' :
               stageId === 'sentinel_agent' ? 'Sentinel Agent' :
               stageId === 'fix_agent' ? 'Fix Agent' : 'Auditor Agent',
        status: idx === 0 ? 'running' : 'queued',
        summary: `Executing ${stageId}...`,
        started_at: idx === 0 ? new Date().toLocaleTimeString() : null,
        completed_at: null
      };
    });

    const now = Date.now();
    const runObj = {
      run_id,
      target_id: displayTarget || target_id,
      test_case: testCaseKey,
      test_name: testSpec.title,
      status: 'running',
      current_stage: 'scope_check',
      simulation_outcome: outcome,
      scope_confirmed: true,
      approval_state: 'PENDING_HUMAN_APPROVAL',
      retry_count: 0,
      created_at: new Date(now).toISOString(),
      created_timestamp: now,
      stage_order: [...STAGE_ORDER],
      stage_statuses,
      mock_results: {
        finding: null,
        proposed_fix: null,
        regression: null,
        regression_test_harness: null
      },
      target_talkback_events: [],
      regression_test_harness: null,
      logs: [
        `[${new Date().toLocaleTimeString()}] [System] Scope authorization confirmed for ${target_id}.`,
        `[${new Date().toLocaleTimeString()}] [Coordinator] Launching 5-stage workflow for test probe: ${testSpec.title}.`
      ],
      is_simulated: true,
      notice: 'Front-end demo — no real scans or code changes'
    };

    this.runs.set(run_id, runObj);

    // Launch coordinator asynchronously in the background
    coordinateRun(runObj).catch(err => {
      console.error(`[RunsStore] Coordinator error for run ${run_id}:`, err);
    });

    return runObj;
  }

  getRun(run_id) {
    if (!run_id) return null;
    return this.runs.get(run_id.trim().toUpperCase()) || null;
  }

  getAuditReport(run_id) {
    const run = this.getRun(run_id);
    if (!run) return null;
    return generateAuditReport(run);
  }

  approveFix(run_id) {
    const run = this.getRun(run_id);
    if (!run) return null;
    run.approval_state = 'APPROVED_FOR_DEMO';
    if (run.mock_results.proposed_fix) {
      run.mock_results.proposed_fix.review_state = 'APPROVED_FOR_DEMO';
    }
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Operator] Fix approved for local demonstration. (No repository code modified)`);
    return run;
  }

  rejectFix(run_id) {
    const run = this.getRun(run_id);
    if (!run) return null;
    run.approval_state = 'REJECTED';
    if (run.mock_results.proposed_fix) {
      run.mock_results.proposed_fix.review_state = 'REJECTED';
    }
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Operator] Fix proposal rejected by human reviewer.`);
    return run;
  }

  retryRun(run_id) {
    const run = this.getRun(run_id);
    if (!run) return null;

    if (run.retry_count >= 3) {
      return { error: 'Max retries exceeded (limit: 3 retries per run).' };
    }

    run.retry_count++;
    run.status = 'running';
    run.current_stage = 'scope_check';
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Coordinator] Initiating retry attempt ${run.retry_count}/3.`);

    // Reset stages
    STAGE_ORDER.forEach((stageId, idx) => {
      run.stage_statuses[stageId].status = idx === 0 ? 'running' : 'queued';
      run.stage_statuses[stageId].completed_at = null;
    });

    coordinateRun(run).catch(err => {
      console.error(`[RunsStore] Retry error for run ${run_id}:`, err);
    });

    return run;
  }

  listRuns() {
    const list = Array.from(this.runs.values()).map(r => ({
      run_id: r.run_id,
      target_id: r.target_id,
      test_case: r.test_case,
      test_name: r.test_name,
      status: r.status,
      current_stage: r.current_stage,
      approval_state: r.approval_state,
      created_at: r.created_at,
      is_simulated: r.is_simulated
    }));

    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  resetStore() {
    this.seedInitialRuns();
    return { success: true, message: 'Runs store reset to clean initial demo state' };
  }
}

const runsStore = new RunsStore();

module.exports = runsStore;
