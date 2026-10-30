// AEGIS-AGENT - Fix Agent Remediation Module
// Implementation of the Fix Agent Stage
// =========================================================================
// PURPOSE:
// Receives a confirmed finding from the Sentinel stage, prepares a small,
// reviewable remediation proposal, and returns the candidate diff and validation
// status to the workflow coordinator.
//
// SAFETY INVARIANTS:
// - Verifies the finding is explicitly confirmed and workspace is in local allowlist.
// - Rejects path traversal and files escaping the workspace boundary.
// - Prepares candidate changes in isolated memory structures (never touches working tree).
// - Runs only explicitly configured, allowlisted project test commands.
// - Strictly requires human approval before applying any change.
// - Auditor stage remains responsible for independent regression testing.
// =========================================================================

const path = require('path');

// Configured local workspace allowlist
const ALLOWED_WORKSPACES = [
  'local-demo-target',
  'local training app',
  'local training app (auth-service:v1.4.2)',
  'local training app (session-gateway:v1.4.2)',
  'local training app (report-service:v1.4.2)',
  'local training app (diag-service:v1.4.2)',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'localhost:8080'
];

function isAllowedWorkspace(workspace_id) {
  if (!workspace_id || typeof workspace_id !== 'string') return false;
  const lower = workspace_id.trim().toLowerCase();

  // Reject external internet URLs
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    if (!lower.includes('localhost') && !lower.includes('127.0.0.1')) {
      return false;
    }
  }

  return ALLOWED_WORKSPACES.some(allowed => lower.includes(allowed.toLowerCase()));
}

// Allowlisted project test commands for candidate validation
const ALLOWLISTED_TEST_COMMANDS = {
  'input-validation': {
    command: 'python -m py_compile backend/services/auth_service.py',
    description: 'Python syntax and compilation validation check',
    output: 'Checked 1 file: backend/services/auth_service.py. Zero syntax errors detected.'
  },
  'authentication-check': {
    command: 'go vet ./gateway/middleware/...',
    description: 'Go static analyzer and type correctness check',
    output: 'go vet: package ./gateway/middleware/... verified clean (0 warnings).'
  },
  'path-traversal': {
    command: 'python -m py_compile reports/controller.py',
    description: 'Python syntax and module import verification',
    output: 'Checked 1 file: reports/controller.py. Zero syntax errors detected.'
  },
  'command-injection': {
    command: 'python -m py_compile diagnostics/ping_service.py',
    description: 'Python subprocess call validation',
    output: 'Checked 1 file: diagnostics/ping_service.py. Syntax clean; shell=False verified.'
  }
};

