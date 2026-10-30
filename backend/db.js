// =========================================================================
// AEGIS-AGENT Database & Persistence Layer
// Supports PostgreSQL (via DATABASE_URL with dynamic pool) with native
// high-performance SQLite fallback (via node:sqlite) for zero-dependency execution.
// =========================================================================

const fs = require('fs');
const path = require('path');

let dbProvider = 'sqlite';
let pgPool = null;
let sqliteDb = null;

// Environment credentials (safely masked in logs)
const databaseUrl = process.env.DATABASE_URL || '';

// Initialize Database Connection & Tables
async function initDb() {
  // 1. Try PostgreSQL if pg is available and DATABASE_URL is configured
  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    try {
      const { Pool } = require('pg');
      pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000
      });
      // Test connectivity
      const client = await pgPool.connect();
      client.release();
      dbProvider = 'postgresql';
      console.log('📦 Database connected: PostgreSQL pool active');
      await runPostgresMigrations();
      return;
    } catch (err) {
      console.warn(`⚠️ PostgreSQL connection attempt failed (${err.message}). Falling back to native persistent SQLite storage.`);
      pgPool = null;
    }
  }

  // 2. Persistent SQLite Engine via native Node.js DatabaseSync
  try {
    const { DatabaseSync } = require('node:sqlite');
    const dbFilePath = path.join(__dirname, '..', 'aegis_records.sqlite');
    sqliteDb = new DatabaseSync(dbFilePath);
    dbProvider = 'sqlite';
    console.log(`📦 Database connected: Native SQLite storage at ${dbFilePath}`);
    initSqliteSchema();
  } catch (sqliteErr) {
    console.error('Failed to initialize native SQLite storage:', sqliteErr);
  }
}

