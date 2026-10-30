// AEGIS-AGENT Mock Data Store
// Realistic security testing mock data strictly bounded to authorized local test targets.

const MOCK_TEST_CASES = {
  'input-validation': {
    id: 'input-validation',
    name: 'Input validation check',
    description: 'Verifies SQL parameter boundary sanitization against login/search inputs (CWE-89)',
    targetLabel: 'Local training app (auth-service:v1.4.2)',
    endpoint: 'POST /api/v1/auth/login',
    stages: [
      {
        id: 1,
        name: 'Scope accepted',
        agent: 'System Orchestrator',
        status: 'queued',
        summary: 'Target boundaries verified: strictly bounded to authorized local test container.',
        activity: 'Scope validated against local security manifest. Boundary enforced: 127.0.0.1:8080 only.',
        timestamp: '12:00:01'
      },
      {
        id: 2,
        name: 'Test run',
        agent: 'Red Agent',
        status: 'queued',
        summary: 'Executing automated SQL parameter injection probe against auth endpoint.',
        activity: 'Sent probe payload: \' UNION SELECT id, username, password_hash, role FROM users WHERE \'1\'=\'1',
        timestamp: '12:00:03'
      },
      {
        id: 3,
        name: 'Evidence reviewed',
        agent: 'Sentinel Agent',
        status: 'queued',
        summary: 'Evaluating HTTP response and error reflections for vulnerability signatures.',
        activity: 'Detected raw database query reflection in JSON error stream. Confirmed CWE-89 signature.',
        timestamp: '12:00:06'
      },
      {
        id: 4,
        name: 'Fix proposed',
        agent: 'Fix Agent',
        status: 'queued',
        summary: 'Synthesizing parameterized ORM query remediation to replace raw string concatenation.',
        activity: 'Drafted prepared statement patch for backend/services/auth_service.py. Contract preserved.',
        timestamp: '12:00:09'
      },
      {
        id: 5,
        name: 'Regression checked',
        agent: 'Auditor Agent',
        status: 'queued',
        summary: 'Running regression verification test matrix against patched interface.',
        activity: 'Executed 4 validation test cases. Original exploit payload blocked (400 Bad Request). Clean pass.',
        timestamp: '12:00:12'
      }
    ],
    finding: {
      id: 'FIND-8901',
      title: 'CWE-89: Unsanitized SQL Query Interpolation in Auth Search',
      severity: 'HIGH',
      cvss: '8.4 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)',
      affectedComponent: 'POST /api/v1/auth/login (param: username)',
      category: 'Injection / OWASP Top 10 A03:2021',
      cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
      shortExplanation: 'The authentication service constructs SQL statements using unchecked user-supplied parameters via string concatenation. An unauthorized caller can manipulate SQL evaluation semantics to bypass credential validation or exfiltrate table contents.',
      evidence: {
        httpRequest: `POST /api/v1/auth/login HTTP/1.1
Host: localhost:8080
User-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)
Content-Type: application/json
Accept: application/json
X-Simulation-Run: RUN-1049

{
  "username": "admin' UNION SELECT id, 'admin', 'hash_mock', 'secops_role' FROM users WHERE '1'='1' --",
  "password": "arbitrary_probe_payload"
}`,
        httpResponse: `HTTP/1.1 200 OK
Date: Fri, 30 Oct 2026 12:00:04 GMT
Content-Type: application/json
X-Security-Scan-Flagged: true
Connection: close

{
  "status": "authenticated",
  "user_id": 1,
  "role": "secops_role",
  "auth_token": "sim_eyJh...mock_elevated_session",
  "debug_info": {
    "query_executed": "SELECT * FROM users WHERE username = 'admin' UNION SELECT id, 'admin', 'hash_mock', 'secops_role' FROM users WHERE '1'='1' --' AND pass_hash = '...'"
  }
}`,
        rawLogs: `[2026-10-30T12:00:03.114Z] [Red Agent] [INFO] Target endpoint reached: http://127.0.0.1:8080/api/v1/auth/login
[2026-10-30T12:00:03.189Z] [Red Agent] [EXEC] Sending crafted parameter payload #1 (SQL syntax breaker)
[2026-10-30T12:00:03.450Z] [Red Agent] [WARN] Unexpected 200 OK response with elevated token payload
[2026-10-30T12:00:04.012Z] [Sentinel Agent] [INGEST] Captured probe response stream (Content-Length: 394 bytes)
[2026-10-30T12:00:04.220Z] [Sentinel Agent] [ANALYZE] Parsing response AST for SQL execution artifact
[2026-10-30T12:00:04.650Z] [Sentinel Agent] [CONFIRM] Vulnerability confirmed: CWE-89 SQL Injection via 'username' field`,
        callStack: `Traceback (most recent call executed in training container):
  File "backend/services/auth_service.py", line 42, in authenticate_user
    query = f"SELECT * FROM users WHERE username = '{username}' AND pass_hash = '{hashed}'"
  File "backend/database/executor.py", line 88, in raw_execute
    cursor.execute(query)
Result: Multi-resultset union evaluation succeeded without parameter binding`
      }
    },
    proposedFix: {
      id: 'FIX-8901',
      summary: 'Replace raw string interpolation with parameterized SQL query execution using prepared statements. User inputs are bound strictly as parameters rather than executable SQL clauses.',
      filePath: 'backend/services/auth_service.py',
      diffStats: { additions: 6, deletions: 4 },
      diffLines: [
        { type: 'context', oldLine: 38, newLine: 38, text: '    # Authenticate credentials against local database' },
        { type: 'context', oldLine: 39, newLine: 39, text: '    hashed = hash_credential(password)' },
        { type: 'deletion', oldLine: 40, newLine: null, text: '-   # VULNERABLE: Direct string interpolation' },
        { type: 'deletion', oldLine: 41, newLine: null, text: '-   query = f"SELECT * FROM users WHERE username = \'{username}\' AND pass_hash = \'{hashed}\'"' },
        { type: 'deletion', oldLine: 42, newLine: null, text: '-   result = db.raw_query(query)' },
        { type: 'deletion', oldLine: 43, newLine: null, text: '-   return build_session(result)' },
        { type: 'addition', oldLine: null, newLine: 40, text: '+   # REMEDIATED: Bound query parameters' },
        { type: 'addition', oldLine: null, newLine: 41, text: '+   query = "SELECT * FROM users WHERE username = :uname AND pass_hash = :phash"' },
        { type: 'addition', oldLine: null, newLine: 42, text: '+   result = db.execute_parameterized(query, {' },
        { type: 'addition', oldLine: null, newLine: 43, text: '+       "uname": username,' },
        { type: 'addition', oldLine: null, newLine: 44, text: '+       "phash": hashed' },
        { type: 'addition', oldLine: null, newLine: 45, text: '+   }).fetchone()' },
        { type: 'context', oldLine: 44, newLine: 46, text: '    if not result:' },
        { type: 'context', oldLine: 45, newLine: 47, text: '        raise AuthenticationFailedError("Invalid credentials")' },
        { type: 'context', oldLine: 46, newLine: 48, text: '    return build_session(result)' }
      ]
    },
    regression: {
      overallStatus: 'Remediated',
      isReproducible: false,
      reproducibilityLabel: 'REMEDIATED — Not Reproducible',
      summary: 'The original exploit payload is safely neutralized. Input characters are treated strictly as string literals, preventing syntax alteration.',
      checks: [
        {
          id: 'CHK-1',
          name: 'Original Exploit Payload Verification',
          description: 'Re-evaluates probe payload with SQL injection union sequence',
          status: 'PASS',
          resultText: 'HTTP 400 Bad Request / Handled Safely',
          reproduced: false
        },
        {
          id: 'CHK-2',
          name: 'Legitimate User Authentication',
          description: 'Verifies normal user login flow remains intact with valid credentials',
          status: 'PASS',
          resultText: 'HTTP 200 OK / Session Generated',
          reproduced: false
        },
        {
          id: 'CHK-3',
          name: 'Boundary Check: Quotes & Special Characters',
          description: 'Tests quotes, backslashes, semicolons, and UTF-8 encoding variations',
          status: 'PASS',
          resultText: 'HTTP 422 Unprocessable / Validation Passed',
          reproduced: false
        },
        {
          id: 'CHK-4',
          name: 'Type Safety & Parameter Strictness',
          description: 'Validates strict dictionary mapping with schema type verification',
          status: 'PASS',
          resultText: 'HTTP 200 OK / Schema Validated',
          reproduced: false
        }
      ]
    }
  },

  'authentication-check': {
    id: 'authentication-check',
    name: 'Authentication check',
    description: 'Audits JWT signature handling and checks for broken token verification (CWE-287)',
    targetLabel: 'Local training app (session-gateway:v1.4.2)',
    endpoint: 'GET /api/v1/user/profile',
    stages: [
      {
        id: 1,
        name: 'Scope accepted',
        agent: 'System Orchestrator',
        status: 'queued',
        summary: 'Boundaries verified. Test application instance authorized for authentication probe.',
        activity: 'Local gateway container validated. Bound strictly to local mock session provider.',
        timestamp: '12:05:01'
      },
      {
        id: 2,
        name: 'Test run',
        agent: 'Red Agent',
        status: 'queued',
        summary: 'Dispatching forged JWT authorization header with "alg": "none" algorithm.',
        activity: 'Sent probe: Authorization: Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIn0.',
        timestamp: '12:05:03'
      },
      {
        id: 3,
        name: 'Evidence reviewed',
        agent: 'Sentinel Agent',
        status: 'queued',
        summary: 'Verifying if server accepted unsigned token and returned privileged user state.',
        activity: 'Target responded with 200 OK and emitted administrative profile data. Confirmed CWE-287.',
        timestamp: '12:05:06'
      },
      {
        id: 4,
        name: 'Fix proposed',
        agent: 'Fix Agent',
        status: 'queued',
        summary: 'Enforcing strict RS256 algorithm verification and explicitly rejecting "none".',
        activity: 'Drafted security middleware patch for gateway/middleware/auth_jwt.py.',
        timestamp: '12:05:09'
      },
      {
        id: 5,
        name: 'Regression checked',
        agent: 'Auditor Agent',
        status: 'queued',
        summary: 'Executing token verification test matrix with forged, valid, and expired tokens.',
        activity: 'All 4 verification checks passed. Unsigned tokens blocked with 401 Unauthorized.',
        timestamp: '12:05:12'
      }
    ],
    finding: {
      id: 'FIND-2871',
      title: 'CWE-287: Broken Token Verification via "alg": "none" Header',
      severity: 'HIGH',
      cvss: '8.1 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)',
      affectedComponent: 'GET /api/v1/user/profile (header: Authorization)',
      category: 'Broken Authentication / OWASP Top 10 A07:2021',
      cwe: 'CWE-287: Improper Authentication',
      shortExplanation: 'The token verification middleware fails to mandate explicit asymmetric signature validation. By supplying "alg": "none" in the token header without a cryptographic signature, an unauthenticated client gains arbitrary role access.',
      evidence: {
        httpRequest: `GET /api/v1/user/profile HTTP/1.1
Host: localhost:8080
User-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)
Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJzZWNvcHNfYWRtaW4ifQ.
Accept: application/json
X-Simulation-Run: RUN-1048`,
        httpResponse: `HTTP/1.1 200 OK
Date: Fri, 30 Oct 2026 12:05:04 GMT
Content-Type: application/json
X-Security-Scan-Flagged: true

{
  "profile": {
    "user_id": 12345,
    "name": "Admin",
    "role": "secops_admin",
    "permissions": ["system:read", "system:write", "system:admin"]
  }
}`,
        rawLogs: `[2026-10-30T12:05:03.110Z] [Red Agent] [EXEC] Crafting unsigned JWT token payload with alg="none"
[2026-10-30T12:05:03.220Z] [Red Agent] [DISPATCH] GET /api/v1/user/profile
[2026-10-30T12:05:03.450Z] [Red Agent] [ALERT] Received HTTP 200 OK without cryptographic signature
[2026-10-30T12:05:04.100Z] [Sentinel Agent] [ANALYZE] Evaluating JWT header verification pipeline
[2026-10-30T12:05:04.340Z] [Sentinel Agent] [CONFIRM] Signature bypass verified: Missing signature accepted`,
        callStack: `File "gateway/middleware/auth_jwt.py", line 29, in verify_token
    # VULNERABLE: pyjwt called without algorithms parameter
    payload = jwt.decode(token, verify=False)
Allowed unsigned token through authentication filter.`
      }
    },
    proposedFix: {
      id: 'FIX-2871',
      summary: 'Mandate explicit asymmetric RS256 algorithm enforcement during JWT decoding. Explicitly reject missing algorithms and tokens claiming "none" or symmetric keys.',
      filePath: 'gateway/middleware/auth_jwt.py',
      diffStats: { additions: 5, deletions: 3 },
      diffLines: [
        { type: 'context', oldLine: 25, newLine: 25, text: '    token = extract_bearer_token(request)' },
        { type: 'context', oldLine: 26, newLine: 26, text: '    if not token:' },
        { type: 'context', oldLine: 27, newLine: 27, text: '        raise MissingTokenError("Token missing")' },
        { type: 'deletion', oldLine: 28, newLine: null, text: '-   # VULNERABLE: Implicit algorithm trusting' },
        { type: 'deletion', oldLine: 29, newLine: null, text: '-   unverified = jwt.decode(token, options={"verify_signature": False})' },
        { type: 'deletion', oldLine: 30, newLine: null, text: '-   return unverified' },
        { type: 'addition', oldLine: null, newLine: 28, text: '+   # REMEDIATED: Enforce explicit RS256 verification and public key' },
        { type: 'addition', oldLine: null, newLine: 29, text: '+   payload = jwt.decode(' },
        { type: 'addition', oldLine: null, newLine: 30, text: '+       token,' },
        { type: 'addition', oldLine: null, newLine: 31, text: '+       key=PUBLIC_KEY,' },
        { type: 'addition', oldLine: null, newLine: 32, text: '+       algorithms=["RS256"]' },
        { type: 'addition', oldLine: null, newLine: 33, text: '+   )' },
        { type: 'context', oldLine: 31, newLine: 34, text: '    return payload' }
      ]
    },
    regression: {
      overallStatus: 'Remediated',
      isReproducible: false,
      reproducibilityLabel: 'REMEDIATED — Not Reproducible',
      summary: 'The unsigned token exploit is safely rejected with HTTP 401 Unauthorized. Algorithm pinning prevents downgrade attacks.',
      checks: [
        {
          id: 'CHK-AUTH-1',
          name: 'Unsigned "alg": "none" Token Check',
          description: 'Re-evaluates probe payload with stripped signature',
          status: 'PASS',
          resultText: 'HTTP 401 Unauthorized / Signature Missing',
          reproduced: false
        },
        {
          id: 'CHK-AUTH-2',
          name: 'Valid RS256 Signed Token Flow',
          description: 'Validates that genuinely signed RS256 tokens authenticate cleanly',
          status: 'PASS',
          resultText: 'HTTP 200 OK / Session Accepted',
          reproduced: false
        },
        {
          id: 'CHK-AUTH-3',
          name: 'Expired Token Rejection Check',
          description: 'Ensures exp claim is strictly verified',
          status: 'PASS',
          resultText: 'HTTP 401 Unauthorized / Token Expired',
          reproduced: false
        },
        {
          id: 'CHK-AUTH-4',
          name: 'Symmetric HMAC Substitution Check',
          description: 'Prevents public-key HMAC substitution attack',
          status: 'PASS',
          resultText: 'HTTP 401 Unauthorized / Algorithm Mismatch',
          reproduced: false
        }
      ]
    }
  },

  'path-traversal': {
    id: 'path-traversal',
    name: 'Path traversal check',
    description: 'Tests local file report downloads against directory traversal attacks (CWE-22)',
    targetLabel: 'Local training app (report-service:v1.4.2)',
    endpoint: 'GET /api/v1/reports/download',
    stages: [
      {
        id: 1,
        name: 'Scope accepted',
        agent: 'System Orchestrator',
        status: 'queued',
        summary: 'Target boundaries confirmed. Local mock file system sandbox verified.',
        activity: 'Local report-service container scope verified. Bounded strictly to mock directory.',
        timestamp: '12:10:01'
      },
      {
        id: 2,
        name: 'Test run',
        agent: 'Red Agent',
        status: 'queued',
        summary: 'Executing directory escape traversal probe via file parameter.',
        activity: 'Sent probe: GET /api/v1/reports/download?file=../../../../config/mock_app.env',
        timestamp: '12:10:03'
      },
      {
        id: 3,
        name: 'Evidence reviewed',
        agent: 'Sentinel Agent',
        status: 'queued',
        summary: 'Analyzing file content stream for unauthorized local file disclosure.',
        activity: 'Response returned simulated environment file contents. Confirmed CWE-22.',
        timestamp: '12:10:06'
      },
      {
        id: 4,
        name: 'Fix proposed',
        agent: 'Fix Agent',
        status: 'queued',
        summary: 'Proposing canonical path validation using safe_join and whitelist verification.',
        activity: 'Drafted patch for reports/controller.py to prevent directory boundary escape.',
        timestamp: '12:10:09'
      },
      {
        id: 5,
        name: 'Regression checked',
        agent: 'Auditor Agent',
        status: 'queued',
        summary: 'Validating path canonicalization and legitimate report file downloads.',
        activity: 'Traversal payload blocked (403 Forbidden). Legitimate reports download cleanly.',
        timestamp: '12:10:12'
      }
    ],
    finding: {
      id: 'FIND-0221',
      title: 'CWE-22: Arbitrary File Read via Path Traversal',
      severity: 'MEDIUM',
      cvss: '6.5 (CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N)',
      affectedComponent: 'GET /api/v1/reports/download (param: file)',
      category: 'Broken Access Control / OWASP Top 10 A01:2021',
      cwe: 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory',
      shortExplanation: 'The report service joins user-controlled filename input directly to the base reports folder without canonical path resolution. Relative sequences like "../" allow reading arbitrary files within the container context.',
      evidence: {
        httpRequest: `GET /api/v1/reports/download?file=../../../../config/mock_app.env HTTP/1.1
Host: localhost:8080
User-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)
Accept: text/plain
X-Simulation-Run: RUN-1047`,
        httpResponse: `HTTP/1.1 200 OK
Date: Fri, 30 Oct 2026 12:10:04 GMT
Content-Type: text/plain
Content-Disposition: attachment; filename="mock_app.env"

# LOCAL TRAINING CONFIG - MOCK VALUES
APP_ENV=local_dev
MOCK_SECRET_KEY=local_training_dummy_key_not_real
DATABASE_HOST=127.0.0.1`,
        rawLogs: `[2026-10-30T12:10:03.010Z] [Red Agent] [EXEC] Sending path traversal payload in 'file' query parameter
[2026-10-30T12:10:03.200Z] [Red Agent] [ALERT] Server returned 200 OK with config file contents
[2026-10-30T12:10:04.100Z] [Sentinel Agent] [ANALYZE] Checking response header and file signature
[2026-10-30T12:10:04.300Z] [Sentinel Agent] [CONFIRM] Path traversal confirmed: File escaped base folder`,
        callStack: `File "reports/controller.py", line 19, in get_report
    target_path = os.path.join(REPORTS_DIR, filename)
    return send_file(target_path)
os.path.join did not prevent relative directory escape.`
      }
    },
    proposedFix: {
      id: 'FIX-0221',
      summary: 'Enforce canonical path resolution using os.path.realpath and ensure resolved path strictly begins with the authorized base reports directory.',
      filePath: 'reports/controller.py',
      diffStats: { additions: 6, deletions: 2 },
      diffLines: [
        { type: 'context', oldLine: 16, newLine: 16, text: '    filename = request.args.get("file")' },
        { type: 'deletion', oldLine: 17, newLine: null, text: '-   # VULNERABLE: Unbounded path join' },
        { type: 'deletion', oldLine: 18, newLine: null, text: '-   target_path = os.path.join(REPORTS_DIR, filename)' },
        { type: 'addition', oldLine: null, newLine: 17, text: '+   # REMEDIATED: Resolve and verify canonical path bounds' },
        { type: 'addition', oldLine: null, newLine: 18, text: '+   safe_path = os.path.realpath(os.path.join(REPORTS_DIR, filename))' },
        { type: 'addition', oldLine: null, newLine: 19, text: '+   if not safe_path.startswith(os.path.realpath(REPORTS_DIR)):' },
        { type: 'addition', oldLine: null, newLine: 20, text: '+       raise AccessDeniedError("Directory escape forbidden")' },
        { type: 'addition', oldLine: null, newLine: 21, text: '+   target_path = safe_path' },
        { type: 'context', oldLine: 19, newLine: 22, text: '    return send_file(target_path)' }
      ]
    },
    regression: {
      overallStatus: 'Remediated',
      isReproducible: false,
      reproducibilityLabel: 'REMEDIATED — Not Reproducible',
      summary: 'Directory traversal payload blocked with HTTP 403 Forbidden. Safe downloads of authorized report files function properly.',
      checks: [
        {
          id: 'CHK-PATH-1',
          name: 'Traversal Escape Payload (../)',
          description: 'Re-evaluates escape attempt using multiple relative levels',
          status: 'PASS',
          resultText: 'HTTP 403 Forbidden / Access Denied',
          reproduced: false
        },
        {
          id: 'CHK-PATH-2',
          name: 'Legitimate Authorized Report Download',
          description: 'Ensures standard monthly_summary.pdf file is delivered properly',
          status: 'PASS',
          resultText: 'HTTP 200 OK / File Delivered',
          reproduced: false
        },
        {
          id: 'CHK-PATH-3',
          name: 'Null-byte Injection Attempt (%00)',
          description: 'Validates handling of encoded null bytes in file parameter',
          status: 'PASS',
          resultText: 'HTTP 400 Bad Request / Sanitized',
          reproduced: false
        },
        {
          id: 'CHK-PATH-4',
          name: 'Absolute Path Parameter Test (/etc/)',
          description: 'Validates rejection when given direct absolute root path',
          status: 'PASS',
          resultText: 'HTTP 403 Forbidden / Bound Enforced',
          reproduced: false
        }
      ]
    }
  }
};

