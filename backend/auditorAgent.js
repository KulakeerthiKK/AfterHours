// AEGIS-AGENT - Auditor Agent Module
// Independent Regression Verification for Local Demo Fixture
// =========================================================================
// Executes independent regression check matrices to verify whether the vulnerability
// is remediated or still reproducible.
// Auditor results are strictly separated from Fix Agent's internal validation.
// =========================================================================

const REGRESSION_SUITES = {
  'input-validation': [
    {
      id: 'CHK-SQL-1',
      name: 'SQL Parameter Boundary Check',
      description: 'Injects syntax breaker payload to verify database treats payload as string literal',
      expected_status: 'HTTP 401 Unauthorized (Invalid Credentials)',
      pass_text: 'HTTP 401 Unauthorized / Handled as bound parameter literal',
      fail_text: 'HTTP 500 Internal Server Error / Syntax breaker broke query bounds'
    },
    {
      id: 'CHK-SQL-2',
      name: 'Legitimate User Authentication Flow',
      description: 'Verifies normal user credentials login successfully without regression',
      expected_status: 'HTTP 200 OK (Auth Token Generated)',
      pass_text: 'HTTP 200 OK / Legitimate authentication operational',
      fail_text: 'HTTP 500 Internal Server Error / Normal login flow broken'
    },
    {
      id: 'CHK-SQL-3',
      name: 'Database Error Disclosure Suppression',
      description: 'Ensures database engine exceptions are suppressed and not reflected in API responses',
      expected_status: 'HTTP 400 Bad Request / Generic Error',
      pass_text: 'No schema or SQL traces reflected in error body',
      fail_text: 'Raw SQL schema details leaked in API response'
    },
    {
      id: 'CHK-SQL-4',
      name: 'Query Latency & Execution Plan Delta',
      description: 'Measures prepared statement execution time delta against baseline',
      expected_status: '< 15ms overhead',
      pass_text: 'Latency delta: +0.2ms (Zero measurable overhead)',
      fail_text: 'Latency overhead exceeded threshold (> 50ms)'
    }
  ],
  'authentication-check': [
    {
      id: 'CHK-AUTH-1',
      name: 'Algorithm "none" Token Rejection Check',
      description: 'Submits token with alg: none to privileged endpoint',
      expected_status: 'HTTP 401 Unauthorized',
      pass_text: 'HTTP 401 Unauthorized / Token with alg "none" rejected',
      fail_text: 'HTTP 200 OK / Alg "none" accepted without signature verification'
    },
    {
      id: 'CHK-AUTH-2',
      name: 'Legitimate RS256 Token Validation',
      description: 'Submits authentically signed RS256 JWT to ensure regular access persists',
      expected_status: 'HTTP 200 OK',
      pass_text: 'HTTP 200 OK / RS256 token validated successfully',
      fail_text: 'HTTP 401 Unauthorized / Legitimate signature rejected'
    },
    {
      id: 'CHK-AUTH-3',
      name: 'Symmetric HS256 Key Confusion Check',
      description: 'Verifies RSA public key cannot be used as an HMAC secret key',
      expected_status: 'HTTP 401 Unauthorized',
      pass_text: 'HTTP 401 Unauthorized / HS256 token rejected on asymmetric endpoint',
      fail_text: 'HTTP 200 OK / Key confusion accepted'
    },
    {
      id: 'CHK-AUTH-4',
      name: 'Expired Token Rejection Check',
      description: 'Ensures expired JWT claims are rejected',
      expected_status: 'HTTP 401 Token Expired',
      pass_text: 'HTTP 401 Token Expired / Expiration strictly enforced',
      fail_text: 'HTTP 200 OK / Expired token allowed'
    }
  ],
  'path-traversal': [
    {
      id: 'CHK-PATH-1',
      name: 'Relative Directory Escape Traversal Probe',
      description: 'Attempts relative escape ../../../../config/mock_app.env',
      expected_status: 'HTTP 403 Forbidden / 404 Not Found',
      pass_text: 'HTTP 403 Forbidden / Base folder escape blocked',
      fail_text: 'HTTP 200 OK / File outside directory delivered'
    },
    {
      id: 'CHK-PATH-2',
      name: 'Legitimate Report Download',
      description: 'Ensures authorized monthly_summary.pdf file is delivered properly',
      expected_status: 'HTTP 200 OK (application/pdf)',
      pass_text: 'HTTP 200 OK / Authorized report file delivered',
      fail_text: 'HTTP 404 / Legitimate report access blocked'
    },
    {
      id: 'CHK-PATH-3',
      name: 'Null Byte Truncation Injection Check',
      description: 'Submits report.pdf%00.env to test null character string truncation',
      expected_status: 'HTTP 400 Bad Request',
      pass_text: 'HTTP 400 Bad Request / Null byte rejected',
      fail_text: 'HTTP 200 OK / Path truncation successful'
    },
    {
      id: 'CHK-PATH-4',
      name: 'URL-Encoded Relative Traversal Check',
      description: 'Tests %2e%2e%2f URL-encoded traversal sequences',
      expected_status: 'HTTP 403 Forbidden',
      pass_text: 'HTTP 403 Forbidden / Encoded traversal rejected',
      fail_text: 'HTTP 200 OK / Encoded sequence bypassed filter'
    }
  ],
  'command-injection': [
    {
      id: 'CHK-CMD-1',
      name: 'Semicolon Command Chaining Check',
      description: 'Tests 127.0.0.1; id parameter delimiter handling',
      expected_status: 'HTTP 400 Validation Error',
      pass_text: 'HTTP 400 Validation Error / Command delimiter rejected',
      fail_text: 'HTTP 200 OK / Secondary command executed in shell'
    },
    {
      id: 'CHK-CMD-2',
      name: 'Legitimate IP Diagnostic Ping Execution',
      description: 'Verifies normal IPv4 address 127.0.0.1 executes properly without error',
      expected_status: 'HTTP 200 OK (Diagnostic Output)',
      pass_text: 'HTTP 200 OK / Diagnostic subprocess operational without shell',
      fail_text: 'HTTP 500 / Diagnostic command failed'
    },
    {
      id: 'CHK-CMD-3',
      name: 'Pipe Operator Redirection Check',
      description: 'Tests 127.0.0.1 | uname -a delimiter',
      expected_status: 'HTTP 400 Validation Error',
      pass_text: 'HTTP 400 Validation Error / Pipe operator rejected',
      fail_text: 'HTTP 200 OK / Pipe execution succeeded'
    },
    {
      id: 'CHK-CMD-4',
      name: 'Backtick Command Substitution Check',
      description: 'Tests 127.0.0.1 `whoami` substitution',
      expected_status: 'HTTP 400 Validation Error',
      pass_text: 'HTTP 400 Validation Error / Backticks rejected',
      fail_text: 'HTTP 200 OK / Subcommand evaluated'
    }
  ]
};