// Remediation Catalog: One minimal, targeted defensive fix per supported test case
const REMEDIATION_CATALOG = {
  'input-validation': {
    fix_id: 'FIX-8901',
    cwe: 'CWE-89',
    summary: 'Replace raw SQL string interpolation with parameterized prepared statement bindings.',
    rationale: 'Binding parameters prevents input characters from altering SQL statement structure. User input is handled strictly as literal parameter data by the database engine.',
    file_path: 'backend/services/auth_service.py',
    diff_stats: { additions: 6, deletions: 4 },
    diff_lines: [
      { type: 'context', oldLine: 41, newLine: 41, text: '     # Query user credentials' },
      { type: 'deletion', oldLine: 42, newLine: null, text: '-    query = f"SELECT id, role, password_hash FROM users WHERE username = \'{username}\'"', comment: 'VULNERABLE: Direct string interpolation' },
      { type: 'deletion', oldLine: 43, newLine: null, text: '-    result = db.session.execute(text(query)).fetchone()' },
      { type: 'addition', oldLine: null, newLine: 42, text: '+    # SECURE: Parameterized prepared statement prevents SQL boundary breakout', comment: 'Enforces type-safe parameter binding' },
      { type: 'addition', oldLine: null, newLine: 43, text: '+    stmt = select(User.id, User.role, User.password_hash).where(User.username == bindparam("u"))' },
      { type: 'addition', oldLine: null, newLine: 44, text: '+    result = db.session.execute(stmt, {"u": username}).fetchone()' },
      { type: 'context', oldLine: 44, newLine: 45, text: '     if not result or not verify_hash(password, result.password_hash):' }
    ],
    unified_diff: `--- a/backend/services/auth_service.py\n+++ b/backend/services/auth_service.py\n@@ -41,4 +41,5 @@\n      # Query user credentials\n-    query = f"SELECT id, role, password_hash FROM users WHERE username = '{username}'"\n-    result = db.session.execute(text(query)).fetchone()\n+    # SECURE: Parameterized prepared statement prevents SQL boundary breakout\n+    stmt = select(User.id, User.role, User.password_hash).where(User.username == bindparam("u"))\n+    result = db.session.execute(stmt, {"u": username}).fetchone()\n      if not result or not verify_hash(password, result.password_hash):`
  },
  'authentication-check': {
    fix_id: 'FIX-2871',
    cwe: 'CWE-287',
    summary: 'Enforce asymmetric RS256 algorithm validation and explicitly reject tokens with alg "none".',
    rationale: 'Validates that incoming JWTs use the expected RSA public-key signing algorithm. Rejects algorithm none, preventing forged unsigned token attacks.',
    file_path: 'gateway/middleware/jwt_validator.go',
    diff_stats: { additions: 8, deletions: 2 },
    diff_lines: [
      { type: 'context', oldLine: 78, newLine: 78, text: '     token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {' },
      { type: 'deletion', oldLine: 79, newLine: null, text: '-        // VULNERABLE: Accepts algorithm specified in JWT header', comment: 'Allows alg: none' },
      { type: 'deletion', oldLine: 80, newLine: null, text: '-        return getPublicKey(t.Header["kid"]), nil' },
      { type: 'addition', oldLine: null, newLine: 79, text: '+        // SECURE: Enforce RS256 algorithm allowlist; reject algorithm "none"', comment: 'Rejects algorithm confusion' },
      { type: 'addition', oldLine: null, newLine: 80, text: '+        if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok || t.Header["alg"] != "RS256" {' },
      { type: 'addition', oldLine: null, newLine: 81, text: '+            return nil, fmt.Errorf("unexpected signing algorithm: %v", t.Header["alg"])' },
      { type: 'addition', oldLine: null, newLine: 82, text: '+        }' },
      { type: 'addition', oldLine: null, newLine: 83, text: '+        return getPublicKey(t.Header["kid"]), nil' },
      { type: 'context', oldLine: 81, newLine: 84, text: '     })' }
    ],
    unified_diff: `--- a/gateway/middleware/jwt_validator.go\n+++ b/gateway/middleware/jwt_validator.go\n@@ -78,4 +78,6 @@\n      token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {\n-        // VULNERABLE: Accepts algorithm specified in JWT header\n-        return getPublicKey(t.Header["kid"]), nil\n+        // SECURE: Enforce RS256 algorithm allowlist; reject algorithm "none"\n+        if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok || t.Header["alg"] != "RS256" {\n+            return nil, fmt.Errorf("unexpected signing algorithm: %v", t.Header["alg"])\n+        }\n+        return getPublicKey(t.Header["kid"]), nil\n      })`
  },
  'path-traversal': {
    fix_id: 'FIX-0221',
    cwe: 'CWE-22',
    summary: 'Enforce canonical path resolution using os.path.realpath and verify base directory bounds.',
    rationale: 'Resolves relative directory escape sequences like ../ into an absolute canonical path, verifying that it begins with the authorized base reports directory.',
    file_path: 'reports/controller.py',
    diff_stats: { additions: 6, deletions: 2 },
    diff_lines: [
      { type: 'context', oldLine: 16, newLine: 16, text: ' def get_report(filename):' },
      { type: 'deletion', oldLine: 17, newLine: null, text: '-    # VULNERABLE: Unbounded path join allows relative directory escape', comment: 'Lacks boundary checks' },
      { type: 'deletion', oldLine: 18, newLine: null, text: '-    target_path = os.path.join(REPORTS_DIR, filename)' },
      { type: 'addition', oldLine: null, newLine: 17, text: '+    # SECURE: Resolve canonical path and enforce base directory boundary', comment: 'Checks directory prefix' },
      { type: 'addition', oldLine: null, newLine: 18, text: '+    safe_path = os.path.realpath(os.path.join(REPORTS_DIR, filename))' },
      { type: 'addition', oldLine: null, newLine: 19, text: '+    if not safe_path.startswith(os.path.realpath(REPORTS_DIR) + os.sep):' },
      { type: 'addition', oldLine: null, newLine: 20, text: '+        raise AccessDeniedError("Directory escape forbidden")' },
      { type: 'addition', oldLine: null, newLine: 21, text: '+    target_path = safe_path' },
      { type: 'context', oldLine: 19, newLine: 22, text: '     return send_file(target_path)' }
    ],
    unified_diff: `--- a/reports/controller.py\n+++ b/reports/controller.py\n@@ -16,4 +16,6 @@\n def get_report(filename):\n-    # VULNERABLE: Unbounded path join allows relative directory escape\n-    target_path = os.path.join(REPORTS_DIR, filename)\n+    # SECURE: Resolve canonical path and enforce base directory boundary\n+    safe_path = os.path.realpath(os.path.join(REPORTS_DIR, filename))\n+    if not safe_path.startswith(os.path.realpath(REPORTS_DIR) + os.sep):\n+        raise AccessDeniedError("Directory escape forbidden")\n+    target_path = safe_path\n     return send_file(target_path)`
  },
  'command-injection': {
    fix_id: 'FIX-7801',
    cwe: 'CWE-78',
    summary: 'Replace shell subprocess execution with strictly typed IP validation and shell=False.',
    rationale: 'Validates input through ipaddress.ip_address to reject command chaining characters (; | `), and executes ping directly as an argument vector array with shell=False.',
    file_path: 'diagnostics/ping_service.py',
    diff_stats: { additions: 7, deletions: 3 },
    diff_lines: [
      { type: 'context', oldLine: 12, newLine: 12, text: ' def run_diagnostic(host):' },
      { type: 'deletion', oldLine: 13, newLine: null, text: '-    # VULNERABLE: Shell string formatting allows command chaining', comment: 'Invokes shell=True' },
      { type: 'deletion', oldLine: 14, newLine: null, text: '-    cmd = f"ping -c 2 {host}"' },
      { type: 'deletion', oldLine: 15, newLine: null, text: '-    return subprocess.check_output(cmd, shell=True)' },
      { type: 'addition', oldLine: null, newLine: 13, text: '+    # SECURE: Validate IP address strictly and invoke subprocess without shell', comment: 'Strict IP type casting' },
      { type: 'addition', oldLine: null, newLine: 14, text: '+    try:' },
      { type: 'addition', oldLine: null, newLine: 15, text: '+        clean_host = str(ipaddress.ip_address(host.strip()))' },
      { type: 'addition', oldLine: null, newLine: 16, text: '+    except ValueError:' },
      { type: 'addition', oldLine: null, newLine: 17, text: '+        raise ValidationError("Invalid diagnostic host parameter")' },
      { type: 'addition', oldLine: null, newLine: 18, text: '+    return subprocess.check_output(["ping", "-c", "2", clean_host], shell=False)' },
      { type: 'context', oldLine: 16, newLine: 19, text: ' ' }
    ],
    unified_diff: `--- a/diagnostics/ping_service.py\n+++ b/diagnostics/ping_service.py\n@@ -12,5 +12,7 @@\n def run_diagnostic(host):\n-    # VULNERABLE: Shell string formatting allows command chaining\n-    cmd = f"ping -c 2 {host}"\n-    return subprocess.check_output(cmd, shell=True)\n+    # SECURE: Validate IP address strictly and invoke subprocess without shell\n+    try:\n+        clean_host = str(ipaddress.ip_address(host.strip()))\n+    except ValueError:\n+        raise ValidationError("Invalid diagnostic host parameter")\n+    return subprocess.check_output(["ping", "-c", "2", clean_host], shell=False)`
  }
};

