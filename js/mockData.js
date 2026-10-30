// AEGIS-AGENT Enhanced Mock Data Store
// Realistic multi-agent security testing datasets with CVSS metrics, attack vectors, and telemetry traces.

const MOCK_TEST_CASES = {
  'input-validation': {
    id: 'input-validation',
    name: 'Input validation check',
    tag: 'CWE-89',
    description: 'Verifies SQL parameter boundary sanitization against login/search inputs (CWE-89)',
    targetLabel: 'Local training app (auth-service:v1.4.2)',
    endpoint: 'POST /api/v1/auth/login',
    service: 'auth-service',
    port: '8080',
    latencyImpact: '+0.8ms',
    cvssBreakdown: {
      vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N',
      av: 'Network',
      ac: 'Low',
      pr: 'None',
      ui: 'None',
      scope: 'Unchanged',
      conf: 'High',
      integ: 'High',
      avail: 'None'
    },
    stages: [
      {
        id: 1,
        name: 'Scope accepted',
        agent: 'System Orchestrator',
        agentRole: 'Scope & Boundary Controller',
        status: 'queued',
        summary: 'Target boundaries verified: strictly bounded to authorized local test container.',
        activity: 'Scope validated against local security manifest. Boundary enforced: 127.0.0.1:8080 only.',
        timestamp: '12:00:01',
        metrics: { checkedAssets: 1, boundaryRules: 4, compliance: '100%' }
      },
      {
        id: 2,
        name: 'Test run',
        agent: 'Red Agent',
        agentRole: 'Automated Security Probe Engine',
        status: 'queued',
        summary: 'Executing automated SQL parameter injection probe against auth endpoint.',
        activity: "Sent probe payload: ' UNION SELECT id, username, password_hash, role FROM users WHERE '1'='1",
        timestamp: '12:00:03',
        metrics: { payloadsSent: 6, anomaliesDetected: 1, statusLeak: '200 OK' }
      },
      {
        id: 3,
        name: 'Evidence reviewed',
        agent: 'Sentinel Agent',
        agentRole: 'Evidence & AST Validation Agent',
        status: 'queued',
        summary: 'Evaluating HTTP response and error reflections for vulnerability signatures.',
        activity: 'Detected raw database query reflection in JSON error stream. Confirmed CWE-89 signature.',
        timestamp: '12:00:06',
        metrics: { confidence: '99.4%', falsePositiveRisk: 'Minimal', cwe: 'CWE-89' }
      },
      {
        id: 4,
        name: 'Fix proposed',
        agent: 'Fix Agent',
        agentRole: 'Automated Remediation Synthesizer',
        status: 'queued',
        summary: 'Synthesizing parameterized ORM query remediation to replace raw string concatenation.',
        activity: 'Drafted prepared statement patch for backend/services/auth_service.py. Contract preserved.',
        timestamp: '12:00:09',
        metrics: { linesChanged: 10, breakingChanges: 0, performanceDelta: '+0.8ms' }
      },
      {
        id: 5,
        name: 'Regression checked',
        agent: 'Auditor Agent',
        agentRole: 'Verification & Regression Assessor',
        status: 'queued',
        summary: 'Running regression verification test matrix against patched interface.',
        activity: 'Executed 4 validation test cases. Original exploit payload blocked (400 Bad Request). Clean pass.',
        timestamp: '12:00:12',
        metrics: { testsRun: 4, passed: 4, failed: 0, reproducibility: 'Not Reproducible' }
      }
    ],
    finding: {
      id: 'FIND-8901',
      title: 'CWE-89: Unsanitized SQL Query Interpolation in Auth Search',
      severity: 'HIGH',
      cvss: '8.4',
      affectedComponent: 'POST /api/v1/auth/login (param: username)',
      category: 'Injection / OWASP Top 10 A03:2021',
      cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
      shortExplanation: 'The authentication service constructs SQL statements using unchecked user-supplied parameters via string concatenation. An unauthorized caller can manipulate database query logic to bypass credential validation or exfiltrate table contents.',
      exploitCommand: `curl -X POST http://localhost:8080/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin\\' UNION SELECT id, \\'admin\\', \\'hash\\', \\'secops\\' FROM users WHERE \\'1\\'=\\'1\\' --","password":"x"}'`,
      evidence: {
        httpRequest: `POST /api/v1/auth/login HTTP/1.1
Host: localhost:8080
User-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)
Content-Type: application/json
Accept: application/json
X-Simulation-Run: RUN-1049
X-Aegis-Agent: Red-01

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
        hexView: `00000000: 7b 0a 20 20 22 75 73 65  72 6e 61 6d 65 22 3a 20  |{.  "username": |
00000010: 22 61 64 6d 69 6e 27 20  55 4e 49 4f 4e 20 53 45  |"admin' UNION SE|
00000020: 4c 45 43 54 20 69 64 2c  20 27 61 64 6d 69 6e 27  |LECT id, 'admin'|
00000030: 2c 20 27 68 61 73 68 5f  6d 6f 63 6b 27 20 46 52  |, 'hash_mock' FR|
00000040: 4f 4d 20 75 73 65 72 73  20 57 48 45 52 45 20 27  |OM users WHERE '|
00000050: 31 27 3d 27 31 27 20 2d  2d 22 2c 0a 20 20 22 70  |1'='1' --",.  "p|
00000060: 61 73 73 77 6f 72 64 22  3a 20 22 78 22 0a 7d     |assword": "x".} |`,
        rawLogs: `[2026-10-30T12:00:03.114Z] [Red Agent] [INFO] Target endpoint reached: http://127.0.0.1:8080/api/v1/auth/login
[2026-10-30T12:00:03.189Z] [Red Agent] [EXEC] Sending crafted parameter payload #1 (SQL syntax breaker)
[2026-10-30T12:00:03.450Z] [Red Agent] [WARN] Unexpected 200 OK response with elevated token payload
[2026-10-30T12:00:04.012Z] [Sentinel Agent] [INGEST] Captured probe response stream (Content-Length: 394 bytes)
[2026-10-30T12:00:04.220Z] [Sentinel Agent] [ANALYZE] Parsing response AST for SQL execution artifact
[2026-10-30T12:00:04.650Z] [Sentinel Agent] [CONFIRM] Vulnerability confirmed: CWE-89 SQL Injection via 'username' field`,
        callStack: `Traceback (most recent call executed in training container):
  File "backend/services/auth_service.py", line 41, in authenticate_user
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
        { type: 'deletion', oldLine: 40, newLine: null, text: '-   # VULNERABLE: Direct string interpolation', comment: 'Concatenates raw unescaped username into query string' },
        { type: 'deletion', oldLine: 41, newLine: null, text: '-   query = f"SELECT * FROM users WHERE username = \'{username}\' AND pass_hash = \'{hashed}\'"' },
        { type: 'deletion', oldLine: 42, newLine: null, text: '-   result = db.raw_query(query)' },
        { type: 'deletion', oldLine: 43, newLine: null, text: '-   return build_session(result)' },
        { type: 'addition', oldLine: null, newLine: 40, text: '+   # REMEDIATED: Bound query parameters with prepared statement', comment: 'Passes parameters separately to DB engine' },
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
          reproduced: false,
          duration: '34ms'
        },
        {
          id: 'CHK-2',
          name: 'Legitimate User Authentication',
          description: 'Verifies normal user login flow remains intact with valid credentials',
          status: 'PASS',
          resultText: 'HTTP 200 OK / Session Generated',
          reproduced: false,
          duration: '42ms'
        },
        {
          id: 'CHK-3',
          name: 'Boundary Check: Quotes & Special Characters',
          description: 'Tests quotes, backslashes, semicolons, and UTF-8 encoding variations',
          status: 'PASS',
          resultText: 'HTTP 422 Unprocessable / Validation Passed',
          reproduced: false,
          duration: '28ms'
        },
        {
          id: 'CHK-4',
          name: 'Type Safety & Parameter Strictness',
          description: 'Validates strict dictionary mapping with schema type verification',
          status: 'PASS',
          resultText: 'HTTP 200 OK / Schema Validated',
          reproduced: false,
          duration: '19ms'
        }
      ]
    }
  },

  'authentication-check': {
    id: 'authentication-check',
    name: 'Authentication check',
    tag: 'CWE-287',
    description: 'Audits JWT signature handling and checks for broken token verification (CWE-287)',
    targetLabel: 'Local training app (session-gateway:v1.4.2)',
    endpoint: 'GET /api/v1/user/profile',
    service: 'session-gateway',
    port: '8080',
    latencyImpact: '+1.2ms',
    cvssBreakdown: {
      vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N',
      av: 'Network',
      ac: 'Low',
      pr: 'None',
      ui: 'None',
      scope: 'Unchanged',
      conf: 'High',
      integ: 'High',
      avail: 'None'
    },
    stages: [
      {
        id: 1,
        name: 'Scope accepted',
        agent: 'System Orchestrator',
        agentRole: 'Scope & Boundary Controller',
        status: 'queued',
        summary: 'Boundaries verified. Test application instance authorized for authentication probe.',
        activity: 'Local gateway container validated. Bound strictly to local mock session provider.',
        timestamp: '12:05:01',
        metrics: { checkedAssets: 1, boundaryRules: 4, compliance: '100%' }
      },
      {
        id: 2,
        name: 'Test run',
        agent: 'Red Agent',
        agentRole: 'Automated Security Probe Engine',
        status: 'queued',
        summary: 'Dispatching forged JWT authorization header with "alg": "none" algorithm.',
        activity: 'Sent probe: Authorization: Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIn0.',
        timestamp: '12:05:03',
        metrics: { payloadsSent: 4, anomaliesDetected: 1, statusLeak: '200 OK' }
      },
      {
        id: 3,
        name: 'Evidence reviewed',
        agent: 'Sentinel Agent',
        agentRole: 'Evidence & AST Validation Agent',
        status: 'queued',
        summary: 'Verifying if server accepted unsigned token and returned privileged user state.',
        activity: 'Target responded with 200 OK and emitted administrative profile data. Confirmed CWE-287.',
        timestamp: '12:05:06',
        metrics: { confidence: '99.8%', falsePositiveRisk: 'Zero', cwe: 'CWE-287' }
      },
      {
        id: 4,
        name: 'Fix proposed',
        agent: 'Fix Agent',
        agentRole: 'Automated Remediation Synthesizer',
        status: 'queued',
        summary: 'Enforcing strict RS256 algorithm verification and explicitly rejecting "none".',
        activity: 'Drafted security middleware patch for gateway/middleware/auth_jwt.py.',
        timestamp: '12:05:09',
        metrics: { linesChanged: 8, breakingChanges: 0, performanceDelta: '+1.2ms' }
      },
      {
        id: 5,
        name: 'Regression checked',
        agent: 'Auditor Agent',
        agentRole: 'Verification & Regression Assessor',
        status: 'queued',
        summary: 'Executing token verification test matrix with forged, valid, and expired tokens.',
        activity: 'All 4 verification checks passed. Unsigned tokens blocked with 401 Unauthorized.',
        timestamp: '12:05:12',
        metrics: { testsRun: 4, passed: 4, failed: 0, reproducibility: 'Not Reproducible' }
      }
    ],
    finding: {
      id: 'FIND-2871',
      title: 'CWE-287: Broken Token Verification via "alg": "none" Header',
      severity: 'HIGH',
      cvss: '8.1',
      affectedComponent: 'GET /api/v1/user/profile (header: Authorization)',
      category: 'Broken Authentication / OWASP Top 10 A07:2021',
      cwe: 'CWE-287: Improper Authentication',
      shortExplanation: 'The token verification middleware fails to mandate explicit asymmetric signature validation. By supplying "alg": "none" in the token header without a cryptographic signature, an unauthenticated client gains arbitrary role access.',
      exploitCommand: `curl -X GET http://localhost:8080/api/v1/user/profile \\
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NSIsInJvbGUiOiJzZWNvcHNfYWRtaW4ifQ."`,
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
        hexView: `00000000: 42 65 61 72 65 72 20 65  79 4a 68 62 47 63 69 4f  |Bearer eyJhbGciO|
00000010: 69 4a 75 62 32 35 6c 49  69 77 69 64 48 6c 77 49  |iJub25lIiwidHlwI|
00000020: 6a 6f 69 53 6c 64 55 49  6e 30 2e 65 79 4a 7a 64  |joiSldUIn0.eyJzd|
00000030: 57 49 69 4f 69 49 78 4d  6a 4d 30 4e 53 49 73 49  |WIiOiIxMjM0NSIsI|
00000040: 6d 35 68 62 57 55 69 4f  69 4a 42 5a 47 31 70 62  |m5hbWUiOiJBZG1pb|
00000050: 6e 49 73 49 6e 4a 76 62  47 55 69 4f 69 4a 7a 5a  |nIsInJvbGUiOiJzZ|
00000060: 57 4e 76 63 48 4e 66 59  57 52 74 61 57 34 69 66  |WNvcHNfYWRtaW4if|
00000070: 51 2e                                             |Q.              |`,
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
        { type: 'deletion', oldLine: 28, newLine: null, text: '-   # VULNERABLE: Implicit algorithm trusting', comment: 'Decodes token without requiring signature validation' },
        { type: 'deletion', oldLine: 29, newLine: null, text: '-   unverified = jwt.decode(token, options={"verify_signature": False})' },
        { type: 'deletion', oldLine: 30, newLine: null, text: '-   return unverified' },
        { type: 'addition', oldLine: null, newLine: 28, text: '+   # REMEDIATED: Enforce explicit RS256 verification and public key', comment: 'Pins algorithm to RS256; blocks "none" or HMAC tampering' },
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
          reproduced: false,
          duration: '18ms'
        },
        {
          id: 'CHK-AUTH-2',
          name: 'Valid RS256 Signed Token Flow',
          description: 'Validates that genuinely signed RS256 tokens authenticate cleanly',
          status: 'PASS',
          resultText: 'HTTP 200 OK / Session Accepted',
          reproduced: false,
          duration: '31ms'
        },
        {
          id: 'CHK-AUTH-3',
          name: 'Expired Token Rejection Check',
          description: 'Ensures exp claim is strictly verified',
          status: 'PASS',
          resultText: 'HTTP 401 Unauthorized / Token Expired',
          reproduced: false,
          duration: '15ms'
        },
        {
          id: 'CHK-AUTH-4',
          name: 'Symmetric HMAC Substitution Check',
          description: 'Prevents public-key HMAC substitution attack',
          status: 'PASS',
          resultText: 'HTTP 401 Unauthorized / Algorithm Mismatch',
          reproduced: false,
          duration: '22ms'
        }
      ]
    }
  },

  'path-traversal': {
    id: 'path-traversal',
    name: 'Path traversal check',
    tag: 'CWE-22',
    description: 'Tests local file report downloads against directory traversal attacks (CWE-22)',
    targetLabel: 'Local training app (report-service:v1.4.2)',
    endpoint: 'GET /api/v1/reports/download',
    service: 'report-service',
    port: '8080',
    latencyImpact: '+0.4ms',
    cvssBreakdown: {
      vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N',
      av: 'Network',
      ac: 'Low',
      pr: 'Low',
      ui: 'None',
      scope: 'Unchanged',
      conf: 'High',
      integ: 'None',
      avail: 'None'
    },
    stages: [
      {
        id: 1,
        name: 'Scope accepted',
        agent: 'System Orchestrator',
        agentRole: 'Scope & Boundary Controller',
        status: 'queued',
        summary: 'Target boundaries confirmed. Local mock file system sandbox verified.',
        activity: 'Local report-service container scope verified. Bounded strictly to mock directory.',
        timestamp: '12:10:01',
        metrics: { checkedAssets: 1, boundaryRules: 4, compliance: '100%' }
      },
      {
        id: 2,
        name: 'Test run',
        agent: 'Red Agent',
        agentRole: 'Automated Security Probe Engine',
        status: 'queued',
        summary: 'Executing directory escape traversal probe via file parameter.',
        activity: 'Sent probe: GET /api/v1/reports/download?file=../../../../config/mock_app.env',
        timestamp: '12:10:03',
        metrics: { payloadsSent: 5, anomaliesDetected: 1, statusLeak: '200 OK' }
      },
      {
        id: 3,
        name: 'Evidence reviewed',
        agent: 'Sentinel Agent',
        agentRole: 'Evidence & AST Validation Agent',
        status: 'queued',
        summary: 'Analyzing file content stream for unauthorized local file disclosure.',
        activity: 'Response returned simulated environment file contents. Confirmed CWE-22.',
        timestamp: '12:10:06',
        metrics: { confidence: '99.1%', falsePositiveRisk: 'Minimal', cwe: 'CWE-22' }
      },
      {
        id: 4,
        name: 'Fix proposed',
        agent: 'Fix Agent',
        agentRole: 'Automated Remediation Synthesizer',
        status: 'queued',
        summary: 'Proposing canonical path validation using safe_join and whitelist verification.',
        activity: 'Drafted patch for reports/controller.py to prevent directory boundary escape.',
        timestamp: '12:10:09',
        metrics: { linesChanged: 8, breakingChanges: 0, performanceDelta: '+0.4ms' }
      },
      {
        id: 5,
        name: 'Regression checked',
        agent: 'Auditor Agent',
        agentRole: 'Verification & Regression Assessor',
        status: 'queued',
        summary: 'Validating path canonicalization and legitimate report file downloads.',
        activity: 'Traversal payload blocked (403 Forbidden). Legitimate reports download cleanly.',
        timestamp: '12:10:12',
        metrics: { testsRun: 4, passed: 4, failed: 0, reproducibility: 'Not Reproducible' }
      }
    ],
    finding: {
      id: 'FIND-0221',
      title: 'CWE-22: Arbitrary File Read via Path Traversal',
      severity: 'MEDIUM',
      cvss: '6.5',
      affectedComponent: 'GET /api/v1/reports/download (param: file)',
      category: 'Broken Access Control / OWASP Top 10 A01:2021',
      cwe: 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory',
      shortExplanation: 'The report service joins user-controlled filename input directly to the base reports folder without canonical path resolution. Relative sequences like "../" allow reading arbitrary files within the container context.',
      exploitCommand: `curl -X GET "http://localhost:8080/api/v1/reports/download?file=../../../../config/mock_app.env"`,
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
        hexView: `00000000: 23 20 4c 4f 43 41 4c 20  54 52 41 49 4e 49 4e 47  |# LOCAL TRAINING|
00000010: 20 43 4f 4e 46 49 47 20  2d 20 4d 4f 43 4b 20 56  | CONFIG - MOCK V|
00000020: 41 4c 55 45 53 0a 41 50  50 5f 45 4e 56 3d 6c 6f  |ALUES.APP_ENV=lo|
00000030: 63 61 6c 5f 64 65 76 0a  4d 4f 43 4b 5f 53 45 43  |cal_dev.MOCK_SEC|
00000040: 52 45 54 5f 4b 45 59 3d  6c 6f 63 61 6c 5f 74 72  |RET_KEY=local_tr|`,
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
        { type: 'deletion', oldLine: 17, newLine: null, text: '-   # VULNERABLE: Unbounded path join', comment: 'Joins path without canonical resolution' },
        { type: 'deletion', oldLine: 18, newLine: null, text: '-   target_path = os.path.join(REPORTS_DIR, filename)' },
        { type: 'addition', oldLine: null, newLine: 17, text: '+   # REMEDIATED: Resolve and verify canonical path bounds', comment: 'Resolves symlinks/relative tokens and verifies parent directory' },
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
          reproduced: false,
          duration: '14ms'
        },
        {
          id: 'CHK-PATH-2',
          name: 'Legitimate Authorized Report Download',
          description: 'Ensures standard monthly_summary.pdf file is delivered properly',
          status: 'PASS',
          resultText: 'HTTP 200 OK / File Delivered',
          reproduced: false,
          duration: '38ms'
        },
        {
          id: 'CHK-PATH-3',
          name: 'Null-byte Injection Attempt (%00)',
          description: 'Validates handling of encoded null bytes in file parameter',
          status: 'PASS',
          resultText: 'HTTP 400 Bad Request / Sanitized',
          reproduced: false,
          duration: '17ms'
        },
        {
          id: 'CHK-PATH-4',
          name: 'Absolute Path Parameter Test (/etc/)',
          description: 'Validates rejection when given direct absolute root path',
          status: 'PASS',
          resultText: 'HTTP 403 Forbidden / Bound Enforced',
          reproduced: false,
          duration: '21ms'
        }
      ]
    }
  },

  'command-injection': {
    id: 'command-injection',
    name: 'Command injection check',
    tag: 'CWE-78',
    description: 'Checks OS command execution hygiene in local diagnostic ping endpoint (CWE-78)',
    targetLabel: 'Local training app (diag-service:v1.4.2)',
    endpoint: 'POST /api/v1/diagnostics/ping',
    service: 'diag-service',
    port: '8080',
    latencyImpact: '+0.2ms',
    cvssBreakdown: {
      vector: 'CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H',
      av: 'Network',
      ac: 'Low',
      pr: 'High',
      ui: 'None',
      scope: 'Unchanged',
      conf: 'High',
      integ: 'High',
      avail: 'High'
    },
    stages: [
      {
        id: 1,
        name: 'Scope accepted',
        agent: 'System Orchestrator',
        agentRole: 'Scope & Boundary Controller',
        status: 'queued',
        summary: 'Target boundaries confirmed. Diagnostic service sandbox verified.',
        activity: 'Container network isolation validated. Bounded strictly to local diagnostic container.',
        timestamp: '12:15:01',
        metrics: { checkedAssets: 1, boundaryRules: 4, compliance: '100%' }
      },
      {
        id: 2,
        name: 'Test run',
        agent: 'Red Agent',
        agentRole: 'Automated Security Probe Engine',
        status: 'queued',
        summary: 'Executing shell command separator injection via host parameter.',
        activity: 'Sent probe: host=127.0.0.1; id; uname -a',
        timestamp: '12:15:03',
        metrics: { payloadsSent: 4, anomaliesDetected: 1, statusLeak: '200 OK' }
      },
      {
        id: 3,
        name: 'Evidence reviewed',
        agent: 'Sentinel Agent',
        agentRole: 'Evidence & AST Validation Agent',
        status: 'queued',
        summary: 'Inspecting diagnostic output stream for unexpected command execution artifacts.',
        activity: 'Response returned uid=1001(localapp) and Linux kernel signature. Confirmed CWE-78.',
        timestamp: '12:15:06',
        metrics: { confidence: '99.9%', falsePositiveRisk: 'Zero', cwe: 'CWE-78' }
      },
      {
        id: 4,
        name: 'Fix proposed',
        agent: 'Fix Agent',
        agentRole: 'Automated Remediation Synthesizer',
        status: 'queued',
        summary: 'Replacing shell=True subprocess invocation with strict argument list and IP regex validation.',
        activity: 'Drafted patch for diagnostics/runner.py removing shell interpreter invoke.',
        timestamp: '12:15:09',
        metrics: { linesChanged: 9, breakingChanges: 0, performanceDelta: '+0.2ms' }
      },
      {
        id: 5,
        name: 'Regression checked',
        agent: 'Auditor Agent',
        agentRole: 'Verification & Regression Assessor',
        status: 'queued',
        summary: 'Validating IP address regex filter and standard ping executions.',
        activity: 'Command separator payload blocked with 422 Unprocessable. Valid IPs ping normally.',
        timestamp: '12:15:12',
        metrics: { testsRun: 4, passed: 4, failed: 0, reproducibility: 'Not Reproducible' }
      }
    ],
    finding: {
      id: 'FIND-0781',
      title: 'CWE-78: Improper Neutralization of Special Elements used in an OS Command',
      severity: 'HIGH',
      cvss: '8.8',
      affectedComponent: 'POST /api/v1/diagnostics/ping (field: host)',
      category: 'Command Injection / OWASP Top 10 A03:2021',
      cwe: 'CWE-78: OS Command Injection',
      shortExplanation: 'The diagnostic service passes user-supplied host input to the system shell using subprocess.Popen(..., shell=True). Shell metacharacters such as ";" or "|" allow executing arbitrary system binaries.',
      exploitCommand: `curl -X POST http://localhost:8080/api/v1/diagnostics/ping \\
  -H "Content-Type: application/json" \\
  -d '{"host": "127.0.0.1; id; uname -a"}'`,
      evidence: {
        httpRequest: `POST /api/v1/diagnostics/ping HTTP/1.1
Host: localhost:8080
User-Agent: AEGIS-RedAgent/1.0 (Authorized Local Probe)
Content-Type: application/json
Accept: application/json
X-Simulation-Run: RUN-1045

{
  "host": "127.0.0.1; id; uname -a",
  "count": 1
}`,
        httpResponse: `HTTP/1.1 200 OK
Date: Fri, 30 Oct 2026 12:15:04 GMT
Content-Type: application/json
X-Security-Scan-Flagged: true

{
  "output": "PING 127.0.0.1 (127.0.0.1) 56(84) bytes of data.\\n64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.031 ms\\nuid=1001(localapp) gid=1001(localapp) groups=1001(localapp)\\nLinux container-aegis 6.6.0-mock #1 SMP x86_64 GNU/Linux"
}`,
        hexView: `00000000: 7b 22 68 6f 73 74 22 3a  20 22 31 32 37 2e 30 2e  |{"host": "127.0.|
00000010: 30 2e 31 3b 20 69 64 3b  20 75 6e 61 6d 65 20 2d  |0.1; id; uname -|
00000020: 61 22 2c 20 22 63 6f 75  6e 74 22 3a 20 31 7d     |a", "count": 1} |`,
        rawLogs: `[2026-10-30T12:15:03.004Z] [Red Agent] [EXEC] Dispatching shell injection payload with ';' delimiter
[2026-10-30T12:15:03.320Z] [Red Agent] [ALERT] Server output contained system id token 'uid=1001'
[2026-10-30T12:15:04.100Z] [Sentinel Agent] [ANALYZE] Validating command execution boundary breach
[2026-10-30T12:15:04.250Z] [Sentinel Agent] [CONFIRM] Command injection confirmed: arbitrary shell command execution`,
        callStack: `File "diagnostics/runner.py", line 14, in ping_host
    cmd = f"ping -c {count} {host}"
    proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE)
Direct shell invocation executed piped commands.`
      }
    },
    proposedFix: {
      id: 'FIX-0781',
      summary: 'Enforce strict IPv4/IPv6 regex validation before command assembly. Invoke subprocess with an explicit argument list and shell=False to prevent shell parsing.',
      filePath: 'diagnostics/runner.py',
      diffStats: { additions: 7, deletions: 2 },
      diffLines: [
        { type: 'context', oldLine: 10, newLine: 10, text: 'def ping_host(host, count=1):' },
        { type: 'deletion', oldLine: 11, newLine: null, text: '-   # VULNERABLE: Direct string formatting with shell=True', comment: 'Allows shell metacharacters to execute secondary binaries' },
        { type: 'deletion', oldLine: 12, newLine: null, text: '-   return subprocess.check_output(f"ping -c {count} {host}", shell=True)' },
        { type: 'addition', oldLine: null, newLine: 11, text: '+   # REMEDIATED: Strict regex validation and list-based exec', comment: 'Validates IP syntax and avoids shell interpreter' },
        { type: 'addition', oldLine: null, newLine: 12, text: '+   if not IP_REGEX.match(host):' },
        { type: 'addition', oldLine: null, newLine: 13, text: '+       raise ValidationError("Invalid host format")' },
        { type: 'addition', oldLine: null, newLine: 14, text: '+   args = ["/bin/ping", "-c", str(int(count)), host]' },
        { type: 'addition', oldLine: null, newLine: 15, text: '+   return subprocess.check_output(args, shell=False)' },
        { type: 'context', oldLine: 13, newLine: 16, text: '' }
      ]
    },
    regression: {
      overallStatus: 'Remediated',
      isReproducible: false,
      reproducibilityLabel: 'REMEDIATED — Not Reproducible',
      summary: 'Shell metacharacters are rejected by strict regex validation before any process is spawned. Standard valid IPs continue to ping smoothly.',
      checks: [
        {
          id: 'CHK-CMD-1',
          name: 'Command Separator Injection (; id)',
          description: 'Re-evaluates probe payload with semicolon shell separator',
          status: 'PASS',
          resultText: 'HTTP 422 Unprocessable / Regex Rejection',
          reproduced: false,
          duration: '11ms'
        },
        {
          id: 'CHK-CMD-2',
          name: 'Piped Execution Attempt (| cat)',
          description: 'Tests pipe character and subshell substitution $(whoami)',
          status: 'PASS',
          resultText: 'HTTP 422 Unprocessable / Metacharacter Blocked',
          reproduced: false,
          duration: '16ms'
        },
        {
          id: 'CHK-CMD-3',
          name: 'Legitimate Localhost Ping (127.0.0.1)',
          description: 'Validates standard diagnosis functions correctly for valid IP',
          status: 'PASS',
          resultText: 'HTTP 200 OK / Ping Completed',
          reproduced: false,
          duration: '45ms'
        },
        {
          id: 'CHK-CMD-4',
          name: 'Count Parameter Type Enforcement',
          description: 'Ensures count cannot be leveraged for argument injection',
          status: 'PASS',
          resultText: 'HTTP 200 OK / Integer Coerced',
          reproduced: false,
          duration: '12ms'
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
    testCaseId: 'command-injection',
    testName: 'Command injection check',
    targetLabel: 'Local training app (diag-service:v1.4.2)',
    findingsCount: 1,
    severity: 'High',
    status: 'Completed',
    remediated: true,
    duration: '8.4s',
    timestamp: '2 hours ago'
  }
];

if (typeof window !== 'undefined') {
  window.AEGIS_MOCK = {
    testCases: MOCK_TEST_CASES,
    recentRuns: INITIAL_RECENT_RUNS
  };
}
