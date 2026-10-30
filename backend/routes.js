// AEGIS-AGENT Backend API Route Handlers
// =========================================================================

const runsStore = require('./runsStore');
const { formatReportAsMarkdown } = require('./reportGenerator');

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

  // Route: GET /api/runs (List recent runs)
  if (method === 'GET' && (urlPath === '/api/runs' || urlPath === '/api/runs/')) {
    const list = runsStore.listRuns();
    sendJson(res, 200, {
      runs: list,
      count: list.length,
      notice: 'Front-end demo — no real scans or code changes'
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
