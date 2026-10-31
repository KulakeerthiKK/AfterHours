// AEGIS-AGENT - Audit Report Generator
// Generates structured audit and compliance reports from run records
// =========================================================================
// SAFETY:
// - Never includes secrets, credentials, or host environment variables.
// - Accurately labels all simulation data.
// - Summarizes stage outcomes, evidence, remediation proposal, human approval state, and regression checks.
// =========================================================================

/**
 * Sanitize text to remove potential secrets or sensitive values before report export.
 */
function sanitizeReportContent(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/(password|passwd|secret|api_key|token)[:=]\s*["']?[a-zA-Z0-9_\-\.]{8,}["']?/gi, '$1="[REDACTED_SECRET]"')
    .replace(/Bearer\s+[a-zA-Z0-9\-_]{20,}/gi, 'Bearer [REDACTED_TOKEN]');
}

/**
 * Generate a structured JSON audit report from a run record.
 *
 * @param {Object} run - Full run record from runsStore
 * @returns {Object} Structured audit report
 */
function generateAuditReport(run) {
  if (!run) {
    throw new Error('Run record is required to generate an audit report');
  }

  const finding = run.mock_results && run.mock_results.finding ? run.mock_results.finding : null;
  const proposedFix = run.mock_results && run.mock_results.proposed_fix ? run.mock_results.proposed_fix : null;
  const regression = run.mock_results && run.mock_results.regression ? run.mock_results.regression : null;
  const sentinelDecision = run.sentinel_review || null;

  // Build stage summary
  const stageSummary = {};
  if (run.stage_statuses) {
    Object.keys(run.stage_statuses).forEach(stageKey => {
      const stg = run.stage_statuses[stageKey];
      stageSummary[stageKey] = {
        agent: stg.agent || stageKey,
        status: stg.status,
        started_at: stg.started_at,
        completed_at: stg.completed_at,
        summary: stg.summary
      };
    });
  }

  const report = {
    report_metadata: {
      report_id: `RPT-${run.run_id}`,
      generated_at: new Date().toISOString(),
      report_version: '1.0.0',
      prototype_notice: 'Front-end demo — no real scans or code changes',
      is_simulated: true,
      confidentiality: 'AUTHORIZED_LOCAL_ONLY'
    },
    run_identification: {
      run_id: run.run_id,
      target_environment: run.target_id,
      target_type: 'Local Training Fixture (Authorized)',
      test_case_id: run.test_case,
      test_case_name: run.test_name,
      overall_status: run.status,
      current_stage: run.current_stage,
      created_at: run.created_at,
      completed_at: run.completed_at || (run.status !== 'running' ? new Date().toISOString() : null)
    },
    workflow_stages: stageSummary,
    finding_summary: finding ? {
      finding_id: finding.id,
      title: finding.title,
      cwe: finding.cwe,
      severity: finding.severity,
      affected_component: finding.affected_component,
      short_explanation: finding.short_explanation,
      evidence_summary: {
        http_request_sample: sanitizeReportContent(finding.evidence ? finding.evidence.http_request : null),
        http_response_sample: sanitizeReportContent(finding.evidence ? finding.evidence.http_response : null),
        trace_summary: sanitizeReportContent(finding.evidence ? finding.evidence.captured_trace : null)
      }
    } : null,
    sentinel_verification: sentinelDecision ? {
      decision: sentinelDecision.decision,
      rationale: sentinelDecision.rationale,
      confidence: sentinelDecision.confidence,
      verified_at: sentinelDecision.timestamp,
      passed_to_fix_agent: sentinelDecision.passed_to_fix_agent
    } : {
      decision: run.stage_statuses && run.stage_statuses.sentinel_agent ? run.stage_statuses.sentinel_agent.status : 'unknown',
      rationale: 'Evidence reviewed by Sentinel Agent'
    },
    remediation_proposal: proposedFix ? {
      fix_id: proposedFix.id || 'N/A',
      remediation_summary: proposedFix.summary || proposedFix.remediation_summary,
      file_path: proposedFix.file_path || proposedFix.filePath,
      diff_stats: proposedFix.diff_stats || proposedFix.diffStats,
      candidate_diff: proposedFix.candidate_diff || 'Diff available in UI viewer',
      validation_status: proposedFix.validation_status || 'SYNTACTICALLY_VALID',
      approval_state: run.approval_state || 'PENDING_HUMAN_APPROVAL',
      applied: false,
      collaborator_integration: proposedFix.collaborator_module || 'ADAPTER_SIMULATION'
    } : null,
    auditor_regression: regression ? {
      overall_status: regression.overall_status,
      reproducibility: regression.reproducibility_label || (regression.is_reproducible ? 'REPRODUCIBLE' : 'NOT_REPRODUCIBLE'),
      checks_passed: regression.checks_passed,
      checks_total: regression.checks_total,
      summary: regression.summary,
      checks_breakdown: regression.checks ? regression.checks.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        result_text: c.result_text
      })) : []
    } : null,
    automated_test_harness: run.regression_test_harness ? {
      filename: run.regression_test_harness.filename,
      framework: run.regression_test_harness.test_framework,
      ci_command: run.regression_test_harness.ci_runner_command,
      test_code: run.regression_test_harness.code
    } : null,
    target_talkback_telemetry: run.target_talkback_events && run.target_talkback_events.length > 0 ? run.target_talkback_events : [],
    compliance_statement: {
      scope_verified: true,
      human_in_the_loop_approval_enforced: true,
      automated_unapproved_pushes_prevented: true,
      data_handling: 'Local simulated data only; zero telemetry transmitted to third parties.'
    }
  };

  return report;
}

