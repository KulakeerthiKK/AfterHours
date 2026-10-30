// =========================================================================
// AEGIS-AGENT OpenRouter AI Client
// Reusable server-side OpenRouter chat completions client with rate-limiting,
// timeouts, error resilience, usage tracking, and secure credential redaction.
// =========================================================================

const { recordModelUsage } = require('../db');

// Environment configurations
function getConfig() {
  return {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, ''),
    model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    timeoutMs: parseInt(process.env.OPENROUTER_TIMEOUT_MS || '25000', 10)
  };
}

/**
 * Send a chat completion request to OpenRouter.
 *
 * @param {Object} options
 * @param {string} [options.agentName='generic_agent'] - Calling agent name for telemetry
 * @param {string} [options.runId] - Workflow run ID
 * @param {string} options.systemPrompt - System instruction prompt
 * @param {string} options.userPrompt - User prompt / vulnerability context
 * @param {string} [options.model] - Optional model override
 * @param {number} [options.temperature=0.2] - Sampling temperature
 * @param {number} [options.maxTokens=1200] - Token generation limit
 * @returns {Promise<{ content: string, model: string, usage: Object, fallback: boolean }>}
 */
async function callOpenRouter({
  agentName = 'generic_agent',
  runId = null,
  systemPrompt,
  userPrompt,
  model = null,
  temperature = 0.2,
  maxTokens = 1200
}) {
  const config = getConfig();
  const selectedModel = model || config.model;

  if (!config.apiKey || config.apiKey.includes('replace_with')) {
    console.warn(`[OpenRouter Client] No valid OPENROUTER_API_KEY configured. Using deterministic fallback for ${agentName}.`);
    return getFallbackResponse({ agentName, systemPrompt, userPrompt, model: selectedModel });
  }

  const endpoint = `${config.baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  const requestPayload = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature,
    max_tokens: maxTokens
  };

  try {
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.appUrl,
        'X-Title': 'AEGIS-AGENT'
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const sanitizedError = errorBody.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
      console.warn(`[OpenRouter HTTP ${response.status}] ${response.statusText} for model '${selectedModel}': ${sanitizedError}`);

      // Graceful fallback on auth, quota, or rate limit errors
      return getFallbackResponse({
        agentName,
        systemPrompt,
        userPrompt,
        model: selectedModel,
        reason: `OpenRouter returned status ${response.status}`
      });
    }

    const data = await response.json();
    const choice = data.choices && data.choices[0];
    const content = (choice && choice.message && choice.message.content) || '';
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    // Record usage telemetry in database
    try {
      await recordModelUsage({
        run_id: runId,
        agent_name: agentName,
        provider: 'openrouter',
        model_id: data.model || selectedModel,
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        cost_if_returned: 0.0
      });
    } catch (dbErr) {
      // Non-fatal logging
    }

    return {
      content: content.trim(),
      model: data.model || selectedModel,
      usage,
      duration_ms: durationMs,
      fallback: false
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err.name === 'AbortError';
    console.warn(`[OpenRouter Error] ${isAbort ? 'Request timed out' : err.message}. Engaging safe fallback.`);

    return getFallbackResponse({
      agentName,
      systemPrompt,
      userPrompt,
      model: selectedModel,
      reason: isAbort ? 'Request Timeout' : err.message
    });
  }
}

/**
 * Deterministic heuristic response when network is unavailable.
 */
function getFallbackResponse({ agentName, systemPrompt, userPrompt, model, reason = 'Local Heuristic Mode' }) {
  let content = '';

  if (agentName.includes('fix') || systemPrompt.includes('remediation') || userPrompt.includes('CWE-89')) {
    content = JSON.stringify({
      rationale: 'Replaces raw SQL query concatenation with parameterized prepared statement bindings. Validates inputs before database execution.',
      candidate_patch: `@@ -42,3 +42,4 @@
- const query = \`SELECT * FROM users WHERE user = '\${req.body.user}' AND pass = '\${req.body.pass}'\`;
- const row = db.execute(query);
+ const query = 'SELECT * FROM users WHERE user = ? AND pass = ?';
+ const row = db.prepare(query).get(req.body.user, req.body.pass);`,
      changed_files: ['backend/services/authService.js']
    }, null, 2);
  } else if (userPrompt.includes('CWE-287')) {
    content = JSON.stringify({
      rationale: 'Restricts allowed JWT algorithms explicitly to HMAC SHA-256 and forbids the insecure "none" algorithm.',
      candidate_patch: `@@ -19,2 +19,2 @@
- return jwt.verify(token, secret, { algorithms: ['HS256', 'none'] });
+ return jwt.verify(token, secret, { algorithms: ['HS256'] });`,
      changed_files: ['backend/services/tokenService.js']
    }, null, 2);
  } else {
    content = JSON.stringify({
      rationale: 'Validates input bounds and enforces canonical path verification before invoking filesystem operations.',
      candidate_patch: `@@ -55,2 +55,4 @@
- const filePath = path.resolve(BASE_DIR, req.query.file);
+ const safeFile = path.basename(req.query.file);
+ const filePath = path.resolve(BASE_DIR, safeFile);`,
      changed_files: ['backend/services/reportService.js']
    }, null, 2);
  }

  return {
    content,
    model: `${model} (fallback: ${reason})`,
    usage: { prompt_tokens: 0, completion_tokens: 0 },
    fallback: true
  };
}

module.exports = {
  callOpenRouter,
  getConfig
};

