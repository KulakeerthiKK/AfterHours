// AEGIS-AGENT Backend API Route Handlers
// Extended with P0-P2 Capabilities: Normalized Scanner Hub, Findings API, Attack-Path, and Security Memory
// =========================================================================

const runsStore = require('./runsStore');
const { formatReportAsMarkdown } = require('./reportGenerator');
const { runLocalScanner, SCANNER_RULES, ALLOWED_SCAN_TARGETS } = require('./scannerAdapter');
const { getAttackPaths, getAttackPathById } = require('./attackPathEngine');
const securityMemory = require('./securityMemory');
const { calculateRiskScore } = require('./riskPrioritizer');
const { generateRemediation } = require('./fixAgent');
const { executeRegressionChecks } = require('./auditorAgent');
const db = require('./db');
const { generateLlmRemediation } = require('./llmProvider');

// In-memory scans and findings store
const activeScans = new Map();
const allFindings = new Map();
let activeResearchSession = null;

// Initialize seeded findings from scanner
function initSeededFindings() {
  const defaultScan = runLocalScanner({ target_id: 'Local training app (auth-service:v1.4.2)' });
  activeScans.set(defaultScan.scan_id, defaultScan);
  defaultScan.findings.forEach(f => {
    const risk = calculateRiskScore(f);
    f.risk_score = risk.risk_score;
    f.priority_tier = risk.priority_tier;
    f.risk_explanation = risk.explanation;
    securityMemory.recordFinding(f);
    allFindings.set(f.finding_id, f);

    // Register friendly aliases for both formats (FIND-CWE* and VULN-*)
    if (f.cwe === 'CWE-89') allFindings.set('FIND-CWE89-01', f);
    if (f.cwe === 'CWE-287') allFindings.set('FIND-CWE287-01', f);
    if (f.cwe === 'CWE-22') allFindings.set('FIND-CWE22-01', f);
    if (f.cwe === 'CWE-78') allFindings.set('FIND-CWE78-01', f);
    if (f.cwe === 'CWE-798') allFindings.set('FIND-CWE798-01', f);

    // Persist finding into database
    try {
      db.createFinding(f);
    } catch (e) { }
  });
}
initSeededFindings();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'X-Prototype-Notice': 'AEGIS-AGENT-Local-Demo'
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'X-Prototype-Notice': 'AEGIS-AGENT-Local-Demo'
  });
  res.end(text);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload Too Large'));
      }
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', err => reject(err));
  });
}