const INITIAL_RECENT_RUNS = [
  {
    id: 'RUN-1049',
    testCaseId: 'input-validation',
    testName: 'Input validation check',
    targetLabel: 'Local training app (auth-service:v1.4.2)',
    findingsCount: 1,
    severity: 'High',
    status: 'Completed',
    remediated: true,
    duration: '11.8s',
    timestamp: '2 mins ago'
  },
  {
    id: 'RUN-1048',
    testCaseId: 'authentication-check',
    testName: 'Authentication check',
    targetLabel: 'Local training app (session-gateway:v1.4.2)',
    findingsCount: 1,
    severity: 'High',
    status: 'Completed',
    remediated: true,
    duration: '12.4s',
    timestamp: '18 mins ago'
  },
  {
    id: 'RUN-1047',
    testCaseId: 'path-traversal',
    testName: 'Path traversal check',
    targetLabel: 'Local training app (report-service:v1.4.2)',
    findingsCount: 1,
    severity: 'Medium',
    status: 'Completed',
    remediated: true,
    duration: '9.2s',
    timestamp: '1 hour ago'
  },
  {
    id: 'RUN-1046',
    testCaseId: 'input-validation',
    testName: 'Rate limiting validation check',
    targetLabel: 'Local training app (edge-proxy:v1.4.2)',
    findingsCount: 0,
    severity: 'None',
    status: 'Completed',
    remediated: true,
    duration: '6.1s',
    timestamp: '3 hours ago'
  }
];

// Export to window if not using ES modules, or standard export
if (typeof window !== 'undefined') {
  window.AEGIS_MOCK = {
    testCases: MOCK_TEST_CASES,
    recentRuns: INITIAL_RECENT_RUNS
  };
}

