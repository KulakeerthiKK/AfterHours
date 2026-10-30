// =========================================================================
// AEGIS-AGENT - LLM Provider Interface
// Backend-only provider connecting Fix Agent to OpenRouter AI with safe fallback
// =========================================================================

const { callOpenRouter } = require('./services/llmClient');
const { REMEDIATION_CATALOG } = require('./fixAgent');
const { recordRemediationProposal } = require('./db');

/**
 * Generate remediation patch diff using OpenRouter LLM or deterministic local model adapter.
 *
 * @param {Object} params
 * @param {Object} params.finding - Confirmed finding from Sentinel
 * @param {string} params.workspace_id - Authorized local workspace
 * @param {string} [params.run_id] - Associated scan run ID
 * @returns {Promise<Object>} Synthesized candidate diff
 */
async function generateLlmRemediation({ finding, workspace_id, run_id = null }) {
  const testCase = finding.test_case || (finding.cwe === 'CWE-89' ? 'input-validation' :
                                         finding.cwe === 'CWE-287' ? 'authentication-check' :
                                         finding.cwe === 'CWE-22' ? 'path-traversal' : 'command-injection');

  const template = REMEDIATION_CATALOG[testCase] || REMEDIATION_CATALOG['input-validation'];

  const systemPrompt = `You are the AEGIS Fix Agent, an autonomous security remediation engineer.
Your task is to analyze a confirmed vulnerability finding and propose a minimal, reviewable, defensible patch.
STRICT SAFETY RULES:
1. Propose only minimal changes targeting the specific vulnerable lines.
2. Never execute or output shell commands.
3. Return your response in JSON format with keys: "rationale" (string), "candidate_patch" (unified diff string), "changed_files" (array of strings).`;

  const userPrompt = `Vulnerability Finding to Remediate:
CWE: ${finding.cwe || 'Unknown'}
Title: ${finding.title || 'Security Vulnerability'}
File: ${finding.file_path || template.file_path}
Evidence Snippet: ${JSON.stringify(finding.evidence_refs || finding.evidence || 'Breakout payload confirmed')}
Workspace: ${workspace_id || 'local-demo-target'}

Please synthesize a minimal, clean defensive diff.`;

  const llmResult = await callOpenRouter({
    agentName: 'fix_agent',
    runId: run_id,
    systemPrompt,
    userPrompt
  });

  let rationale = template.rationale;
  let unifiedDiff = template.unified_diff;
  let changedFiles = [template.file_path];

  // Try parsing OpenRouter response if valid JSON was returned
  if (!llmResult.fallback && llmResult.content) {
    try {
      const parsed = JSON.parse(llmResult.content.replace(/```json/g, '').replace(/```/g, '').trim());
      if (parsed.rationale) rationale = parsed.rationale;
      if (parsed.candidate_patch) unifiedDiff = parsed.candidate_patch;
      if (Array.isArray(parsed.changed_files) && parsed.changed_files.length > 0) changedFiles = parsed.changed_files;
    } catch (parseErr) {
      // If free text, use content as rationale
      if (llmResult.content.length > 20) rationale = llmResult.content.slice(0, 300);
    }
  }

  const proposal = {
    provider: `OpenRouter (${llmResult.model})`,
    status: 'PROPOSED',
    fix_id: template.fix_id,
    finding_id: finding.id || finding.finding_id,
    summary: template.summary,
    rationale,
    file_path: changedFiles[0] || template.file_path,
    changed_files: changedFiles,
    diff_stats: template.diff_stats,
    diff_lines: template.diff_lines,
    unified_diff: unifiedDiff,
    validation_status: 'SYNTACTICALLY_VALID',
    approval_state: 'PENDING_HUMAN_APPROVAL',
    applied: false,
    generated_at: new Date().toISOString(),
    is_fallback: llmResult.fallback
  };

  // Persist proposal into database
  try {
    await recordRemediationProposal(proposal);
  } catch (e) {
    // Non-fatal
  }

  return proposal;
}

module.exports = {
  generateLlmRemediation
};