async function handleApiRequest(req, res) {
  const method = req.method.toUpperCase();
  const urlParts = req.url.split('?');
  const urlPath = urlParts[0];
  const queryString = urlParts[1] || '';

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept'
    });
    res.end();
    return;
  }

  // =========================================================================
  // HEALTH CHECK API: GET /api/health (Secrets strictly redacted)
  // =========================================================================
  if (method === 'GET' && (urlPath === '/api/health' || urlPath === '/api/health/')) {
    const dbHealth = db.getDbHealth();
    const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('replace_with'));
    sendJson(res, 200, {
      status: 'ok',
      service: 'AEGIS-AGENT Security War Room API',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      ai_provider: {
        configured: hasOpenRouterKey,
        provider: 'openrouter',
        model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
        base_url: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
      },
      scope: {
        mode: 'authorized_local_only',
        allowed_targets: ALLOWED_SCAN_TARGETS
      },
      notice: 'Front-end demo — no real scans or code changes'
    });
    return;
  }

  // =========================================================================
  // P0 SCANNER API: POST /api/scans
  // =========================================================================
  if (method === 'POST' && (urlPath === '/api/scans' || urlPath === '/api/scans/')) {
    try {
      const body = await parseJsonBody(req);
      const target = body.target_id || 'Local training app (auth-service:v1.4.2)';
      const profile = body.profile || 'all';

      const scanResult = runLocalScanner({ target_id: target, profile });
      activeScans.set(scanResult.scan_id, scanResult);

      scanResult.findings.forEach(f => {
        const risk = calculateRiskScore(f);
        f.risk_score = risk.risk_score;
        f.priority_tier = risk.priority_tier;
        f.risk_explanation = risk.explanation;
        securityMemory.recordFinding(f);
        allFindings.set(f.finding_id, f);
      });

      sendJson(res, 201, scanResult);
      return;
    } catch (err) {
      sendJson(res, 400, { error: 'Bad Request', message: err.message });
      return;
    }
  }

  // Route: GET /api/scans/:id
  const scanMatch = urlPath.match(/^\/api\/scans\/([^\/]+)$/);
  if (method === 'GET' && scanMatch) {
    const scanId = decodeURIComponent(scanMatch[1]);
    const scan = activeScans.get(scanId);
    if (!scan) {
      sendJson(res, 404, { error: 'Not Found', message: `Scan '${scanId}' not found.` });
      return;
    }
    sendJson(res, 200, scan);
    return;
  }

  // =========================================================================
  // P0 FINDINGS API: GET /api/findings
  // =========================================================================
  if (method === 'GET' && (urlPath === '/api/findings' || urlPath === '/api/findings/')) {
    const list = Array.from(allFindings.values());
    sendJson(res, 200, {
      findings: list,
      count: list.length,
      notice: 'Front-end demo — no real scans or code changes'
    });
    return;
  }

  // Route: GET /api/findings/:id
  const findingMatch = urlPath.match(/^\/api\/findings\/([^\/]+)$/);
  if (method === 'GET' && findingMatch) {
    const findingId = decodeURIComponent(findingMatch[1]);
    const finding = allFindings.get(findingId);
    if (!finding) {
      sendJson(res, 404, { error: 'Not Found', message: `Finding '${findingId}' not found.` });
      return;
    }
    const mem = securityMemory.getMemoryByFingerprint(finding.fingerprint);
    sendJson(res, 200, {
      ...finding,
      regression_memory: mem || null
    });
    return;
  }

  // Route: POST /api/findings/:id/verify (Sentinel verification check)
  const verifyMatch = urlPath.match(/^\/api\/findings\/([^\/]+)\/verify$/);
  if (method === 'POST' && verifyMatch) {
    const findingId = decodeURIComponent(verifyMatch[1]);
    const finding = allFindings.get(findingId);
    if (!finding) {
      sendJson(res, 404, { error: 'Not Found', message: `Finding '${findingId}' not found.` });
      return;
    }
    finding.verification_status = 'CONFIRMED';
    finding.verified_at = new Date().toISOString();
    sendJson(res, 200, {
      finding_id: findingId,
      verification_status: 'CONFIRMED',
      confidence: 0.99,
      rationale: finding.confidence_basis || 'Verified by Sentinel Agent heuristic signature check.'
    });
    return;
  }

  // Route: POST /api/findings/:id/propose-fix (Fix Agent OpenRouter / AST synthesis)
  const proposeFixMatch = urlPath.match(/^\/api\/findings\/([^\/]+)\/propose-fix$/);
  if (method === 'POST' && proposeFixMatch) {
    const findingId = decodeURIComponent(proposeFixMatch[1]);
    const finding = allFindings.get(findingId);
    if (!finding) {
      sendJson(res, 404, { error: 'Not Found', message: `Finding '${findingId}' not found.` });
      return;
    }
    const testCase = finding.cwe === 'CWE-89' ? 'input-validation' :
                     finding.cwe === 'CWE-287' ? 'authentication-check' :
                     finding.cwe === 'CWE-22' ? 'path-traversal' : 'command-injection';

    // Call Fix Agent via backend OpenRouter AI client (with local AST fallback)
    const fixResult = await generateLlmRemediation({
      finding: { ...finding, test_case: testCase, id: finding.finding_id },
      workspace_id: 'Local training app (auth-service:v1.4.2)',
      run_id: finding.run_id
    });

    finding.remediation_status = 'PROPOSED';
    finding.candidate_fix = fixResult;
    sendJson(res, 200, fixResult);
    return;
  }

  // Route: POST /api/proposals/:id/decision (Explicit human approval or rejection)
  const proposalDecisionMatch = urlPath.match(/^\/api\/proposals\/([^\/]+)\/decision$/);
  if (method === 'POST' && proposalDecisionMatch) {
    try {
      const proposalId = decodeURIComponent(proposalDecisionMatch[1]);
      const body = await parseJsonBody(req);
      const decision = body.decision === 'rejected' ? 'REJECTED' : 'APPROVED_FOR_DEMO';
      const reason = body.reason || 'Operator human-in-the-loop decision';

      await db.recordApproval({
        proposal_id: proposalId,
        decision,
        reviewer: body.reviewer || 'human_operator',
        reason
      });

      sendJson(res, 200, {
        success: true,
        proposal_id: proposalId,
        decision,
        reason,
        timestamp: new Date().toISOString()
      });
      return;
    } catch (e) {
      sendJson(res, 400, { error: 'Bad Request', message: e.message });
      return;
    }
  }

  // Route: POST /api/findings/:id/approve and /reject
  const approveFindingMatch = urlPath.match(/^\/api\/findings\/([^\/]+)\/approve$/);
  if (method === 'POST' && approveFindingMatch) {
    const findingId = decodeURIComponent(approveFindingMatch[1]);
    const finding = allFindings.get(findingId);
    if (!finding) {
      sendJson(res, 404, { error: 'Not Found', message: `Finding '${findingId}' not found.` });
      return;
    }
    finding.approval_state = 'APPROVED_FOR_DEMO';
    try {
      await db.recordApproval({
        proposal_id: `PROP-${findingId}`,
        decision: 'APPROVED_FOR_DEMO',
        reviewer: 'human_operator',
        reason: 'Operator approved remediation patch'
      });
    } catch (e) { }

    sendJson(res, 200, { success: true, finding_id: findingId, approval_state: 'APPROVED_FOR_DEMO' });
    return;
  }

  const rejectFindingMatch = urlPath.match(/^\/api\/findings\/([^\/]+)\/reject$/);
  if (method === 'POST' && rejectFindingMatch) {
    const findingId = decodeURIComponent(rejectFindingMatch[1]);
    const finding = allFindings.get(findingId);
    if (!finding) {
      sendJson(res, 404, { error: 'Not Found', message: `Finding '${findingId}' not found.` });
      return;
    }
    finding.approval_state = 'REJECTED';
    sendJson(res, 200, { success: true, finding_id: findingId, approval_state: 'REJECTED' });
    return;
  }

  // Route: POST /api/findings/:id/regression (Auditor regression execution)
  const regressionMatch = urlPath.match(/^\/api\/findings\/([^\/]+)\/regression$/);
  if (method === 'POST' && regressionMatch) {
    const findingId = decodeURIComponent(regressionMatch[1]);
    const finding = allFindings.get(findingId);
    if (!finding) {
      sendJson(res, 404, { error: 'Not Found', message: `Finding '${findingId}' not found.` });
      return;
    }
    const testCase = finding.cwe === 'CWE-89' ? 'input-validation' :
                     finding.cwe === 'CWE-287' ? 'authentication-check' :
                     finding.cwe === 'CWE-22' ? 'path-traversal' : 'command-injection';
    const regResult = executeRegressionChecks({ test_case: testCase, forced_outcome: 'complete' });
    securityMemory.updateRegression(finding.fingerprint, {
      status: regResult.overall_status === 'Remediated' ? 'VERIFIED_REMEDIATED' : 'REPRODUCIBLE',
      checks_passed: regResult.checks_passed,
      checks_total: regResult.checks_total
    });
    sendJson(res, 200, regResult);
    return;
  }

  // =========================================================================
  // P1 ATTACK-PATH API: GET /api/attack-paths
  // =========================================================================
  if (method === 'GET' && (urlPath === '/api/attack-paths' || urlPath === '/api/attack-paths/')) {
    const paths = getAttackPaths();
    sendJson(res, 200, {
      attack_paths: paths,
      count: paths.length,
      notice: 'Front-end demo — no real scans or code changes'
    });
    return;
  }

  // Route: GET /api/security-memory
  if (method === 'GET' && urlPath === '/api/security-memory') {
    const memories = securityMemory.listMemories();
    sendJson(res, 200, {
      memories,
      count: memories.length,
      notice: 'Front-end demo — no real scans or code changes'
    });
    return;
  }

  // =========================================================================
  // PRESERVED STAGE 2 RUNS API
  // =========================================================================

  // Route: POST /api/runs (Create new run)
  if (method === 'POST' && (urlPath === '/api/runs' || urlPath === '/api/runs/')) {
    try {
      const body = await parseJsonBody(req);
      const validation = runsStore.validateNewRunRequest(body);

      if (!validation.valid) {
        sendJson(res, 400, {
          error: validation.error || 'Bad Request',
          message: validation.message || 'Validation failed',
          is_simulated: true
        });
        return;
      }

      const run = runsStore.createRun({
        target_id: body.target_id,
        test_case: body.test_case,
        scope_confirmed: body.scope_confirmed,
        simulation_outcome: body.simulation_outcome
      });

      // Persist run and initial event in database
      try {
        await db.createScanRun({
          id: run.run_id,
          target_label: run.target_id || 'Local training app',
          scope_id: 'SEC-LOCAL-8080',
          status: run.status,
          run_mode: 'authorized_local'
        });
        await db.recordAgentEvent({
          run_id: run.run_id,
          agent_name: 'coordinator',
          stage: 'scope_check',
          status: 'success',
          summary: `Initiated run for test case '${run.test_name}' on authorized local target`
        });
      } catch (dbErr) { }

      sendJson(res, 201, {
        run_id: run.run_id,
        status: run.status,
        current_stage: run.current_stage,
        target_id: run.target_id,
        test_case: run.test_case,
        test_name: run.test_name,
        message: 'Workflow run initiated on authorized local target (simulated mock execution)',
        created_at: run.created_at,
        is_simulated: true,
        notice: 'Front-end demo — no real scans or code changes'
      });
      return;
    } catch (err) {
      sendJson(res, 400, {
        error: 'Bad Request',
        message: err.message || 'Unable to parse request body'
      });
      return;
    }
  }

  // Route: GET /api/runs/:run_id/report (Export structured audit report)
  const reportMatch = urlPath.match(/^\/api\/runs\/([^\/]+)\/report$/);
  if (method === 'GET' && reportMatch) {
    const requestedRunId = decodeURIComponent(reportMatch[1]);
    const report = runsStore.getAuditReport(requestedRunId);

    if (!report) {
      sendJson(res, 404, {
        error: 'Not Found',
        run_id: requestedRunId,
        message: `Run '${requestedRunId}' was not found in the local simulation store.`
      });
      return;
    }

    if (queryString.includes('format=md') || (req.headers.accept && req.headers.accept.includes('text/markdown'))) {
      const markdown = formatReportAsMarkdown(report);
      sendText(res, 200, markdown, 'text/markdown; charset=utf-8');
      return;
    }

    sendJson(res, 200, report);
    return;
  }

  // Route: POST /api/runs/:run_id/approve-fix (Human approval)
  const approveMatch = urlPath.match(/^\/api\/runs\/([^\/]+)\/approve-fix$/);
  if (method === 'POST' && approveMatch) {
    const runId = decodeURIComponent(approveMatch[1]);
    const updated = runsStore.approveFix(runId);
    if (!updated) {
      sendJson(res, 404, { error: 'Not Found', message: `Run '${runId}' not found.` });
      return;
    }
    sendJson(res, 200, {
      success: true,
      run_id: runId,
      approval_state: updated.approval_state,
      message: 'Proposed fix approved for local demo. No repository files or Git branches were modified.'
    });
    return;
  }

  // Route: POST /api/runs/:run_id/reject-fix (Human rejection)
  const rejectMatch = urlPath.match(/^\/api\/runs\/([^\/]+)\/reject-fix$/);
  if (method === 'POST' && rejectMatch) {
    const runId = decodeURIComponent(rejectMatch[1]);
    const updated = runsStore.rejectFix(runId);
    if (!updated) {
      sendJson(res, 404, { error: 'Not Found', message: `Run '${runId}' not found.` });
      return;
    }
    sendJson(res, 200, {
      success: true,
      run_id: runId,
      approval_state: updated.approval_state,
      message: 'Proposed fix rejected by human reviewer.'
    });
    return;
  }

  // Route: POST /api/runs/:run_id/retry (Bounded retry)
  const retryMatch = urlPath.match(/^\/api\/runs\/([^\/]+)\/retry$/);
  if (method === 'POST' && retryMatch) {
    const runId = decodeURIComponent(retryMatch[1]);
    const result = runsStore.retryRun(runId);
    if (!result) {
      sendJson(res, 404, { error: 'Not Found', message: `Run '${runId}' not found.` });
      return;
    }
    if (result.error) {
      sendJson(res, 429, { error: 'Rate Limit', message: result.error });
      return;
    }
    sendJson(res, 200, {
      success: true,
      run_id: runId,
      status: result.status,
      retry_count: result.retry_count,
      message: `Run ${runId} re-queued (Attempt ${result.retry_count}/3).`
    });
    return;
  }

  // Route: POST /api/reset (Reset store to clean initial state)
  if (method === 'POST' && (urlPath === '/api/reset' || urlPath === '/api/reset/')) {
    const result = runsStore.resetStore();
    initSeededFindings();
    sendJson(res, 200, result);
    return;
  }

  // Route: GET /api/runs/:run_id (Get run details)
  const runIdMatch = urlPath.match(/^\/api\/runs\/([^\/]+)$/);
  if (method === 'GET' && runIdMatch) {
    const requestedRunId = decodeURIComponent(runIdMatch[1]);
    const run = runsStore.getRun(requestedRunId);

    if (!run) {
      sendJson(res, 404, {
        error: 'Not Found',
        run_id: requestedRunId,
        message: `Run '${requestedRunId}' was not found in the local simulation store.`
      });
      return;
    }

    sendJson(res, 200, run);
    return;
  }

  // Route: GET /api/runs (List recent runs from store & persistent database)
  if (method === 'GET' && (urlPath === '/api/runs' || urlPath === '/api/runs/')) {
    const list = runsStore.listRuns();
    try {
      const dbRuns = await db.listScanRuns();
      if (dbRuns && dbRuns.length > 0) {
        const seen = new Set(list.map(r => r.run_id));
        dbRuns.forEach(dbr => {
          if (!seen.has(dbr.id)) {
            seen.add(dbr.id);
            list.push({
              run_id: dbr.id,
              target_id: dbr.target_label,
              test_case: 'input-validation',
              test_name: 'Input validation check (CWE-89)',
              status: dbr.status,
              created_at: dbr.started_at,
              current_stage: 5,
              is_simulated: false
            });
          }
        });
      }
    } catch (dbErr) { }

    sendJson(res, 200, {
      runs: list,
      count: list.length,
      notice: 'Front-end demo — no real scans or code changes'
    });
    return;
  }

  // =========================================================================
  // RESEARCH & INGESTION API: Target Context (GitHub repo, Staging URL, API specs)
  // =========================================================================

  // Route: POST /api/research/ingest
  if (method === 'POST' && (urlPath === '/api/research/ingest' || urlPath === '/api/research/ingest/')) {
    try {
      const body = await parseJsonBody(req);
      const repoUrl = (body.repo_url || '').trim();
      const stagingUrl = (body.staging_url || '').trim();
      const branch = (body.branch || 'main').trim();
      const specType = body.api_spec_type || 'openapi_v3';
      const specContent = body.api_spec_content || '';
      const authHeader = (body.auth_header || '').trim();
      const notes = (body.notes || '').trim();
      const scopeConfirmed = body.scope_confirmed === true || body.scope_confirmed === 'true';

      if (!repoUrl && !stagingUrl) {
        sendJson(res, 400, {
          error: 'Missing target specification',
          message: 'Please provide at least a GitHub / Git repository URL or a Staging / Target URL.'
        });
        return;
      }

      const researchId = `RES-${Date.now().toString().slice(-4)}`;
      
      let targetLabel = 'Local training app (auth-service:v1.4.2)';
      if (repoUrl.includes('gateway') || stagingUrl.includes('8081')) {
        targetLabel = 'Local training app (session-gateway:v1.4.2)';
      } else if (repoUrl.includes('report') || stagingUrl.includes('8082')) {
        targetLabel = 'Local training app (report-service:v1.4.2)';
      } else if (repoUrl.includes('diag') || stagingUrl.includes('8083')) {
        targetLabel = 'Local training app (diag-service:v1.4.2)';
      }

      let scopeNotice = 'AUTHORIZED_LOCAL_SANDBOX';
      const lowerStaging = stagingUrl.toLowerCase();
      if (lowerStaging.startsWith('http://') || lowerStaging.startsWith('https://')) {
        if (!lowerStaging.includes('localhost') && !lowerStaging.includes('127.0.0.1') && !lowerStaging.includes('.internal')) {
          scopeNotice = 'MAPPED_TO_LOCAL_SANDBOX';
        }
      }

      const discoveredRoutes = [
        {
          method: 'POST',
          path: '/api/v1/auth/login',
          component: 'authService.js:42',
          parameters: ['username', 'password'],
          auth_required: false,
          risk_surface: 'High',
          cwe_risk: 'CWE-89 (SQL Injection)',
          description: 'User authentication endpoint using database query concatenation'
        },
        {
          method: 'GET',
          path: '/api/v1/reports/download',
          component: 'reportService.js:88',
          parameters: ['filename', 'format'],
          auth_required: true,
          risk_surface: 'Medium',
          cwe_risk: 'CWE-22 (Path Traversal)',
          description: 'Document exporter reading local directory without canonicalization'
        },
        {
          method: 'GET',
          path: '/api/v1/diagnostic/ping',
          component: 'pingUtil.js:15',
          parameters: ['host', 'count'],
          auth_required: true,
          risk_surface: 'Critical',
          cwe_risk: 'CWE-78 (Command Injection)',
          description: 'Subprocess system diagnostic utility executing OS ping'
        }
      ];

      const result = {
        research_id: researchId,
        target_id: targetLabel,
        repo_url: repoUrl || 'https://github.com/aegis-agent/auth-service',
        staging_url: stagingUrl || 'http://127.0.0.1:8080',
        branch,
        api_spec_type: specType,
        has_auth_header: Boolean(authHeader),
        notes: notes || 'Target context ingested for AST surface mapping',
        scope_status: scopeConfirmed ? 'AUTHORIZED' : 'NEEDS_SCOPE_CONFIRMATION',
        scope_notice: scopeNotice,
        ingested_at: new Date().toISOString(),
        ast_analysis: {
          framework: repoUrl.includes('python') || repoUrl.includes('fastapi') ? 'FastAPI 0.110 / Python 3.10' : 'Node.js 20.x / Express 4.19',
          database: 'SQLite 3 (Knex.js ORM)',
          discovered_routes: discoveredRoutes,
          endpoint_count: discoveredRoutes.length,
          confidence_score: '98.7%',
          risk_tier: 'P0 Critical (Authentication & Command Execution)'
        },
        readiness: 'READY_FOR_WARROOM',
        test_case_recommended: 'cwe-89',
        notice: 'Front-end demo - no real scans or code changes'
      };

      activeResearchSession = result;
      sendJson(res, 201, result);
      return;
    } catch (err) {
      sendJson(res, 400, { error: 'Bad Request', message: err.message });
      return;
    }
  }

  // Route: GET /api/research/latest
  if (method === 'GET' && (urlPath === '/api/research/latest' || urlPath === '/api/research/latest/')) {
    sendJson(res, 200, activeResearchSession || {
      research_id: 'RES-DEFAULT',
      target_id: 'Local training app (auth-service:v1.4.2)',
      repo_url: 'https://github.com/aegis-agent/demo-auth-service',
      staging_url: 'http://127.0.0.1:8080',
      branch: 'main',
      scope_status: 'AUTHORIZED',
      ast_analysis: {
        framework: 'Node.js 20.x / Express 4.19',
        database: 'SQLite 3',
        endpoint_count: 3,
        confidence_score: '98.7%'
      },
      readiness: 'READY_FOR_WARROOM'
    });
    return;
  }

  // Route not found in API namespace
  sendJson(res, 404, {
    error: 'Not Found',
    message: `API endpoint '${method} ${urlPath}' does not exist.`
  });
}

module.exports = {
  handleApiRequest
};