// SQLite Schema Initializer (Exact mirror of PostgreSQL schema)
function initSqliteSchema() {
  if (!sqliteDb) return;
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS scan_runs (
      id TEXT PRIMARY KEY,
      target_label TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      run_mode TEXT DEFAULT 'authorized_local',
      created_by TEXT DEFAULT 'operator'
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL DEFAULT 'medium',
      cwe TEXT NOT NULL,
      source_tool TEXT NOT NULL DEFAULT 'AEGIS-AST',
      asset TEXT,
      file_path TEXT,
      line_start INTEGER,
      line_end INTEGER,
      verification_status TEXT NOT NULL DEFAULT 'UNCONFIRMED',
      fingerprint TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      finding_id TEXT,
      evidence_type TEXT NOT NULL,
      sanitized_content TEXT NOT NULL,
      storage_ref TEXT,
      collected_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agent_events (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      agent_name TEXT NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT,
      input_ref TEXT,
      output_ref TEXT,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      duration_ms INTEGER
    );

    CREATE TABLE IF NOT EXISTS remediation_proposals (
      id TEXT PRIMARY KEY,
      finding_id TEXT,
      model_id TEXT,
      rationale TEXT,
      diff_text TEXT,
      status TEXT NOT NULL DEFAULT 'proposed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_by TEXT,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS approval_records (
      id TEXT PRIMARY KEY,
      proposal_id TEXT,
      decision TEXT NOT NULL,
      reviewer TEXT NOT NULL DEFAULT 'human_operator',
      reason TEXT,
      decided_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS regression_results (
      id TEXT PRIMARY KEY,
      finding_id TEXT,
      proposal_id TEXT,
      test_name TEXT NOT NULL,
      test_type TEXT NOT NULL DEFAULT 'security_regression',
      status TEXT NOT NULL,
      output_summary TEXT,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS model_usage (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      agent_name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'openrouter',
      model_id TEXT NOT NULL,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      cost_if_returned REAL DEFAULT 0.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function runPostgresMigrations() {
  if (!pgPool) return;
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
  if (fs.existsSync(migrationPath)) {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await pgPool.query(sql);
  }
}

// =========================================================================
// CRUD DATA ACCESS REPOSITORIES
// =========================================================================

// --- Scan Runs ---
async function createScanRun(run) {
  const id = run.id || `RUN-${Date.now()}`;
  const now = new Date().toISOString();
  if (dbProvider === 'postgresql' && pgPool) {
    const query = `
      INSERT INTO scan_runs (id, target_label, scope_id, status, started_at, run_mode, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;
    const res = await pgPool.query(query, [
      id, run.target_label || 'Local training app', run.scope_id || 'SEC-LOCAL-8080',
      run.status || 'queued', run.started_at || now, run.run_mode || 'authorized_local', run.created_by || 'operator'
    ]);
    return res.rows[0];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO scan_runs (id, target_label, scope_id, status, started_at, run_mode, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, run.target_label || 'Local training app', run.scope_id || 'SEC-LOCAL-8080',
      run.status || 'queued', run.started_at || now, run.run_mode || 'authorized_local', run.created_by || 'operator'
    );
    return getScanRun(id);
  }
  return run;
}

async function getScanRun(id) {
  if (dbProvider === 'postgresql' && pgPool) {
    const res = await pgPool.query('SELECT * FROM scan_runs WHERE id = $1', [id]);
    return res.rows[0] || null;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM scan_runs WHERE id = ?');
    return stmt.get(id) || null;
  }
  return null;
}

async function listScanRuns(limit = 50) {
  if (dbProvider === 'postgresql' && pgPool) {
    const res = await pgPool.query('SELECT * FROM scan_runs ORDER BY started_at DESC LIMIT $1', [limit]);
    return res.rows;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM scan_runs ORDER BY started_at DESC LIMIT ?');
    return stmt.all(limit);
  }
  return [];
}

async function updateScanRun(id, updates) {
  const status = updates.status;
  const completed_at = updates.completed_at || (status === 'complete' || status === 'failed' ? new Date().toISOString() : null);

  if (dbProvider === 'postgresql' && pgPool) {
    await pgPool.query(
      'UPDATE scan_runs SET status = COALESCE($1, status), completed_at = COALESCE($2, completed_at) WHERE id = $3',
      [status, completed_at, id]
    );
    return getScanRun(id);
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('UPDATE scan_runs SET status = COALESCE(?, status), completed_at = COALESCE(?, completed_at) WHERE id = ?');
    stmt.run(status, completed_at, id);
    return getScanRun(id);
  }
}

// --- Findings ---
async function createFinding(finding) {
  const id = finding.id || finding.finding_id || `FIND-${Date.now()}`;
  if (dbProvider === 'postgresql' && pgPool) {
    const query = `
      INSERT INTO findings (id, run_id, title, description, severity, cwe, source_tool, asset, file_path, line_start, line_end, verification_status, fingerprint)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET verification_status = EXCLUDED.verification_status
      RETURNING *;
    `;
    const res = await pgPool.query(query, [
      id, finding.run_id || null, finding.title, finding.description, finding.severity,
      finding.cwe, finding.source_tool || 'AEGIS-AST', finding.asset, finding.file_path,
      finding.line_start, finding.line_end, finding.verification_status || 'UNCONFIRMED',
      finding.fingerprint || id
    ]);
    return res.rows[0];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT OR REPLACE INTO findings (id, run_id, title, description, severity, cwe, source_tool, asset, file_path, line_start, line_end, verification_status, fingerprint)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, finding.run_id || null, finding.title, finding.description, finding.severity,
      finding.cwe, finding.source_tool || 'AEGIS-AST', finding.asset, finding.file_path,
      finding.line_start, finding.line_end, finding.verification_status || 'UNCONFIRMED',
      finding.fingerprint || id
    );
    return getFinding(id);
  }
  return finding;
}

async function getFinding(id) {
  if (dbProvider === 'postgresql' && pgPool) {
    const res = await pgPool.query('SELECT * FROM findings WHERE id = $1', [id]);
    return res.rows[0] || null;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM findings WHERE id = ?');
    return stmt.get(id) || null;
  }
  return null;
}

async function listFindings(run_id = null) {
  if (dbProvider === 'postgresql' && pgPool) {
    const query = run_id ? 'SELECT * FROM findings WHERE run_id = $1 ORDER BY created_at DESC' : 'SELECT * FROM findings ORDER BY created_at DESC';
    const params = run_id ? [run_id] : [];
    const res = await pgPool.query(query, params);
    return res.rows;
  } else if (sqliteDb) {
    const query = run_id ? 'SELECT * FROM findings WHERE run_id = ? ORDER BY created_at DESC' : 'SELECT * FROM findings ORDER BY created_at DESC';
    const stmt = sqliteDb.prepare(query);
    return run_id ? stmt.all(run_id) : stmt.all();
  }
  return [];
}

// --- Agent Events ---
async function recordAgentEvent(event) {
  const id = event.id || `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();
  if (dbProvider === 'postgresql' && pgPool) {
    const query = `
      INSERT INTO agent_events (id, run_id, agent_name, stage, status, summary, input_ref, output_ref, started_at, completed_at, duration_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;
    `;
    const res = await pgPool.query(query, [
      id, event.run_id, event.agent_name, event.stage, event.status, event.summary,
      event.input_ref, event.output_ref, event.started_at || now, event.completed_at || now, event.duration_ms || 0
    ]);
    return res.rows[0];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO agent_events (id, run_id, agent_name, stage, status, summary, input_ref, output_ref, started_at, completed_at, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, event.run_id, event.agent_name, event.stage, event.status, event.summary,
      event.input_ref, event.output_ref, event.started_at || now, event.completed_at || now, event.duration_ms || 0
    );
    return event;
  }
  return event;
}

async function listAgentEvents(run_id) {
  if (dbProvider === 'postgresql' && pgPool) {
    const res = await pgPool.query('SELECT * FROM agent_events WHERE run_id = $1 ORDER BY started_at ASC', [run_id]);
    return res.rows;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM agent_events WHERE run_id = ? ORDER BY started_at ASC');
    return stmt.all(run_id);
  }
  return [];
}

// --- Remediation Proposals & Approvals ---
async function recordRemediationProposal(prop) {
  const id = prop.id || prop.fix_id || `PROP-${Date.now()}`;
  if (dbProvider === 'postgresql' && pgPool) {
    const query = `
      INSERT INTO remediation_proposals (id, finding_id, model_id, rationale, diff_text, status, reviewed_by, reviewed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
    `;
    const res = await pgPool.query(query, [
      id, prop.finding_id, prop.model_id || 'openrouter-ai', prop.rationale,
      prop.unified_diff || prop.diff_text, prop.status || 'proposed', prop.reviewed_by || null, prop.reviewed_at || null
    ]);
    return res.rows[0];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT OR REPLACE INTO remediation_proposals (id, finding_id, model_id, rationale, diff_text, status, reviewed_by, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, prop.finding_id, prop.model_id || 'openrouter-ai', prop.rationale,
      prop.unified_diff || prop.diff_text, prop.status || 'proposed', prop.reviewed_by || null, prop.reviewed_at || null
    );
    return prop;
  }
  return prop;
}

async function recordApproval(record) {
  const id = record.id || `APPR-${Date.now()}`;
  const now = new Date().toISOString();
  if (dbProvider === 'postgresql' && pgPool) {
    const query = `
      INSERT INTO approval_records (id, proposal_id, decision, reviewer, reason, decided_at)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const res = await pgPool.query(query, [
      id, record.proposal_id, record.decision, record.reviewer || 'human_operator', record.reason, now
    ]);
    return res.rows[0];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO approval_records (id, proposal_id, decision, reviewer, reason, decided_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, record.proposal_id, record.decision, record.reviewer || 'human_operator', record.reason, now);
    return record;
  }
  return record;
}

// --- Model Usage Metadata Tracking ---
async function recordModelUsage(usage) {
  const id = usage.id || `USG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  if (dbProvider === 'postgresql' && pgPool) {
    const query = `
      INSERT INTO model_usage (id, run_id, agent_name, provider, model_id, prompt_tokens, completion_tokens, cost_if_returned)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
    `;
    const res = await pgPool.query(query, [
      id, usage.run_id || null, usage.agent_name, usage.provider || 'openrouter',
      usage.model_id, usage.prompt_tokens || 0, usage.completion_tokens || 0, usage.cost_if_returned || 0.0
    ]);
    return res.rows[0];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO model_usage (id, run_id, agent_name, provider, model_id, prompt_tokens, completion_tokens, cost_if_returned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, usage.run_id || null, usage.agent_name, usage.provider || 'openrouter',
      usage.model_id, usage.prompt_tokens || 0, usage.completion_tokens || 0, usage.cost_if_returned || 0.0
    );
    return usage;
  }
  return usage;
}

// Health status check without leaking connection strings
function getDbHealth() {
  const hasPg = !!pgPool;
  const hasSqlite = !!sqliteDb;
  return {
    connected: hasPg || hasSqlite,
    provider: dbProvider,
    target_configured: !!databaseUrl,
    mode: dbProvider === 'postgresql' ? 'remote_postgresql' : 'native_persistent_sqlite'
  };
}

module.exports = {
  initDb,
  createScanRun,
  getScanRun,
  listScanRuns,
  updateScanRun,
  createFinding,
  getFinding,
  listFindings,
  recordAgentEvent,
  listAgentEvents,
  recordRemediationProposal,
  recordApproval,
  recordModelUsage,
  getDbHealth
};

