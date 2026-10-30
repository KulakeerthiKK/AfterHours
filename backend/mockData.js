// AEGIS-AGENT Backend Mock Workflow Data
// Deterministic sample results for security war room stages.
// Strictly labeled as simulated mock data for authorized local testing.

const TEST_CASES = {
  'input-validation': {
    id: 'input-validation',
    name: 'Input validation check (CWE-89)',
    target_id: 'Local training app (auth-service:v1.4.2)',
    endpoint: 'POST /api/v1/auth/login',
    service: 'auth-service',
    default_outcome: 'complete',
    stage_durations: {
      scope_check: 2000,
      red_agent: 2500,
      sentinel_agent: 2500,
      fix_agent: 2500,
      auditor_agent: 2500
    },
    stages: {
      scope_check: {
        name: 'Scope accepted',
        stage_id: 'scope_check',
        agent: 'System Orchestrator',
        summary: 'Target boundaries verified: strictly bounded to authorized local test container.',
        activity: 'Scope validated against local security manifest. Boundary enforced: 127.0.0.1:8080 only.'
      },
      red_agent: {
        name: 'Test run',
        stage_id: 'red_agent',
        agent: 'Red Agent',
        summary: 'Executing automated SQL parameter injection probe against auth endpoint.',
        activity: "Sent probe payload: ' UNION SELECT id, username, password_hash, role FROM users WHERE '1'='1"
      },
      sentinel_agent: {
        name: 'Evidence reviewed',
        stage_id: 'sentinel_agent',
        agent: 'Sentinel Agent',
        summary: 'Evaluating HTTP response and error reflections for vulnerability signatures.',
        activity: 'Detected raw database query reflection in JSON error stream. Confirmed CWE-89 signature.'
      },
      fix_agent: {
        name: 'Fix proposed',
        stage_id: 'fix_agent',
        agent: 'Fix Agent',
        summary: 'Synthesizing parameterized ORM query remediation to replace raw string concatenation.',
        activity: 'Drafted prepared statement patch for backend/services/auth_service.py. Contract preserved.'
      },
      auditor_agent: {
        name: 'Regression checked',
        stage_id: 'auditor_agent',
        agent: 'Auditor Agent',
        summary: 'Running regression verification test matrix against patched interface.',
        activity: 'Executed 4 validation test cases. Original exploit payload blocked (400 Bad Request). Clean pass.'
      }
    },
    finding: {
      id: 'FIND-8901',
      title: 'CWE-89: Unsanitized SQL Query Interpolation in Auth Search',
      severity: 'HIGH',
      cvss: '8.4',
      affected_component: 'POST /api/v1/auth/login (param: username)',
      category: 'Injection / OWASP Top 10 A03:2021',
      cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
      short_explanation: 'The authentication service constructs SQL statements using unchecked user-supplied parameters via string concatenation. An unauthorized client can manipulate database query logic to bypass credential validation or exfiltrate table contents.',
      exploit_command: `curl -X POST http://localhost:8080/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin\\' UNION SELECT id, \\'admin\\', \\'hash\\', \\'secops\\' FROM users WHERE \\'1\\'=\\'1\\' --","password":"x"}'`,
      evidence: {
        http_request: `POST /api/v1/auth/login HTTP/1.1
Host: localhost:8080
User-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)
Content-Type: application/json
Accept: application/json
X-Simulation-Run: SIM-RUN

{
  "username": "admin' UNION SELECT id, 'admin', 'hash_mock', 'secops_role' FROM users WHERE '1'='1' --",
  "password": "arbitrary_probe_payload"
}`,
        http_response: `HTTP/1.1 200 OK
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
        hex_view: `00000000: 7b 0a 20 20 22 75 73 65  72 6e 61 6d 65 22 3a 20  |{.  "username": |
00000010: 22 61 64 6d 69 6e 27 20  55 4e 49 4f 4e 20 53 45  |"admin' UNION SE|
00000020: 4c 45 43 54 20 69 64 2c  20 27 61 64 6d 69 6e 27  |LECT id, 'admin'|`,
        raw_logs: `[Red Agent] [INFO] Target endpoint reached: http://127.0.0.1:8080/api/v1/auth/login
[Red Agent] [EXEC] Sending crafted parameter payload #1 (SQL syntax breaker)
[Red Agent] [WARN] Unexpected 200 OK response with elevated token payload
[Sentinel Agent] [INGEST] Captured probe response stream (Content-Length: 394 bytes)
[Sentinel Agent] [CONFIRM] Vulnerability confirmed: CWE-89 SQL Injection via 'username' field`,
        call_stack: `File "backend/services/auth_service.py", line 41, in authenticate_user
    query = f"SELECT * FROM users WHERE username = '{username}' AND pass_hash = '{hashed}'"
Result: Multi-resultset union evaluation succeeded without parameter binding`
      }
    },
    proposed_fix: {
      id: 'FIX-8901',
      summary: 'Replace raw string interpolation with parameterized SQL query execution using prepared statements. User inputs are bound strictly as parameters rather than executable SQL clauses.',
      file_path: 'backend/services/auth_service.py',
      diff_stats: { additions: 6, deletions: 4 },
      diff_lines: [
        { type: 'context', old_line: 38, new_line: 38, text: '    # Authenticate credentials against local database' },
        { type: 'context', old_line: 39, new_line: 39, text: '    hashed = hash_credential(password)' },
        { type: 'deletion', old_line: 40, new_line: null, text: '-   # VULNERABLE: Direct string interpolation' },
        { type: 'deletion', old_line: 41, new_line: null, text: '-   query = f"SELECT * FROM users WHERE username = \'{username}\' AND pass_hash = \'{hashed}\'"' },
        { type: 'deletion', old_line: 42, new_line: null, text: '-   result = db.raw_query(query)' },
        { type: 'deletion', old_line: 43, new_line: null, text: '-   return build_session(result)' },
        { type: 'addition', old_line: null, new_line: 40, text: '+   # REMEDIATED: Bound query parameters with prepared statement' },
        { type: 'addition', old_line: null, new_line: 41, text: '+   query = "SELECT * FROM users WHERE username = :uname AND pass_hash = :phash"' },
        { type: 'addition', old_line: null, new_line: 42, text: '+   result = db.execute_parameterized(query, {' },
        { type: 'addition', old_line: null, new_line: 43, text: '+       "uname": username,' },
        { type: 'addition', old_line: null, new_line: 44, text: '+       "phash": hashed' },
        { type: 'addition', old_line: null, new_line: 45, text: '+   }).fetchone()' },
        { type: 'context', old_line: 44, new_line: 46, text: '    if not result:' },
        { type: 'context', old_line: 45, new_line: 47, text: '        raise AuthenticationFailedError("Invalid credentials")' },
        { type: 'context', old_line: 46, new_line: 48, text: '    return build_session(result)' }
      ]
    },
    regression: {
      overall_status: 'Remediated',
      is_reproducible: false,
      reproducibility_label: 'REMEDIATED — Not Reproducible',
      summary: 'The original exploit payload is safely neutralized. Input characters are treated strictly as string literals, preventing syntax alteration.',
      checks: [
        {
          id: 'CHK-1',
          name: 'Original Exploit Payload Verification',
          description: 'Re-evaluates probe payload with SQL injection union sequence',
          status: 'PASS',
          result_text: 'HTTP 400 Bad Request / Handled Safely',
          reproduced: false,
          duration: '34ms'
        },
        {
          id: 'CHK-2',
          name: 'Legitimate User Authentication',
          description: 'Verifies normal user login flow remains intact with valid credentials',
          status: 'PASS',
          result_text: 'HTTP 200 OK / Session Generated',
          reproduced: false,
          duration: '42ms'
        },
        {
          id: 'CHK-3',
          name: 'Boundary Check: Quotes & Special Characters',
          description: 'Tests quotes, backslashes, semicolons, and UTF-8 encoding variations',
          status: 'PASS',
          result_text: 'HTTP 422 Unprocessable / Validation Passed',
          reproduced: false,
          duration: '28ms'
        },
        {
          id: 'CHK-4',
          name: 'Type Safety & Parameter Strictness',
          description: 'Validates strict dictionary mapping with schema type verification',
          status: 'PASS',
          result_text: 'HTTP 200 OK / Schema Validated',
          reproduced: false,
          duration: '19ms'
        }
      ]
    }
  },

  'authentication-check': {
    id: 'authentication-check',
    name: 'Authentication check (CWE-287)',
    target_id: 'Local training app (session-gateway:v1.4.2)',
    endpoint: 'GET /api/v1/user/profile',
    service: 'session-gateway',
    default_outcome: 'complete',
    stage_durations: {
      scope_check: 2000,
      red_agent: 2500,
      sentinel_agent: 2500,
      fix_agent: 2500,
      auditor_agent: 2500
    },
    stages: {
      scope_check: {
        name: 'Scope accepted',
        stage_id: 'scope_check',
        agent: 'System Orchestrator',
        summary: 'Boundaries verified. Test application instance authorized for authentication probe.',
        activity: 'Local gateway container validated. Bound strictly to local mock session provider.'
      },
      red_agent: {
        name: 'Test run',
        stage_id: 'red_agent',
        agent: 'Red Agent',
        summary: 'Dispatching forged JWT authorization header with "alg": "none" algorithm.',
        activity: 'Sent probe: Authorization: Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIn0.'
      },
      sentinel_agent: {
        name: 'Evidence reviewed',
        stage_id: 'sentinel_agent',
        agent: 'Sentinel Agent',
        summary: 'Verifying if server accepted unsigned token and returned privileged user state.',
        activity: 'Target responded with 200 OK and emitted administrative profile data. Confirmed CWE-287.'
      },
      fix_agent: {
        name: 'Fix proposed',
        stage_id: 'fix_agent',
        agent: 'Fix Agent',
        summary: 'Enforcing strict RS256 algorithm verification and explicitly rejecting "none".',
        activity: 'Drafted security middleware patch for gateway/middleware/auth_jwt.py.'
      },
      auditor_agent: {
        name: 'Regression checked',
        stage_id: 'auditor_agent',
        agent: 'Auditor Agent',
        summary: 'Executing token verification test matrix with forged, valid, and expired tokens.',
        activity: 'All 4 verification checks passed. Unsigned tokens blocked with 401 Unauthorized.'
      }
    },
    finding: {
      id: 'FIND-2871',
      title: 'CWE-287: Broken Token Verification via "alg": "none" Header',
      severity: 'HIGH',
      cvss: '8.1',
      affected_component: 'GET /api/v1/user/profile (header: Authorization)',
      category: 'Broken Authentication / OWASP Top 10 A07:2021',
      cwe: 'CWE-287: Improper Authentication',
      short_explanation: 'The token verification middleware fails to mandate explicit asymmetric signature validation. By supplying "alg": "none" in the token header without a cryptographic signature, an unauthenticated client gains arbitrary role access.',
      exploit_command: `curl -X GET http://localhost:8080/api/v1/user/profile \\
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NSIsInJvbGUiOiJzZWNvcHNfYWRtaW4ifQ."`,
      evidence: {
        http_request: `GET /api/v1/user/profile HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJzZWNvcHNfYWRtaW4ifQ.
Accept: application/json`,
        http_response: `HTTP/1.1 200 OK
Content-Type: application/json
{ "profile": { "user_id": 12345, "role": "secops_admin" } }`,
        hex_view: `00000000: 42 65 61 72 65 72 20 65  79 4a 68 62 47 63 69 4f  |Bearer eyJhbGciO|`,
        raw_logs: `[Red Agent] Crafted unsigned JWT token payload with alg="none"
[Red Agent] Received HTTP 200 OK without cryptographic signature
[Sentinel Agent] Signature bypass verified: Missing signature accepted`,
        call_stack: `File "gateway/middleware/auth_jwt.py", line 29, in verify_token
    payload = jwt.decode(token, verify=False)`
      }
    },
    proposed_fix: {
      id: 'FIX-2871',
      summary: 'Mandate explicit asymmetric RS256 algorithm enforcement during JWT decoding. Explicitly reject missing algorithms and tokens claiming "none" or symmetric keys.',
      file_path: 'gateway/middleware/auth_jwt.py',
      diff_stats: { additions: 5, deletions: 3 },
      diff_lines: [
        { type: 'context', old_line: 25, new_line: 25, text: '    token = extract_bearer_token(request)' },
        { type: 'deletion', old_line: 29, new_line: null, text: '-   unverified = jwt.decode(token, options={"verify_signature": False})' },
        { type: 'addition', old_line: null, new_line: 29, text: '+   payload = jwt.decode(token, key=PUBLIC_KEY, algorithms=["RS256"])' },
        { type: 'context', old_line: 31, new_line: 34, text: '    return payload' }
      ]
    },
    regression: {
      overall_status: 'Remediated',
      is_reproducible: false,
      reproducibility_label: 'REMEDIATED — Not Reproducible',
      summary: 'The unsigned token exploit is safely rejected with HTTP 401 Unauthorized. Algorithm pinning prevents downgrade attacks.',
      checks: [
        {
          id: 'CHK-AUTH-1',
          name: 'Unsigned "alg": "none" Token Check',
          description: 'Re-evaluates probe payload with stripped signature',
          status: 'PASS',
          result_text: 'HTTP 401 Unauthorized / Signature Missing',
          reproduced: false,
          duration: '18ms'
        },
        {
          id: 'CHK-AUTH-2',
          name: 'Valid RS256 Signed Token Flow',
          description: 'Validates that genuinely signed RS256 tokens authenticate cleanly',
          status: 'PASS',
          result_text: 'HTTP 200 OK / Session Accepted',
          reproduced: false,
          duration: '31ms'
        }
      ]
    }
  },

  'path-traversal': {
    id: 'path-traversal',
    name: 'Path traversal check (CWE-22)',
    target_id: 'Local training app (report-service:v1.4.2)',
    endpoint: 'GET /api/v1/reports/download',
    service: 'report-service',
    default_outcome: 'complete',
    stage_durations: {
      scope_check: 2000,
      red_agent: 2500,
      sentinel_agent: 2500,
      fix_agent: 2500,
      auditor_agent: 2500
    },
    stages: {
      scope_check: {
        name: 'Scope accepted',
        stage_id: 'scope_check',
        agent: 'System Orchestrator',
        summary: 'Target boundaries confirmed. Local mock file system sandbox verified.',
        activity: 'Local report-service container scope verified. Bounded strictly to mock directory.'
      },
      red_agent: {
        name: 'Test run',
        stage_id: 'red_agent',
        agent: 'Red Agent',
        summary: 'Executing directory escape traversal probe via file parameter.',
        activity: 'Sent probe: GET /api/v1/reports/download?file=../../../../config/mock_app.env'
      },
      sentinel_agent: {
        name: 'Evidence reviewed',
        stage_id: 'sentinel_agent',
        agent: 'Sentinel Agent',
        summary: 'Analyzing file content stream for unauthorized local file disclosure.',
        activity: 'Response returned simulated environment file contents. Confirmed CWE-22.'
      },
      fix_agent: {
        name: 'Fix proposed',
        stage_id: 'fix_agent',
        agent: 'Fix Agent',
        summary: 'Proposing canonical path validation using safe_join and whitelist verification.',
        activity: 'Drafted patch for reports/controller.py to prevent directory boundary escape.'
      },
      auditor_agent: {
        name: 'Regression checked',
        stage_id: 'auditor_agent',
        agent: 'Auditor Agent',
        summary: 'Validating path canonicalization and legitimate report file downloads.',
        activity: 'Traversal payload blocked (403 Forbidden). Legitimate reports download cleanly.'
      }
    },
    finding: {
      id: 'FIND-0221',
      title: 'CWE-22: Arbitrary File Read via Path Traversal',
      severity: 'MEDIUM',
      cvss: '6.5',
      affected_component: 'GET /api/v1/reports/download (param: file)',
      category: 'Broken Access Control / OWASP Top 10 A01:2021',
      cwe: 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory',
      short_explanation: 'The report service joins user-controlled filename input directly to the base reports folder without canonical path resolution.',
      evidence: {
        http_request: `GET /api/v1/reports/download?file=../../../../config/mock_app.env HTTP/1.1
Host: localhost:8080`,
        http_response: `HTTP/1.1 200 OK
Content-Type: text/plain
APP_ENV=local_dev
MOCK_SECRET_KEY=local_training_dummy_key_not_real`,
        hex_view: `00000000: 23 20 4c 4f 43 41 4c 20  54 52 41 49 4e 49 4e 47  |# LOCAL TRAINING|`,
        raw_logs: `[Red Agent] Sending path traversal payload in 'file' query parameter
[Sentinel Agent] Path traversal confirmed: File escaped base folder`,
        call_stack: `File "reports/controller.py", line 19, in get_report
    target_path = os.path.join(REPORTS_DIR, filename)`
      }
    },
    proposed_fix: {
      id: 'FIX-0221',
      summary: 'Enforce canonical path resolution using os.path.realpath and ensure resolved path strictly begins with the authorized base reports directory.',
      file_path: 'reports/controller.py',
      diff_stats: { additions: 6, deletions: 2 },
      diff_lines: [
        { type: 'context', old_line: 16, new_line: 16, text: '    filename = request.args.get("file")' },
        { type: 'deletion', old_line: 17, new_line: null, text: '-   target_path = os.path.join(REPORTS_DIR, filename)' },
        { type: 'addition', old_line: null, new_line: 17, text: '+   safe_path = os.path.realpath(os.path.join(REPORTS_DIR, filename))' },
        { type: 'addition', old_line: null, new_line: 18, text: '+   if not safe_path.startswith(os.path.realpath(REPORTS_DIR)):' },
        { type: 'addition', old_line: null, new_line: 19, text: '+       raise AccessDeniedError("Directory escape forbidden")' },
        { type: 'context', old_line: 19, new_line: 20, text: '    return send_file(safe_path)' }
      ]
    },
    regression: {
      overall_status: 'Remediated',
      is_reproducible: false,
      reproducibility_label: 'REMEDIATED — Not Reproducible',
      summary: 'Directory traversal payload blocked with HTTP 403 Forbidden. Safe downloads of authorized report files function properly.',
      checks: [
        {
          id: 'CHK-PATH-1',
          name: 'Traversal Escape Payload (../)',
          description: 'Re-evaluates escape attempt using multiple relative levels',
          status: 'PASS',
          result_text: 'HTTP 403 Forbidden / Access Denied',
          reproduced: false,
          duration: '14ms'
        }
      ]
    }
  }
};

const STAGE_ORDER = [
  'scope_check',
  'red_agent',
  'sentinel_agent',
  'fix_agent',
  'auditor_agent'
];

module.exports = {
  TEST_CASES,
  STAGE_ORDER
};