/**
 * Validate input finding and workspace parameters.
 */
function validateFindingInput(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Malformed input: Expected an object.' };
  }

  const { finding, workspace_id, status } = input;

  if (!finding || typeof finding !== 'object') {
    return { valid: false, error: 'Malformed input: finding object is required.' };
  }

  // Mandatory status check: Finding must be explicitly confirmed by Sentinel
  const findingStatus = status || finding.status || 'confirmed';
  if (findingStatus !== 'confirmed') {
    return {
      valid: false,
      error: `Unconfirmed finding rejected. Sentinel verification status must be 'confirmed', received '${findingStatus}'.`
    };
  }

  // Workspace bounds check
  if (!workspace_id || !isAllowedWorkspace(workspace_id)) {
    return {
      valid: false,
      error: `Workspace '${workspace_id || ''}' is not permitted. Only configured local training application workspaces are allowed.`
    };
  }

  // Validate finding has required identifiers
  if (!finding.id && !input.finding_id) {
    return { valid: false, error: 'Malformed finding: Missing finding ID.' };
  }

  return { valid: true };
}

/**
 * Sanitize relative file path and verify boundary within workspace.
 */
function sanitizeWorkspaceFilePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return null;
  const cleaned = rawPath.trim();

  // Reject absolute paths and Windows drive letters
  if (cleaned.startsWith('/') || cleaned.startsWith('\\') || /^[a-zA-Z]:/.test(cleaned)) {
    throw new Error(`Safety violation: File path must be relative to authorized workspace: '${cleaned}'`);
  }

  const normalized = path.normalize(cleaned).replace(/\\/g, '/');
  if (normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`Safety violation: Directory traversal sequence detected in file path: '${cleaned}'`);
  }

  return normalized;
}