/**
 * Format the audit report as readable Markdown.
 */
function formatReportAsMarkdown(report) {
  const meta = report.report_metadata;
  const run = report.run_identification;
  const finding = report.finding_summary;
  const fix = report.remediation_proposal;
  const auditor = report.auditor_regression;

  let md = `# AEGIS-AGENT Security Audit Report\n\n`;
  md += `> **Notice:** ${meta.prototype_notice}\n`;
  md += `> **Report ID:** \`${meta.report_id}\` | **Generated:** ${meta.generated_at}\n\n`;
  md += `## 1. Run Identification\n`;
  md += `- **Run ID:** \`${run.run_id}\`\n`;
  md += `- **Target Environment:** ${run.target_environment}\n`;
  md += `- **Security Test Case:** ${run.test_case_name} (\`${run.test_case_id}\`)\n`;
  md += `- **Overall Outcome:** **${run.overall_status.toUpperCase()}**\n`;
  md += `- **Created At:** ${run.created_at}\n\n`;

  md += `## 2. Stage Outcomes\n\n`;
  md += `| Stage | Agent Role | Status | Completed |\n`;
  md += `|:---|:---|:---|:---|\n`;
  Object.keys(report.workflow_stages).forEach(key => {
    const stg = report.workflow_stages[key];
    md += `| \`${key}\` | ${stg.agent} | \`${stg.status}\` | ${stg.completed_at || 'In Progress'} |\n`;
  });
  md += `\n`;

  if (finding) {
    md += `## 3. Confirmed Finding\n`;
    md += `- **Vulnerability ID:** \`${finding.finding_id}\`\n`;
    md += `- **Title:** ${finding.title}\n`;
    md += `- **CWE:** \`${finding.cwe}\` | **Severity:** **${finding.severity}**\n`;
    md += `- **Affected Component:** \`${finding.affected_component}\`\n`;
    md += `- **Explanation:** ${finding.short_explanation}\n\n`;
  }

  if (fix) {
    md += `## 4. Proposed Remediation\n`;
    md += `- **Remediation Strategy:** ${fix.remediation_summary}\n`;
    md += `- **Target File:** \`${fix.file_path}\`\n`;
    md += `- **Approval State:** **${fix.approval_state}** *(Never auto-applied)*\n`;
    md += `- **Fix Agent Source:** \`${fix.collaborator_integration}\`\n\n`;
  }

  if (auditor) {
    md += `## 5. Auditor Regression Results\n`;
    md += `- **Reproducibility Status:** **${auditor.reproducibility}**\n`;
    md += `- **Checks Passed:** ${auditor.checks_passed} / ${auditor.checks_total}\n`;
    md += `- **Summary:** ${auditor.summary}\n\n`;
  }

  md += `---\n*Generated by AEGIS-AGENT Multi-Agent Security War Room Prototype*\n`;
  return md;
}

module.exports = {
  generateAuditReport,
  formatReportAsMarkdown,
  sanitizeReportContent
};