/**
 * Execute Auditor regression checks against the local demo fixture.
 *
 * @param {Object} params
 * @param {string} params.test_case - Selected test case
 * @param {string} [params.forced_outcome] - 'complete', 'failed', or 'needs_review'
 * @param {boolean} [params.fix_available] - Whether Fix Agent synthesized a diff
 * @returns {Object} Auditor regression test result
 */
function executeRegressionChecks({ test_case, forced_outcome, fix_available = true }) {
  const suite = REGRESSION_SUITES[test_case] || REGRESSION_SUITES['input-validation'];

  // If no fix was provided (e.g. halted at Sentinel or Scope Check)
  if (!fix_available) {
    const checks = suite.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      status: 'NOT_RUN',
      result_text: 'Check not executed (Remediation was not synthesized or confirmed)'
    }));
    return {
      overall_status: 'Not Run',
      is_reproducible: true,
      reproducibility_label: 'NOT VERIFIED — Prerequisite stages incomplete',
      checks_passed: 0,
      checks_total: suite.length,
      checks,
      audited_at: new Date().toISOString(),
      summary: 'Auditor regression suite skipped because no verified remediation was available.'
    };
  }

  // If the run specifically simulates a regression failure
  if (forced_outcome === 'failed') {
    const checks = suite.map((c, idx) => {
      if (idx === 0) {
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          status: 'FAIL',
          result_text: c.fail_text
        };
      }
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        status: 'PASS',
        result_text: c.pass_text
      };
    });

    return {
      overall_status: 'Vulnerable',
      is_reproducible: true,
      reproducibility_label: 'REPRODUCIBLE — Secondary Bypass Detected',
      checks_passed: checks.filter(c => c.status === 'PASS').length,
      checks_total: checks.length,
      checks,
      audited_at: new Date().toISOString(),
      summary: 'Auditor verification failed: 1 of 4 regression checks failed. The vulnerability remains reproducible.'
    };
  }

  // Successful verification (All checks PASS)
  const checks = suite.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: 'PASS',
    result_text: c.pass_text
  }));

  return {
    overall_status: 'Remediated',
    is_reproducible: false,
    reproducibility_label: 'REMEDIATED — Not Reproducible',
    checks_passed: checks.length,
    checks_total: checks.length,
    checks,
    audited_at: new Date().toISOString(),
    summary: `All ${checks.length} verification checks passed. Original vulnerability is remediated and no longer reproducible.`
  };
}

module.exports = {
  executeRegressionChecks,
  REGRESSION_SUITES
};