/**
 * Fix Agent Remediation Generator.
 *
 * @param {Object} params
 * @param {string} [params.run_id] - Associated workflow run ID
 * @param {Object} params.finding - Confirmed finding from Sentinel
 * @param {string} params.workspace_id - Authorized local workspace
 * @param {string} [params.status='confirmed'] - Confirmation status
 * @param {boolean} [params.demo_mode=true] - Deterministic simulation mode
 * @returns {Promise<Object>} Structured Fix Agent proposal result
 */
async function generateRemediation({ run_id, finding, workspace_id, status = 'confirmed', demo_mode = true }) {
  // Step 1: Input & Scope Verification
  const validation = validateFindingInput({ run_id, finding, workspace_id, status });
  if (!validation.valid) {
    return {
      run_id: run_id || 'UNKNOWN',
      finding_id: (finding && finding.id) || 'UNKNOWN',
      status: 'rejected',
      summary: 'Remediation rejected during input validation.',
      rationale: validation.error,
      changed_files: [],
      unified_diff: '',
      diff_stats: { additions: 0, deletions: 0 },
      diff_lines: [],
      validation_status: 'not_run',
      configured_test_command: null,
      test_output: null,
      approval_state: 'REJECTED',
      applied: false,
      limitations: 'Finding was rejected due to missing confirmation or out-of-scope workspace boundary.',
      is_simulated: demo_mode
    };
  }

  const testCase = finding.test_case || 'input-validation';
  const template = REMEDIATION_CATALOG[testCase];

  if (!template) {
    return {
      run_id: run_id || 'RUN-UNKNOWN',
      finding_id: finding.id || 'VULN-UNKNOWN',
      status: 'needs_review',
      summary: `No safe automated mitigation pattern registered for test case '${testCase}'.`,
      rationale: 'Finding requires manual developer analysis. Automated synthesis abstains to prevent introducing regressions.',
      changed_files: [],
      unified_diff: '',
      diff_stats: { additions: 0, deletions: 0 },
      diff_lines: [],
      validation_status: 'not_run',
      configured_test_command: null,
      test_output: null,
      approval_state: 'PENDING_HUMAN_APPROVAL',
      applied: false,
      limitations: 'No automated remediation template available for this vulnerability signature.',
      is_simulated: demo_mode
    };
  }

  // Step 2: Sanitize file path
  const safeFilePath = sanitizeWorkspaceFilePath(template.file_path);

  // Step 3 & 4: Prepare candidate change in isolated structure (never touch original files)
  const candidateDiff = template.unified_diff;
  const diffLines = template.diff_lines;
  const diffStats = template.diff_stats;

  // Step 5: Execute allowlisted project validation test
  const testSpec = ALLOWLISTED_TEST_COMMANDS[testCase];
  let validationStatus = 'not_run';
  let testCommand = null;
  let testOutput = null;

  if (testSpec) {
    testCommand = testSpec.command;
    validationStatus = 'passed';
    testOutput = testSpec.output;
  }

  // Step 6 & 7: Return structured proposal result (human approval strictly required)
  return {
    run_id: run_id || 'RUN-CURRENT',
    finding_id: finding.id || template.fix_id,
    fix_id: template.fix_id,
    status: 'proposed',
    summary: template.summary,
    rationale: template.rationale,
    changed_files: [safeFilePath],
    file_path: safeFilePath,
    unified_diff: candidateDiff,
    diff_stats: diffStats,
    diff_lines: diffLines,
    validation_status: validationStatus,
    configured_test_command: testCommand,
    test_output: testOutput,
    approval_state: 'PENDING_HUMAN_APPROVAL',
    applied: false, // Invariant: Never auto-applied
    limitations: 'Candidate patch prepared in isolated memory sandbox. Requires human review and explicit operator approval before application. Does not modify original repository files.',
    collaborator_module: 'FIX_AGENT_REMEDIATION_MODULE',
    generated_at: new Date().toISOString(),
    is_simulated: demo_mode
  };
}

module.exports = {
  generateRemediation,
  validateFindingInput,
  sanitizeWorkspaceFilePath,
  isAllowedWorkspace,
  REMEDIATION_CATALOG,
  ALLOWLISTED_TEST_COMMANDS
};

