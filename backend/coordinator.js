// AEGIS-AGENT - Server-Side Workflow Coordinator
// Orchestrates: scope_check -> red_agent -> sentinel_agent -> fix_agent -> auditor_agent
// =========================================================================
// SAFETY & WORKFLOW RULES:
// - Failed or unconfirmed stages halt the pipeline and do NOT silently advance.
// - Sentinel only hands off confirmed findings to Fix Agent.
// - Fix Agent output requires explicit human approval; never auto-applied.
// - Auditor failure marks the run failed (never reports success when checks fail).
// =========================================================================

const { executeControlledTest, isAllowlistedTarget } = require('./redAgent');
const { reviewEvidence } = require('./sentinelAgent');
const { invokeFixAgent } = require('./fixAgentAdapter');
const { executeRegressionChecks } = require('./auditorAgent');

const STAGE_ORDER = [
  'scope_check',
  'red_agent',
  'sentinel_agent',
  'fix_agent',
  'auditor_agent'
];

// Deduplication cache: prevents accidental duplicate run submissions within 3 seconds
const recentSubmissions = new Map();

function checkDuplicateSubmission(target_id, test_case) {
  const key = `${target_id}::${test_case}`;
  const now = Date.now();
  const lastTime = recentSubmissions.get(key);
  if (lastTime && (now - lastTime) < 3000) {
    return true;
  }
  recentSubmissions.set(key, now);
  // Cleanup entries older than 10 seconds
  for (const [k, time] of recentSubmissions.entries()) {
    if (now - time > 10000) recentSubmissions.delete(k);
  }
  return false;
}

/**
 * Coordinate and execute a run step by step.
 * Updates the run record in place in the store.
 *
 * @param {Object} run - The run record object
 * @param {number} [stepDelayMs=1500] - Realtime delay per stage for UI observability
 */
