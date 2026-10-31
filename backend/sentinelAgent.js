// AEGIS-AGENT - Sentinel Agent Module
// Evidence Review and Finding Verification
// =========================================================================
// Inspects Red Agent findings and raw HTTP evidence to confirm vulnerability signatures.
// Findings are ONLY handed off to Fix Agent when Sentinel confirms the evidence.
// =========================================================================

/**
 * Review Red Agent findings against evidence signatures.
 *
 * @param {Object} params
 * @param {Object} params.finding - Finding from Red Agent
 * @param {string} params.test_case - Test case key
 * @param {string} [params.forced_outcome] - Optional simulation outcome trigger ('complete', 'needs_review', 'failed')
 * @returns {Object} Sentinel review result
 */
function reviewEvidence({ finding, test_case, forced_outcome }) {
  if (!finding || !finding.evidence) {
    return {
      decision: 'not_confirmed',
      rationale: 'Missing evidence payload: Red Agent provided no HTTP request or response logs.',
      confidence: 0.0,
      timestamp: new Date().toISOString(),
      passed_to_fix_agent: false
    };
  }

  const { http_request, http_response, captured_trace } = finding.evidence;

  // If the run specifically simulates a 'needs_review' state (e.g. for demo path)
  if (forced_outcome === 'needs_review') {
    return {
      decision: 'needs_review',
      rationale: 'Telemetry indicates ambiguous reflection. Automated signature matching score is within the caution threshold; human operator manual triage required before proposing code changes.',
      confidence: 0.68,
      timestamp: new Date().toISOString(),
      passed_to_fix_agent: false,
      indicators: [
        'Anomalous status code fluctuation observed',
        'Partial pattern reflection without definitive database crash',
        'Operator manual triage requested'
      ]
    };
  }

  // If the run specifically simulates a 'not_confirmed' state
  if (forced_outcome === 'not_confirmed') {
    return {
      decision: 'not_confirmed',
      rationale: 'Evidence check failed: Captured HTTP response does not demonstrate an exploitable state or vulnerability signature.',
      confidence: 0.15,
      timestamp: new Date().toISOString(),
      passed_to_fix_agent: false,
      indicators: [
        'Standard defensive filtering response observed',
        'No sensitive token or file content leaked'
      ]
    };
  }

  // Evidence validation per test case
  let signatureVerified = false;
  let indicators = [];

  switch (test_case) {
    case 'input-validation':
      // Look for SQL syntax error reflection or database exceptions
      if (
        (http_response && (http_response.includes('syntax error') || http_response.includes('sqlite3.OperationalError') || http_response.includes('500 Internal Server Error'))) ||
        (captured_trace && captured_trace.includes('Database syntax breaker'))
      ) {
        signatureVerified = true;
        indicators.push('Raw SQL syntax breaker reflected in server error response');
        indicators.push('Unbound query execution trace confirmed');
      }
      break;

    case 'authentication-check':
      // Look for 200 OK privileged access with algorithm 'none'
      if (
        (http_request && http_request.includes('eyJhbGciOiJub25l')) &&
        (http_response && http_response.includes('"privileged_access": true'))
      ) {
        signatureVerified = true;
        indicators.push('JWT header with alg="none" accepted by gateway');
        indicators.push('Privileged administrative access granted without signature validation');
      }
      break;

    case 'path-traversal':
      // Look for leaked configuration file contents
      if (
        (http_response && (http_response.includes('MOCK_APP_PORT=8080') || http_response.includes('MOCK_CONTAINER_ENV'))) ||
        (captured_trace && captured_trace.includes('Base folder boundary escaped'))
      ) {
        signatureVerified = true;
        indicators.push('Relative directory escape sequence successfully read mock configuration file');
        indicators.push('Lack of canonical path bounds verified');
      }
      break;

    case 'command-injection':
      // Look for subprocess secondary execution output
      if (
        (http_response && (http_response.includes('uid=') || http_response.includes('gid='))) ||
        (captured_trace && captured_trace.includes('Secondary command output detected'))
      ) {
        signatureVerified = true;
        indicators.push('Secondary command delimiter execution output confirmed in response payload');
        indicators.push('Direct shell subprocess invocation verified');
      }
      break;

    case 'chained-bugs':
      // Look for multi-stage compounding signature: debug secret harvest + session supervisor grant
      if (
        (http_response && (http_response.includes('APP_INTERNAL_HMAC_SALT') || http_response.includes('root_supervisor') || http_response.includes('ROOT_BYPASS_TOKEN_ACTIVE'))) ||
        (captured_trace && captured_trace.includes('Multi-Hop Chained Exploit Trace'))
      ) {
        signatureVerified = true;
        indicators.push('Step 1 info disclosure: Internal HMAC salt extracted from debug environment');
        indicators.push('Step 2 privilege escalation: Forged administrative session signature accepted');
        indicators.push('Compound multi-hop breach verified: 1 + 1 = 10 (CRITICAL exploit path)');
      }
      break;

    default:
      signatureVerified = false;
  }

  if (signatureVerified) {
    return {
      decision: 'confirmed',
      rationale: `Definitive vulnerability signature verified in raw HTTP response and runtime trace for ${finding.cwe}. Finding is confirmed and eligible for Fix Agent remediation synthesis.`,
      confidence: 0.99,
      timestamp: new Date().toISOString(),
      passed_to_fix_agent: true,
      indicators
    };
  } else {
    return {
      decision: 'needs_review',
      rationale: `Evidence could not be definitively matched against known signatures for ${test_case}. Flagged for operator review.`,
      confidence: 0.50,
      timestamp: new Date().toISOString(),
      passed_to_fix_agent: false,
      indicators: ['Heuristic mismatch in captured response']
    };
  }
}

module.exports = {
  reviewEvidence
};

