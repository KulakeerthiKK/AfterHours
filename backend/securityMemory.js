// AEGIS-AGENT - Security Regression Memory (P1 Priority)
// Persistent memory of prior findings, regression tests, and remediation outcomes
// =========================================================================

const fs = require('fs');
const path = require('path');

const MEMORY_FILE_PATH = path.join(__dirname, '../data_memory.json');

class SecurityMemory {
  constructor() {
    this.memory = new Map();
    this.loadMemory();
  }

  loadMemory() {
    try {
      if (fs.existsSync(MEMORY_FILE_PATH)) {
        const raw = fs.readFileSync(MEMORY_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          data.forEach(item => this.memory.set(item.fingerprint, item));
        }
      }
    } catch (e) {
      console.warn('[Security Memory] Initializing in-memory fallback store:', e.message);
    }

    // Seed default baseline memories if empty
    if (this.memory.size === 0) {
      this.seedBaselineMemories();
    }
  }

  saveMemory() {
    try {
      const items = Array.from(this.memory.values());
      fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
    } catch (e) {
      // In-memory operation persists for current process lifetime
    }
  }

  seedBaselineMemories() {
    const baselines = [
      {
        fingerprint: 'fp_sqli_auth_42',
        cwe: 'CWE-89',
        file_path: 'backend/services/auth_service.py',
        line_start: 42,
        title: 'SQL Parameter Boundary Check',
        times_seen: 4,
        first_detected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        last_verified: new Date().toISOString(),
        remediation_state: 'APPROVED_FOR_DEMO',
        regression_status: 'VERIFIED_REMEDIATED',
        regression_checks_passed: 4,
        regression_checks_total: 4
      },
      {
        fingerprint: 'fp_jwt_gateway_78',
        cwe: 'CWE-287',
        file_path: 'gateway/middleware/jwt_validator.go',
        line_start: 78,
        title: 'JWT Algorithm "none" Signature Bypass',
        times_seen: 2,
        first_detected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        last_verified: new Date().toISOString(),
        remediation_state: 'PENDING_HUMAN_APPROVAL',
        regression_status: 'NEEDS_REVIEW',
        regression_checks_passed: 0,
        regression_checks_total: 4
      },
      {
        fingerprint: 'fp_path_reports_17',
        cwe: 'CWE-22',
        file_path: 'reports/controller.py',
        line_start: 17,
        title: 'Relative Directory Escape Path Traversal',
        times_seen: 3,
        first_detected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        last_verified: new Date().toISOString(),
        remediation_state: 'PROPOSED',
        regression_status: 'REPRODUCIBLE',
        regression_checks_passed: 3,
        regression_checks_total: 4
      }
    ];

    baselines.forEach(item => this.memory.set(item.fingerprint, item));
    this.saveMemory();
  }

  recordFinding(finding) {
    const fp = finding.fingerprint || `${finding.cwe}:${finding.file_path}:${finding.line_start}`;
    const existing = this.memory.get(fp);

    if (existing) {
      existing.times_seen += 1;
      existing.last_verified = new Date().toISOString();
      existing.remediation_state = finding.remediation_status || existing.remediation_state;
      this.saveMemory();
      return { is_new: false, record: existing };
    }

    const newRecord = {
      fingerprint: fp,
      cwe: finding.cwe,
      file_path: finding.file_path,
      line_start: finding.line_start,
      title: finding.title,
      times_seen: 1,
      first_detected: new Date().toISOString(),
      last_verified: new Date().toISOString(),
      remediation_state: 'PENDING_HUMAN_APPROVAL',
      regression_status: 'PENDING_VERIFICATION',
      regression_checks_passed: 0,
      regression_checks_total: 4
    };

    this.memory.set(fp, newRecord);
    this.saveMemory();
    return { is_new: true, record: newRecord };
  }

  updateRegression(fingerprint, { status, checks_passed, checks_total }) {
    const existing = this.memory.get(fingerprint);
    if (existing) {
      existing.regression_status = status;
      existing.regression_checks_passed = checks_passed;
      existing.regression_checks_total = checks_total;
      existing.last_verified = new Date().toISOString();
      this.saveMemory();
      return existing;
    }
    return null;
  }

  listMemories() {
    return Array.from(this.memory.values());
  }

  getMemoryByFingerprint(fp) {
    return this.memory.get(fp) || null;
  }
}

const securityMemory = new SecurityMemory();

module.exports = securityMemory;