async function coordinateRun(run, stepDelayMs = 1500) {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // =====================================================================
    // STAGE 1: SCOPE CHECK
    // =====================================================================
    run.current_stage = 'scope_check';
    run.stage_statuses['scope_check'].status = 'running';
    run.stage_statuses['scope_check'].started_at = new Date().toLocaleTimeString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Scope Check] Validating scope authorization and target whitelist.`);

    await wait(stepDelayMs);

    if (!run.scope_confirmed) {
      run.stage_statuses['scope_check'].status = 'rejected';
      run.stage_statuses['scope_check'].completed_at = new Date().toLocaleTimeString();
      run.status = 'rejected';
      run.error = 'Scope authorization not confirmed.';
      run.logs.push(`[${new Date().toLocaleTimeString()}] [Scope Check] [REJECTED] Explicit scope authorization was not confirmed.`);
      return;
    }

    if (!isAllowlistedTarget(run.target_id)) {
      run.stage_statuses['scope_check'].status = 'rejected';
      run.stage_statuses['scope_check'].completed_at = new Date().toLocaleTimeString();
      run.status = 'rejected';
      run.error = `Target '${run.target_id}' is not an authorized local demo fixture.`;
      run.logs.push(`[${new Date().toLocaleTimeString()}] [Scope Check] [REJECTED] Target '${run.target_id}' is outside authorized bounds.`);
      return;
    }

    run.stage_statuses['scope_check'].status = 'complete';
    run.stage_statuses['scope_check'].completed_at = new Date().toLocaleTimeString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Scope Check] [PASS] Scope verified. Target bounded to authorized local fixture.`);

    // =====================================================================
    // STAGE 2: RED AGENT (CONTROLLED LOCAL TEST)
    // =====================================================================
    run.current_stage = 'red_agent';
    run.stage_statuses['red_agent'].status = 'running';
    run.stage_statuses['red_agent'].started_at = new Date().toLocaleTimeString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Red Agent] Executing controlled non-destructive probe for '${run.test_case}'.`);

    await wait(stepDelayMs);

    const redResult = await executeControlledTest({
      target_id: run.target_id,
      test_case: run.test_case
    });

    if (redResult.status === 'rejected') {
      run.stage_statuses['red_agent'].status = 'rejected';
      run.stage_statuses['red_agent'].completed_at = new Date().toLocaleTimeString();
      run.status = 'rejected';
      run.error = redResult.error;
      run.logs.push(`[${new Date().toLocaleTimeString()}] [Red Agent] [REJECTED] ${redResult.message}`);
      return;
    }

    run.mock_results.finding = redResult.finding;
    run.stage_statuses['red_agent'].status = 'complete';
    run.stage_statuses['red_agent'].completed_at = new Date().toLocaleTimeString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Red Agent] [COMPLETE] Finding detected: ${redResult.finding.title} (${redResult.finding.cwe}). Evidence captured.`);

    // =====================================================================
    // STAGE 3: SENTINEL AGENT (EVIDENCE REVIEW)
    // =====================================================================
    run.current_stage = 'sentinel_agent';
    run.stage_statuses['sentinel_agent'].status = 'running';
    run.stage_statuses['sentinel_agent'].started_at = new Date().toLocaleTimeString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Sentinel Agent] Ingesting HTTP evidence and verifying vulnerability signatures.`);

    await wait(stepDelayMs);

    const sentinelResult = reviewEvidence({
      finding: run.mock_results.finding,
      test_case: run.test_case,
      forced_outcome: run.simulation_outcome
    });
    run.sentinel_review = sentinelResult;

    if (sentinelResult.decision === 'needs_review') {
      run.stage_statuses['sentinel_agent'].status = 'needs_review';
      run.stage_statuses['sentinel_agent'].completed_at = new Date().toLocaleTimeString();
      run.status = 'needs_review';
      run.logs.push(`[${new Date().toLocaleTimeString()}] [Sentinel Agent] [NEEDS_REVIEW] ${sentinelResult.rationale}`);
      run.logs.push(`[${new Date().toLocaleTimeString()}] [Coordinator] Workflow paused at Sentinel stage. Fix Agent will NOT execute until human operator triages evidence.`);
      // Fix Agent and Auditor remain queued
      run.stage_statuses['fix_agent'].status = 'queued';
      run.stage_statuses['auditor_agent'].status = 'queued';
      return;
    }

    if (sentinelResult.decision === 'not_confirmed') {
      run.stage_statuses['sentinel_agent'].status = 'failed';
      run.stage_statuses['sentinel_agent'].completed_at = new Date().toLocaleTimeString();
      run.status = 'failed';
      run.error = sentinelResult.rationale;
      run.logs.push(`[${new Date().toLocaleTimeString()}] [Sentinel Agent] [NOT_CONFIRMED] Evidence rejected. No exploit signature detected.`);
      run.stage_statuses['fix_agent'].status = 'queued';
      run.stage_statuses['auditor_agent'].status = 'queued';
      return;
    }

    run.stage_statuses['sentinel_agent'].status = 'complete';
    run.stage_statuses['sentinel_agent'].completed_at = new Date().toLocaleTimeString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Sentinel Agent] [CONFIRMED] Vulnerability signature verified with ${Math.round(sentinelResult.confidence * 100)}% confidence.`);

    // =====================================================================
    // STAGE 4: FIX AGENT INTEGRATION (COLLABORATOR MODULE / ADAPTER)
    // =====================================================================
    run.current_stage = 'fix_agent';
    run.stage_statuses['fix_agent'].status = 'running';
    run.stage_statuses['fix_agent'].started_at = new Date().toLocaleTimeString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Fix Agent] Synthesizing defensive remediation for confirmed finding.`);

    await wait(stepDelayMs);

    // Call Fix Agent through the agreed isolated adapter
    const fixResult = await invokeFixAgent({
      run_id: run.run_id,
      finding: run.mock_results.finding,
      workspace_id: run.target_id,
      status: 'confirmed'
    });

    run.mock_results.proposed_fix = fixResult;
    run.approval_state = 'PENDING_HUMAN_APPROVAL';

    if (fixResult.status === 'FAILED') {
      run.stage_statuses['fix_agent'].status = 'failed';
      run.stage_statuses['fix_agent'].completed_at = new Date().toLocaleTimeString();
      run.status = 'failed';
      run.error = fixResult.remediation_summary;
      run.logs.push(`[${new Date().toLocaleTimeString()}] [Fix Agent] [FAILED] ${fixResult.remediation_summary}`);
      run.stage_statuses['auditor_agent'].status = 'queued';
      return;
    }

    run.stage_statuses['fix_agent'].status = 'complete';
    run.stage_statuses['fix_agent'].completed_at = new Date().toLocaleTimeString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Fix Agent] [PROPOSED] Remediation diff generated for ${fixResult.file_path}. Review state: PENDING_HUMAN_APPROVAL.`);

    // =====================================================================
    // STAGE 5: AUDITOR AGENT (INDEPENDENT REGRESSION CHECK)
    // =====================================================================
    run.current_stage = 'auditor_agent';
    run.stage_statuses['auditor_agent'].status = 'running';
    run.stage_statuses['auditor_agent'].started_at = new Date().toLocaleTimeString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Auditor Agent] Executing independent regression matrix against demo fixture.`);

    await wait(stepDelayMs);

    const auditorResult = executeRegressionChecks({
      test_case: run.test_case,
      forced_outcome: run.simulation_outcome,
      fix_available: true
    });
    run.mock_results.regression = auditorResult;

    if (auditorResult.overall_status === 'Vulnerable' || run.simulation_outcome === 'failed') {
      run.stage_statuses['auditor_agent'].status = 'failed';
      run.stage_statuses['auditor_agent'].completed_at = new Date().toLocaleTimeString();
      run.status = 'failed';
      run.logs.push(`[${new Date().toLocaleTimeString()}] [Auditor Agent] [FAILED] Regression check failed: Secondary bypass detected. Vulnerability remains reproducible.`);
      return;
    }

    run.stage_statuses['auditor_agent'].status = 'complete';
    run.stage_statuses['auditor_agent'].completed_at = new Date().toLocaleTimeString();
    run.status = 'complete';
    run.completed_at = new Date().toISOString();
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Auditor Agent] [VERIFIED] All ${auditorResult.checks_total} checks passed. Remediated and verified.`);
    run.logs.push(`[${new Date().toLocaleTimeString()}] [Coordinator] Workflow complete. Audit report available for export.`);

  } catch (err) {
    console.error(`[Coordinator] Unexpected failure during run ${run.run_id}:`, err);
    run.status = 'failed';
    run.error = err.message || 'Coordinator execution exception';
    run.logs.push(`[${new Date().toLocaleTimeString()}] [System Error] ${err.message}`);
  }
}

module.exports = {
  coordinateRun,
  checkDuplicateSubmission,
  STAGE_ORDER
};

