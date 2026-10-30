// AEGIS-AGENT - Explainable Risk Prioritizer (P1 Priority)
// Ranks findings based on CVSS, exploitability evidence, exposure, and asset criticality
// =========================================================================

function calculateRiskScore(finding) {
  let score = 5.0;
  const factors = [];

  // 1. Severity weight
  const sev = (finding.severity || 'MEDIUM').toUpperCase();
  if (sev === 'CRITICAL') {
    score += 3.5;
    factors.push('Base Severity: Critical flaw impact');
  } else if (sev === 'HIGH') {
    score += 2.5;
    factors.push('Base Severity: High technical impact');
  } else if (sev === 'MEDIUM') {
    score += 1.0;
    factors.push('Base Severity: Moderate impact');
  }

  // 2. Exploitability Evidence
  if (finding.verification_status === 'CONFIRMED' || (finding.evidence && finding.evidence.http_response)) {
    score += 1.5;
    factors.push('Exploitability: Live HTTP evidence confirmed vulnerability signature');
  }

  // 3. Asset Exposure
  const asset = (finding.asset || finding.affected_component || '').toLowerCase();
  if (asset.includes('login') || asset.includes('auth') || asset.includes('public')) {
    score += 1.5;
    factors.push('Exposure Surface: Publicly reachable ingress endpoint without prior authentication');
  } else if (asset.includes('admin') || asset.includes('metric')) {
    score += 1.0;
    factors.push('Exposure Surface: Internal administrative gateway route');
  }

  const finalScore = Math.min(10.0, Math.max(1.0, Math.round(score * 10) / 10));
  let priorityTier = 'P2 - MEDIUM';
  if (finalScore >= 8.5) priorityTier = 'P0 - CRITICAL';
  else if (finalScore >= 7.0) priorityTier = 'P1 - HIGH';

  return {
    risk_score: finalScore,
    priority_tier: priorityTier,
    factors,
    explanation: factors.join(' • ')
  };
}

module.exports = {
  calculateRiskScore
};

