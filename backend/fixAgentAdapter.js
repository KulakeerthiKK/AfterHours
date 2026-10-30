// AEGIS-AGENT - Fix Agent Integration Adapter
// Bridges the Workflow Coordinator with the Fix Agent Remediation Module
// =========================================================================

const path = require('path');
const { generateRemediation, validateFindingInput } = require('./fixAgent');

// Active external collaborator function hook
let externalCollaboratorModule = null;

/**
 * Register an external collaborator Fix Agent remediation function if provided.
 * @param {Function} moduleFn - async function({ finding, workspace_id, run_id }) => Promise<Object>
 */
function registerCollaboratorModule(moduleFn) {
  if (typeof moduleFn !== 'function') {
    throw new Error('Collaborator module must be a function: async ({ finding, workspace_id, run_id }) => FixAgentResult');
  }
  externalCollaboratorModule = moduleFn;
}

/**
 * Validate untrusted output returned from Fix Agent.
 */
function validateFixAgentOutput(output, workspace_id) {
  if (!output || typeof output !== 'object') {
    throw new Error('Fix Agent output must be a valid JSON object');
  }

  const validStatuses = ['proposed', 'needs_review', 'failed', 'rejected', 'PROPOSED', 'FAILED', 'UNSUPPORTED'];
  if (!validStatuses.includes(output.status)) {
    throw new Error(`Invalid Fix Agent status '${output.status}'. Expected one of: ${validStatuses.join(', ')}`);
  }

  // Safety check: Validate file path to prevent directory traversal
  const filePath = output.file_path || (output.changed_files && output.changed_files[0]);
  if (filePath) {
    const rawPath = String(filePath).trim();
    if (rawPath.startsWith('/') || rawPath.startsWith('\\') || /^[a-zA-Z]:/.test(rawPath)) {
      throw new Error(`Safety violation: Fix Agent file_path must be relative to authorized workspace: '${rawPath}'`);
    }
    const normalized = path.normalize(rawPath).replace(/\\/g, '/');
    if (normalized.startsWith('../') || normalized.includes('/../')) {
      throw new Error(`Safety violation: Path traversal detected in Fix Agent file_path: '${rawPath}'`);
    }
  }

  // Safety invariant: Ensure auto-commit or auto-apply is strictly false
  if (output.applied === true) {
    console.warn('[Safety Alert] Fix Agent attempted to report applied=true. Overriding to false for human review.');
    output.applied = false;
  }

  if (!output.approval_state) {
    output.approval_state = 'PENDING_HUMAN_APPROVAL';
  }

  return true;
}

/**
 * Invoke the Fix Agent via the unified interface.
 *
 * @param {Object} params
 * @param {string} [params.run_id] - Workflow run ID
 * @param {Object} params.finding - Confirmed finding from Sentinel Agent
 * @param {string} params.workspace_id - Authorized local workspace
 * @param {string} [params.status='confirmed'] - Confirmation status
 * @returns {Promise<Object>} Fix Agent remediation proposal
 */
async function invokeFixAgent({ run_id, finding, workspace_id, status = 'confirmed' }) {
  // If external collaborator module was explicitly registered, call it
  if (externalCollaboratorModule) {
    try {
      const result = await externalCollaboratorModule({ run_id, finding, workspace_id, status });
      validateFixAgentOutput(result, workspace_id);
      return result;
    } catch (err) {
      console.error('[Fix Agent Adapter] Error from external module:', err.message);
      return {
        run_id: run_id || 'UNKNOWN',
        finding_id: (finding && finding.id) || 'UNKNOWN',
        status: 'failed',
        summary: `Fix Agent execution failed: ${err.message}`,
        rationale: err.message,
        changed_files: [],
        file_path: 'unknown',
        unified_diff: '',
        diff_stats: { additions: 0, deletions: 0 },
        diff_lines: [],
        validation_status: 'failed',
        configured_test_command: null,
        test_output: err.message,
        approval_state: 'PENDING_HUMAN_APPROVAL',
        applied: false,
        collaborator_module: 'EXTERNAL_MODULE_FAILED',
        error: err.message
      };
    }
  }

  // Call the built-in Fix Agent module
  const result = await generateRemediation({
    run_id,
    finding,
    workspace_id,
    status,
    demo_mode: true
  });

  validateFixAgentOutput(result, workspace_id);
  return result;
}

module.exports = {
  invokeFixAgent,
  registerCollaboratorModule,
  validateFixAgentOutput
};
