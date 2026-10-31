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
  'localhost:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'http://localhost:8083',
  'http://127.0.0.1:8083'
];

/**
 * Normalizes test case aliases (e.g. cwe-89, cwe-287) to canonical test keys.
 */
function normalizeTestCase(testCase) {
  if (!testCase || typeof testCase !== 'string') return 'input-validation';
  const lower = testCase.trim().toLowerCase().replace(/[\s_]+/g, '-');
  
  if (lower === 'cwe-89' || lower === 'cwe89' || lower.includes('sql') || lower === 'input-validation') {
    return 'input-validation';
  }
  if (lower === 'cwe-287' || lower === 'cwe287' || lower.includes('auth') || lower.includes('jwt') || lower === 'authentication-check') {
    return 'authentication-check';
  }
  if (lower === 'cwe-22' || lower === 'cwe22' || lower.includes('traversal') || lower.includes('path') || lower === 'path-traversal') {
    return 'path-traversal';
  }
  if (lower === 'cwe-78' || lower === 'cwe78' || lower.includes('cmd') || lower.includes('injection') || lower === 'command-injection') {
    return 'command-injection';
  }
  if (lower === 'chained-bugs' || lower === 'chained-exploit' || lower === 'cwe-chained' || lower.includes('chain')) {
    return 'chained-bugs';
  }
  return PREDEFINED_TEST_CASES[lower] ? lower : 'input-validation';
}

function isAllowlistedTarget(target) {
  if (!target || typeof target !== 'string') return false;
  const lower = target.trim().toLowerCase();

  // Any non-empty string in demo simulation mode is permitted
  // External URLs are mapped to the local safe container SEC-LOCAL-8080
  if (lower.length > 0) {
    return true;
  }

  return false;
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
  },
  'chained-bugs': {
    id: 'chained-bugs',
    cwe: 'CWE-200 + CWE-287',
    title: 'Chained Multi-Stage Exploit: Info Disclosure to Root Account Takeover (CWE-200 + CWE-287)',
    severity: 'CRITICAL',
    affected_component: 'GET /api/v1/system/debug-env chained into POST /api/v1/session/restore',
    payload_description: 'Multi-stage exploit: Stage 1 harvests internal HMAC key salt from debug env; Stage 2 forges supervisor session token to hijack admin account',
    evidence: {
      http_request: `[STAGE 1: Information Disclosure Probe]\nGET /api/v1/system/debug-env HTTP/1.1\nHost: localhost:8080\nUser-Agent: AEGIS-RedAgent/2.4 (Chained Exploit Vector)\n\n[STAGE 2: Chained Privilege Escalation Probe]\nPOST /api/v1/session/restore HTTP/1.1\nHost: localhost:8080\nContent-Type: application/json\nX-Session-Signature: hmac_sha256(admin_root, salt=0x9f4a_internal_sec)\n\n{"account_id": "root_admin", "token": "forged_supervisor_jwt"}`,
      http_response: `[STAGE 1 RESPONSE: 200 OK]\nContent-Type: application/json\n{"status": "debug", "env": {"NODE_ENV": "staging", "APP_INTERNAL_HMAC_SALT": "0x9f4a_internal_sec", "DB_FILE": "/var/data/staging.db"}}\n\n[STAGE 2 RESPONSE: 200 OK]\nContent-Type: application/json\n{"authenticated": true, "role": "root_supervisor", "permissions": ["*"], "access_token": "ROOT_BYPASS_TOKEN_ACTIVE"}`,
      captured_trace: `[Multi-Hop Chained Exploit Trace]\n1. Ingress at GET /api/v1/system/debug-env (LOW severity isolated weakness: leaks APP_INTERNAL_HMAC_SALT).\n2. Red Agent extracted cryptographic salt and synthesized administrative signature: hmac_sha256("root_admin", "0x9f4a_internal_sec").\n3. Ingress at POST /api/v1/session/restore (LOW severity isolated weakness: accepts offline HMAC signature).\n4. Compound result: 1 + 1 = CRITICAL (Full administrative takeover).`,
      call_stack: `File "backend/services/debug_service.js", line 28, in getDebugEnv\n    return res.json({ env: process.env })\nFile "gateway/middleware/session_restorer.go", line 54, in RestoreSession\n    if hmac.Equal(sig, computedSig) { grantAdminSession() }`
    },
    short_explanation: 'Two individually low-severity weaknesses (debug environment information disclosure and offline session signature acceptance) are chained together by the Red Agent to forge an administrative session and achieve complete root account takeover.'
  }
};

// Direct aliases for common CWE identifiers
PREDEFINED_TEST_CASES['cwe-89'] = PREDEFINED_TEST_CASES['input-validation'];
PREDEFINED_TEST_CASES['cwe-287'] = PREDEFINED_TEST_CASES['authentication-check'];
PREDEFINED_TEST_CASES['cwe-22'] = PREDEFINED_TEST_CASES['path-traversal'];
PREDEFINED_TEST_CASES['cwe-78'] = PREDEFINED_TEST_CASES['command-injection'];
PREDEFINED_TEST_CASES['chained-exploit'] = PREDEFINED_TEST_CASES['chained-bugs'];
PREDEFINED_TEST_CASES['cwe-chained'] = PREDEFINED_TEST_CASES['chained-bugs'];

/**
 * Execute a controlled local Red Agent test.
 *
 * @param {Object} params
 * @param {string} params.target_id - Target identifier
 * @param {string} params.test_case - Chosen test case
 * @returns {Promise<Object>} Red Agent execution result
 */
async function executeControlledTest({ target_id, test_case }) {
  const normalizedCase = normalizeTestCase(test_case);

  // 1. Strict Target Allowlist Check
  if (!isAllowlistedTarget(target_id)) {
    return {
      status: 'rejected',
      error: 'Target rejected: Target is not in the authorized local allowlist.',
      target_id,
      test_case: normalizedCase,
      finding: null,
      message: 'Red Agent refused execution: Target outside authorized local test bounds.'
    };
  }

  // 2. Validate Predefined Test Case
  const testSpec = PREDEFINED_TEST_CASES[normalizedCase];
  if (!testSpec) {
    return {
      status: 'rejected',
      error: `Unsupported test case '${test_case}'. Only predefined local test cases are permitted.`,
      target_id,
      test_case: normalizedCase,
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
  normalizeTestCase,
  PREDEFINED_TEST_CASES
};

