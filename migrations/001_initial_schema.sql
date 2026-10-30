-- =========================================================================
-- AEGIS-AGENT PostgreSQL Schema Migration (001_initial_schema.sql)
-- Production Data Schema for Runs, Findings, Proposals, Approvals, & Model Usage
-- =========================================================================

-- 1. Scan Runs Table
CREATE TABLE IF NOT EXISTS scan_runs (
    id VARCHAR(64) PRIMARY KEY,
    target_label VARCHAR(255) NOT NULL,
    scope_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    run_mode VARCHAR(32) DEFAULT 'authorized_local',
    created_by VARCHAR(64) DEFAULT 'operator'
);
CREATE INDEX IF NOT EXISTS idx_scan_runs_status ON scan_runs(status);
CREATE INDEX IF NOT EXISTS idx_scan_runs_started ON scan_runs(started_at DESC);

-- 2. Findings Table
CREATE TABLE IF NOT EXISTS findings (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) REFERENCES scan_runs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(32) NOT NULL DEFAULT 'medium',
    cwe VARCHAR(32) NOT NULL,
    source_tool VARCHAR(64) NOT NULL DEFAULT 'AEGIS-AST',
    asset VARCHAR(255),
    file_path VARCHAR(512),
    line_start INT,
    line_end INT,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'UNCONFIRMED',
    fingerprint VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_findings_run_id ON findings(run_id);
CREATE INDEX IF NOT EXISTS idx_findings_cwe ON findings(cwe);
CREATE INDEX IF NOT EXISTS idx_findings_fingerprint ON findings(fingerprint);

-- 3. Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
    id VARCHAR(64) PRIMARY KEY,
    finding_id VARCHAR(64) REFERENCES findings(id) ON DELETE CASCADE,
    evidence_type VARCHAR(64) NOT NULL,
    sanitized_content TEXT NOT NULL,
    storage_ref VARCHAR(512),
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_evidence_finding_id ON evidence(finding_id);

-- 4. Agent Events Table
CREATE TABLE IF NOT EXISTS agent_events (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) REFERENCES scan_runs(id) ON DELETE CASCADE,
    agent_name VARCHAR(64) NOT NULL,
    stage VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    summary TEXT,
    input_ref TEXT,
    output_ref TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INT
);
CREATE INDEX IF NOT EXISTS idx_agent_events_run ON agent_events(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent ON agent_events(agent_name);

-- 5. Remediation Proposals Table
CREATE TABLE IF NOT EXISTS remediation_proposals (
    id VARCHAR(64) PRIMARY KEY,
    finding_id VARCHAR(64) REFERENCES findings(id) ON DELETE CASCADE,
    model_id VARCHAR(128),
    rationale TEXT,
    diff_text TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'proposed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(64),
    reviewed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_proposals_finding ON remediation_proposals(finding_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON remediation_proposals(status);

-- 6. Approval Records Table
CREATE TABLE IF NOT EXISTS approval_records (
    id VARCHAR(64) PRIMARY KEY,
    proposal_id VARCHAR(64) REFERENCES remediation_proposals(id) ON DELETE CASCADE,
    decision VARCHAR(32) NOT NULL,
    reviewer VARCHAR(64) NOT NULL DEFAULT 'human_operator',
    reason TEXT,
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_approvals_proposal ON approval_records(proposal_id);

-- 7. Regression Results Table
CREATE TABLE IF NOT EXISTS regression_results (
    id VARCHAR(64) PRIMARY KEY,
    finding_id VARCHAR(64) REFERENCES findings(id) ON DELETE CASCADE,
    proposal_id VARCHAR(64) REFERENCES remediation_proposals(id) ON DELETE SET NULL,
    test_name VARCHAR(128) NOT NULL,
    test_type VARCHAR(64) NOT NULL DEFAULT 'security_regression',
    status VARCHAR(32) NOT NULL,
    output_summary TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_regression_finding ON regression_results(finding_id);

-- 8. Model Usage Table
CREATE TABLE IF NOT EXISTS model_usage (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) REFERENCES scan_runs(id) ON DELETE SET NULL,
    agent_name VARCHAR(64) NOT NULL,
    provider VARCHAR(64) NOT NULL DEFAULT 'openrouter',
    model_id VARCHAR(128) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    cost_if_returned NUMERIC(10, 6) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_model_usage_run ON model_usage(run_id);

