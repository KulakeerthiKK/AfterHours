// AEGIS-AGENT - Attack-Path Engine (P1 Priority)
// Evidence-backed attack-path graphs modeling Entry Point -> Component -> Asset Impact
// =========================================================================

const ATTACK_PATHS = {
  'path-sqli': {
    id: 'PATH-001',
    name: 'SQL Injection Database Credential Exfiltration Path',
    cwe: 'CWE-89',
    severity: 'HIGH',
    nodes: [
      {
        id: 'node-entry',
        label: 'Public Ingress Route',
        sublabel: 'POST /api/v1/auth/login',
        type: 'entry',
        badge: 'UNAUTHENTICATED INGRESS',
        status: 'verified',
        description: 'Unauthenticated edge route accepting JSON credential payload (username, password).',
        evidence: 'POST /api/v1/auth/login HTTP/1.1\nContent-Type: application/json\n{"username": "admin\' OR \'1\'=\'1"}'
      },
      {
        id: 'node-vuln',
        label: 'Vulnerable Query Formatter',
        sublabel: 'auth_service.py:42 (authenticate_user)',
        type: 'vulnerability',
        badge: 'CWE-89 SQL INJECTION',
        status: 'verified',
        description: 'Direct string interpolation in SQL query execution allows parameter boundary escape.',
        evidence: 'query = f"SELECT id, role, password_hash FROM users WHERE username = \'{username}\'"'
      },
      {
        id: 'node-asset',
        label: 'Target Sensitive Asset',
        sublabel: 'Database: users (Role & Hashes)',
        type: 'asset',
        badge: 'ASSET COMPROMISE',
        status: 'verified',
        description: 'Full read access to application credentials, administrator role, and cryptographic hashes.',
        evidence: 'Extracted row: { id: 1, role: "security-admin", password_hash: "$2b$12$..." }'
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-entry',
        target: 'node-vuln',
        label: 'Tainted Parameter: username',
        protocol: 'HTTP/REST',
        animated: true,
        verified: true
      },
      {
        id: 'edge-2',
        source: 'node-vuln',
        target: 'node-asset',
        label: 'Unchecked Raw Query Execution',
        protocol: 'SQL/TCP:5432',
        animated: true,
        verified: true
      }
    ]
  },
  'path-jwt': {
    id: 'PATH-002',
    name: 'Privilege Escalation via JWT Signature Bypass',
    cwe: 'CWE-287',
    severity: 'HIGH',
    nodes: [
      {
        id: 'node-entry',
        label: 'API Gateway Ingress',
        sublabel: 'GET /api/v1/admin/metrics',
        type: 'entry',
        badge: 'REST API INGRESS',
        status: 'verified',
        description: 'Protected administrative endpoint secured by bearer token middleware.',
        evidence: 'Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0...'
      },
      {
        id: 'node-vuln',
        label: 'Session Middleware',
        sublabel: 'jwt_validator.go:78',
        type: 'vulnerability',
        badge: 'CWE-287 ALGORITHM NONE',
        status: 'verified',
        description: 'Middleware accepts unverified algorithm "none" token without verifying public key signature.',
        evidence: 'token, err := jwt.Parse(tokenString, ...); Verification skipped for alg none.'
      },
      {
        id: 'node-asset',
        label: 'Restricted Cluster Telemetry',
        sublabel: 'Cluster Metrics & Internal Topology',
        type: 'asset',
        badge: 'PRIVILEGE ESCALATION',
        status: 'verified',
        description: 'Access to production nodes, internal IP mappings, and infrastructure metrics.',
        evidence: 'Response 200 OK: { privileged_access: true, session_user: "admin" }'
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-entry',
        target: 'node-vuln',
        label: 'Forged Bearer Header',
        protocol: 'HTTP/REST',
        animated: true,
        verified: true
      },
      {
        id: 'edge-2',
        source: 'node-vuln',
        target: 'node-asset',
        label: 'Forged Claims Accepted',
        protocol: 'Internal gRPC',
        animated: true,
        verified: true
      }
    ]
  },
  'path-traversal': {
    id: 'PATH-003',
    name: 'Arbitrary Local File Disclosure via Relative Path Traversal',
    cwe: 'CWE-22',
    severity: 'MEDIUM',
    nodes: [
      {
        id: 'node-entry',
        label: 'Report Downloader Route',
        sublabel: 'GET /api/v1/reports/download',
        type: 'entry',
        badge: 'FILE DOWNLOAD ROUTE',
        status: 'verified',
        description: 'Public endpoint allowing users to download monthly report PDF files.',
        evidence: 'GET /api/v1/reports/download?file=../../../../config/mock_app.env'
      },
      {
        id: 'node-vuln',
        label: 'Path Join Handler',
        sublabel: 'reports/controller.py:17',
        type: 'vulnerability',
        badge: 'CWE-22 PATH TRAVERSAL',
        status: 'verified',
        description: 'Controller joins filename without canonical realpath resolution or base directory checking.',
        evidence: 'target_path = os.path.join(REPORTS_DIR, filename); Directory escape allowed.'
      },
      {
        id: 'node-asset',
        label: 'Application Configuration File',
        sublabel: 'config/mock_app.env',
        type: 'asset',
        badge: 'SENSITIVE FILE EXPOSURE',
        status: 'verified',
        description: 'Exposes container configuration, internal ports, and debug flags.',
        evidence: 'MOCK_APP_PORT=8080\nMOCK_CONTAINER_ENV=local_development'
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-entry',
        target: 'node-vuln',
        label: 'Parameter file=../../',
        protocol: 'HTTP/GET',
        animated: true,
        verified: true
      },
      {
        id: 'edge-2',
        source: 'node-vuln',
        target: 'node-asset',
        label: 'Escaped Root Directory Read',
        protocol: 'POSIX File Read',
        animated: true,
        verified: true
      }
    ]
  }
};

function getAttackPaths() {
  return Object.values(ATTACK_PATHS);
}

function getAttackPathById(id) {
  return ATTACK_PATHS[id] || ATTACK_PATHS['path-sqli'];
}

module.exports = {
  getAttackPaths,
  getAttackPathById
};

