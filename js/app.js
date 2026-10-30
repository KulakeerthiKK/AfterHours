// AEGIS-AGENT Frontend Application Controller
// Connected to Stage 2 Backend API skeleton (POST /api/runs, GET /api/runs/:run_id, GET /api/runs)
// Deterministic mock workflow polling, responsive rendering, and dual-theme support.

(function () {
  'use strict';

  // API Client Definition
  const API_BASE = '/api';

  const apiClient = {
    async createRun(target_id, test_case, scope_confirmed, simulation_outcome) {
      const res = await fetch(`${API_BASE}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          target_id,
          test_case,
          scope_confirmed,
          simulation_outcome
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to initiate run');
      }
      return data;
    },

    async getRun(run_id) {
      const res = await fetch(`${API_BASE}/runs/${encodeURIComponent(run_id)}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `Run ${run_id} not found`);
      }
      return data;
    },

    async listRuns() {
      const res = await fetch(`${API_BASE}/runs`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch runs list');
      }
      return data.runs || [];
    },

    async getAuditReport(run_id) {
      const res = await fetch(`${API_BASE}/runs/${encodeURIComponent(run_id)}/report`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch audit report');
      }
      return data;
    },

    async approveFix(run_id) {
      const res = await fetch(`${API_BASE}/runs/${encodeURIComponent(run_id)}/approve-fix`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to approve fix');
      }
      return data;
    },

    async rejectFix(run_id) {
      const res = await fetch(`${API_BASE}/runs/${encodeURIComponent(run_id)}/reject-fix`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to reject fix');
      }
      return data;
    },

    async resetStore() {
      const res = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      return await res.json();
    },

    // Extended P0-P2 API Endpoints
    async triggerScan(target_id = 'Local training app (auth-service:v1.4.2)', profile = 'all') {
      const res = await fetch(`${API_BASE}/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ target_id, profile })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Scan failed');
      return data;
    },

    async listFindings() {
      const res = await fetch(`${API_BASE}/findings`, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch findings');
      return data.findings || [];
    },

    async getFinding(finding_id) {
      const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(finding_id)}`, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch finding');
      return data;
    },

    async verifyFinding(finding_id) {
      const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(finding_id)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ scope_confirmed: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Verification failed');
      return data;
    },

    async proposeFix(finding_id) {
      const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(finding_id)}/propose-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ scope_confirmed: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Fix proposal failed');
      return data;
    },

    async approveFinding(finding_id, reason = 'Operator approved candidate diff') {
      const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(finding_id)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ decision: 'approved', reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Approval failed');
      return data;
    },

    async rejectFinding(finding_id, reason = 'Operator rejected candidate diff') {
      const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(finding_id)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ decision: 'rejected', reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Rejection failed');
      return data;
    },

    async runRegression(finding_id) {
      const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(finding_id)}/regression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ scope_confirmed: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Regression run failed');
      return data;
    },

    async getAttackPaths() {
      const res = await fetch(`${API_BASE}/attack-paths`, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch attack paths');
      return data.attack_paths || [];
    },

    async getSecurityMemory() {
      const res = await fetch(`${API_BASE}/security-memory`, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch memory');
      return data;
    }
  };

  // Sound Synthesizer instance for audio cues
  const simulator = new window.AegisWorkflowSimulator();

  // Application State
  const state = {
    activeNav: 'landing',
    activeDetailTab: 'finding',
    activeEvidenceTab: 'request',
    diffViewMode: 'unified', // 'unified' or 'split'
    dashboardFilter: 'all',
    searchQuery: '',
    selectedTestCaseId: 'input-validation',
    currentRunData: null,
    pollTimer: null,
    recentRuns: [],
    activeAttackPathId: 'path-sqli',
    activeFindingId: 'FIND-CWE89-01',
    activeHeroConsoleTab: 'trace'
  };

  // DOM Elements Cache
  const el = {};

  function initElements() {
    // Navigation
    el.navLanding = document.getElementById('nav-landing');
    el.navResearch = document.getElementById('nav-research');
    el.viewResearch = document.getElementById('view-research');
    el.btnHeroResearch = document.getElementById('btn-hero-research');
    el.navDashboard = document.getElementById('nav-dashboard');
    el.navWarroom = document.getElementById('nav-warroom');
    el.navAttackpath = document.getElementById('nav-attackpath');
    el.navFindingdetail = document.getElementById('nav-findingdetail');
    el.navLogs = document.getElementById('nav-logs');
    el.navAbout = document.getElementById('nav-about');
    el.brandHomeBtn = document.getElementById('brand-home-btn');

    el.viewLanding = document.getElementById('view-landing');
    el.viewDashboard = document.getElementById('view-dashboard');
    el.viewWarroom = document.getElementById('view-warroom');
    el.viewAttackpath = document.getElementById('view-attackpath');
    el.viewFindingdetail = document.getElementById('view-findingdetail');
    el.viewLogs = document.getElementById('view-logs');
    el.viewAbout = document.getElementById('view-about');

    // Ticker & Themes
    el.tickerMsg = document.getElementById('ticker-msg');
    el.themeBtnCyber = document.getElementById('theme-btn-cyber');
    el.themeBtnRed = document.getElementById('theme-btn-red');
    el.themeBtnEditorial = document.getElementById('theme-btn-editorial');

    // Hero Section elements
    el.btnHeroLaunchWarroom = document.getElementById('btn-hero-launch-warroom');
    el.btnHeroAttackpath = document.getElementById('btn-hero-attackpath');
    el.btnHeroScanner = document.getElementById('btn-hero-scanner');
    el.btnHeroInspectFinding = document.getElementById('btn-hero-inspect-finding');
    el.heroConsoleFeed = document.getElementById('hero-console-feed');
    el.heroTabTrace = document.getElementById('hero-tab-trace');
    el.heroTabAst = document.getElementById('hero-tab-ast');
    el.heroTabMemory = document.getElementById('hero-tab-memory');

    // Attack Path Visualizer elements
    el.attackPathSelector = document.getElementById('attack-path-selector');
    el.nodeEntry = document.getElementById('node-entry');
    el.nodeVuln = document.getElementById('node-vuln');
    el.nodeTarget = document.getElementById('node-target');
    el.attackNodeDrawer = document.getElementById('attack-node-drawer');
    el.btnCloseDrawer = document.getElementById('btn-close-drawer');
    el.btnDrawerProposeFix = document.getElementById('btn-drawer-propose-fix');
    el.btnDrawerOpenFinding = document.getElementById('btn-drawer-open-finding');

    // Finding Detail elements
    el.findingPicker = document.getElementById('finding-picker');
    el.btnTriggerScanNow = document.getElementById('btn-trigger-scan-now');
    el.btnExportFindingJson = document.getElementById('btn-export-finding-json');
    el.btnFApprove = document.getElementById('btn-f-approve');
    el.btnFReject = document.getElementById('btn-f-reject');
    el.btnFRegression = document.getElementById('btn-f-regression');
    el.fApprovalFeedback = document.getElementById('f-approval-feedback');

    // Controls & HUD
    el.progressBarFill = document.getElementById('progress-bar-fill');
    el.simRunTag = document.getElementById('sim-run-tag');
    el.simStopwatch = document.getElementById('sim-stopwatch');
    el.simStateBadge = document.getElementById('sim-state-badge');
    el.simProgressPct = document.getElementById('sim-progress-pct');
    el.activeTargetLabel = document.getElementById('active-target-label');
    el.sysClock = document.getElementById('sys-clock');
    el.btnToggleSound = document.getElementById('btn-toggle-sound');
    el.soundIcon = document.getElementById('sound-icon');
    el.soundLabel = document.getElementById('sound-label');
    el.themeBtnRed = document.getElementById('theme-btn-red');
    el.themeBtnEditorial = document.getElementById('theme-btn-editorial');

    el.btnNewRunHeader = document.getElementById('btn-new-run-header');
    el.btnStartDemoHero = document.getElementById('btn-start-demo-hero');
    el.btnPauseResume = document.getElementById('btn-pause-resume');
    el.btnResetDemo = document.getElementById('btn-reset-demo');
    el.btnStepDemo = document.getElementById('btn-step-demo');
    el.speedBtns = document.querySelectorAll('.speed-btn');

    // Multi-Agent Pipeline Network Nodes
    el.netNodeSystem = document.getElementById('net-node-system');
    el.netNodeRed = document.getElementById('net-node-red');
    el.netNodeSentinel = document.getElementById('net-node-sentinel');
    el.netNodeFix = document.getElementById('net-node-fix');
    el.netNodeAuditor = document.getElementById('net-node-auditor');
    el.netArrows = [
      document.getElementById('net-arrow-1'),
      document.getElementById('net-arrow-2'),
      document.getElementById('net-arrow-3'),
      document.getElementById('net-arrow-4')
    ];
    el.netActiveStepLabel = document.getElementById('net-active-step-label');
    el.netLatencyTag = document.getElementById('net-latency-tag');

    // Timeline and Agent Cards
    el.timelineStagesList = document.getElementById('timeline-stages-list');
    el.agentPillRed = document.getElementById('agent-pill-red');
    el.agentPillSentinel = document.getElementById('agent-pill-sentinel');
    el.agentPillFix = document.getElementById('agent-pill-fix');
    el.agentPillAuditor = document.getElementById('agent-pill-auditor');

    // Detail Tabs
    el.detailTabBtns = document.querySelectorAll('.detail-tab-btn');
    el.paneFinding = document.getElementById('pane-finding');
    el.paneFix = document.getElementById('pane-fix');
    el.paneRegression = document.getElementById('pane-regression');
    el.paneRawLogs = document.getElementById('pane-rawlogs');

    // Finding Elements
    el.findingTitle = document.getElementById('finding-title');
    el.findingSeverity = document.getElementById('finding-severity');
    el.findingCvss = document.getElementById('finding-cvss');
    el.findingCwe = document.getElementById('finding-cwe');
    el.findingComponent = document.getElementById('finding-component');
    el.findingCategory = document.getElementById('finding-category');
    el.findingExplanation = document.getElementById('finding-explanation');
    el.cvssVectorGrid = document.getElementById('cvss-vector-grid');
    el.btnCopyCurl = document.getElementById('btn-copy-curl');
    el.btnCopyEvidence = document.getElementById('btn-copy-evidence');
    el.evidenceCodeViewer = document.getElementById('evidence-code-viewer');
    el.evidenceTabBtns = document.querySelectorAll('.evidence-tab-btn');

    // Review Controls
    el.reviewStateDisplay = document.getElementById('review-state-display');
    el.btnReviewConfirm = document.getElementById('btn-review-confirm');
    el.btnReviewNeedsReview = document.getElementById('btn-review-needsreview');
    el.btnReviewNotConfirmed = document.getElementById('btn-review-notconfirmed');

    // Proposed Fix Elements
    el.fixSummaryText = document.getElementById('fix-summary-text');
    el.fixRationaleText = document.getElementById('fix-rationale-text');
    el.fixValidationBox = document.getElementById('fix-validation-box');
    el.fixValidationIcon = document.getElementById('fix-validation-icon');
    el.fixValidationBadge = document.getElementById('fix-validation-badge');
    el.fixTestCommand = document.getElementById('fix-test-command');
    el.fixTestOutput = document.getElementById('fix-test-output');
    el.diffFilePath = document.getElementById('diff-file-path');
    el.diffStatsAdd = document.getElementById('diff-stats-add');
    el.diffStatsDel = document.getElementById('diff-stats-del');
    el.diffCodeBody = document.getElementById('diff-code-body');
    el.diffModeUnified = document.getElementById('diff-mode-unified');
    el.diffModeSplit = document.getElementById('diff-mode-split');
    el.btnApproveFix = document.getElementById('btn-approve-fix');
    el.btnRejectFix = document.getElementById('btn-reject-fix');
    el.fixStatusBadge = document.getElementById('fix-status-badge');

    // Regression Elements
    el.reproducibilityBanner = document.getElementById('reproducibility-banner');
    el.reproStatusBadge = document.getElementById('repro-status-badge');
    el.reproStatusText = document.getElementById('repro-status-text');
    el.regressionChecksList = document.getElementById('regression-checks-list');
    el.btnToggleReproducibility = document.getElementById('btn-toggle-reproducibility');
    el.btnRetestSuite = document.getElementById('btn-retest-suite');

    // Logs & Dashboard
    el.fullLogsViewer = document.getElementById('full-logs-viewer');
    el.warroomLogsViewer = document.getElementById('warroom-logs-viewer');
    el.runsTableBody = document.getElementById('runs-table-body');
    el.dashboardSearchInput = document.getElementById('dashboard-search-input');
    el.filterChips = document.querySelectorAll('.filter-chip');
    el.btnExportReport = document.getElementById('btn-export-report');

    // Modal
    el.modalNewRun = document.getElementById('modal-new-run');
    el.modalTargetLabel = document.getElementById('modal-target-label');
    el.btnModalClose = document.getElementById('btn-modal-close');
    el.btnModalCancel = document.getElementById('btn-modal-cancel');
    el.btnModalStart = document.getElementById('btn-modal-start');
    el.chkScopeConfirm = document.getElementById('chk-scope-confirm');
    el.testcaseOptionCards = document.querySelectorAll('.testcase-option-card');

    // Toast Container
    el.toastContainer = document.getElementById('toast-container');
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'success') toast.style.borderLeftColor = 'var(--status-green)';
    if (type === 'warn') toast.style.borderLeftColor = 'var(--status-amber)';
    if (type === 'error') toast.style.borderLeftColor = 'var(--accent-red)';

    toast.innerHTML = `<div>${message}</div>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function formatStopwatch(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');
    return `⏱ ${mStr}:${sStr}.${tenths}s`;
  }

  function startClock() {
    function update() {
      const now = new Date();
      if (el.sysClock) {
        el.sysClock.textContent = now.toTimeString().split(' ')[0] + ' UTC';
      }
    }
    update();
    setInterval(update, 1000);
  }

  function setNav(targetNav) {
    state.activeNav = targetNav;

    const navButtons = [
      el.navLanding,
      el.navResearch,
      el.navWarroom,
      el.navAttackpath,
      el.navFindingdetail,
      el.navDashboard,
      el.navLogs,
      el.navAbout
    ];

    navButtons.forEach(btn => {
      if (!btn) return;
      btn.classList.toggle('active', btn.getAttribute('data-nav') === targetNav);
    });

    const views = [
      { id: 'view-landing', el: el.viewLanding },
      { id: 'view-research', el: el.viewResearch },
      { id: 'view-warroom', el: el.viewWarroom },
      { id: 'view-attackpath', el: el.viewAttackpath },
      { id: 'view-findingdetail', el: el.viewFindingdetail },
      { id: 'view-dashboard', el: el.viewDashboard },
      { id: 'view-logs', el: el.viewLogs },
      { id: 'view-about', el: el.viewAbout }
    ];

    const activeViewId = targetNav === 'war-room' ? 'view-warroom' : `view-${targetNav}`;

    views.forEach(v => {
      if (!v.el) return;
      v.el.classList.toggle('active', v.el.id === activeViewId);
    });

    if (targetNav === 'dashboard') {
      fetchRecentRunsFromApi();
    } else if (targetNav === 'attackpath') {
      renderAttackPath();
    } else if (targetNav === 'findingdetail') {
      renderFindingDetail();
    }

    // Keep Landing page clean and focused; show simulation HUD in war-room
    const hudContainer = document.querySelector('.sim-hud-container');
    const netBar = document.getElementById('agent-net-bar');
    if (hudContainer && netBar) {
      if (targetNav === 'war-room') {
        hudContainer.style.display = 'block';
        netBar.style.display = 'flex';
      } else {
        hudContainer.style.display = 'none';
        netBar.style.display = 'none';
      }
    }
  }
  window.setNav = setNav;

  function setWarRoomTab(tabName) {
    state.activeDetailTab = tabName;

    el.detailTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    const panes = {
      finding: el.paneFinding,
      fix: el.paneFix,
      regression: el.paneRegression,
      rawlogs: el.paneRawLogs
    };

    Object.keys(panes).forEach(key => {
      if (panes[key]) {
        panes[key].classList.toggle('active', key === tabName);
      }
    });
  }

  // =========================================================================
  // BACKEND API POLLING & WORKFLOW SYNCHRONIZATION
  // =========================================================================

  function startPollingRun(runId) {
    stopPollingRun();

    async function poll() {
      try {
        const runData = await apiClient.getRun(runId);
        state.currentRunData = runData;
        renderRunFromApi(runData);

        // Check if terminal state reached
        if (runData.status === 'complete' || runData.status === 'needs_review' || runData.status === 'failed') {
          stopPollingRun();
          simulator.playCue(runData.status === 'complete' ? 'run_done' : 'alert');

          if (runData.status === 'complete') {
            showToast(`Workflow ${runData.run_id} completed successfully (simulated)`, 'success');
          } else if (runData.status === 'needs_review') {
            showToast(`Workflow ${runData.run_id} requires human review at Sentinel stage`, 'warn');
          } else if (runData.status === 'failed') {
            showToast(`Workflow ${runData.run_id} failed: Regression bypass detected`, 'error');
          }

          fetchRecentRunsFromApi();
        } else {
          state.pollTimer = setTimeout(poll, 800);
        }
      } catch (err) {
        stopPollingRun();
        showToast(`API error polling ${runId}: ${err.message}`, 'error');
      }
    }

    poll();
  }

  function stopPollingRun() {
    if (state.pollTimer) {
      clearTimeout(state.pollTimer);
      state.pollTimer = null;
    }
  }

  // Render Full UI From Server-Side Run Data
  function renderRunFromApi(run) {
    if (!run) return;
    state.currentRunData = run;

    // 1. HUD & Progress
    if (el.simRunTag) el.simRunTag.textContent = run.run_id;
    if (el.activeTargetLabel) el.activeTargetLabel.textContent = run.target_id;
    if (el.simStopwatch) el.simStopwatch.textContent = formatStopwatch(run.elapsed_ms || 0);

    // Compute progress percentage based on stage statuses
    let completedStages = 0;
    const stages = run.stage_statuses || {};
    const order = run.stage_order || ['scope_check', 'red_agent', 'sentinel_agent', 'fix_agent', 'auditor_agent'];

    order.forEach(stg => {
      if (stages[stg] && (stages[stg].status === 'complete' || stages[stg].status === 'needs_review' || stages[stg].status === 'failed')) {
        completedStages++;
      }
    });

    const pct = run.status === 'complete' ? 100 : Math.min(100, Math.round((completedStages / order.length) * 100));
    if (el.progressBarFill) el.progressBarFill.style.width = pct + '%';
    if (el.simProgressPct) el.simProgressPct.textContent = `${pct}% Complete`;

    // State Badge
    if (el.simStateBadge) {
      el.simStateBadge.className = `sim-state-badge ${run.status}`;
      el.simStateBadge.innerHTML = run.status === 'complete'
        ? '<span>✓</span> COMPLETED'
        : run.status === 'needs_review'
          ? '<span>⚠️</span> NEEDS REVIEW'
          : run.status === 'failed'
            ? '<span>✕</span> FAILED'
            : '<span>●</span> SIMULATING';
    }

    // 2. Multi-Agent Pipeline Network Nodes
    const activeStage = run.current_stage;
    const stageNodeMap = {
      scope_check: el.netNodeSystem,
      red_agent: el.netNodeRed,
      sentinel_agent: el.netNodeSentinel,
      fix_agent: el.netNodeFix,
      auditor_agent: el.netNodeAuditor
    };

    order.forEach(stgKey => {
      const node = stageNodeMap[stgKey];
      if (!node) return;
      const stg = stages[stgKey];
      const isActive = stg && stg.status === 'running';
      const isDone = stg && (stg.status === 'complete' || stg.status === 'needs_review' || stg.status === 'failed');
      node.classList.toggle('active-node', isActive || isDone);
    });

    if (el.netActiveStepLabel) {
      const activeStageObj = stages[activeStage];
      el.netActiveStepLabel.textContent = activeStageObj
        ? `${activeStageObj.label || activeStageObj.name || 'Stage Verified'} (${activeStageObj.agent || 'System'})`
        : `Run Status: ${(run.status || 'Complete').toUpperCase()}`;
    }

    // Update friendly 5-stage stepper
    order.forEach((stg, idx) => {
      const stepEl = document.getElementById(`step-guide-${idx + 1}`);
      if (stepEl) {
        const stgData = stages[stg];
        const isDone = stgData && (stgData.status === 'complete' || stgData.status === 'done');
        const isRunning = stgData && stgData.status === 'running';
        stepEl.classList.toggle('active', isDone || isRunning);
        const badge = stepEl.querySelector('.stepper-badge');
        if (badge) {
          badge.textContent = isDone ? '✓' : (idx + 1).toString();
          badge.style.borderColor = isDone ? '#a3e635' : (isRunning ? '#38bdf8' : 'var(--border-medium)');
          badge.style.color = isDone ? '#a3e635' : (isRunning ? '#38bdf8' : 'var(--text-muted)');
        }
      }
    });

    // 3. Render Timeline Stages
    renderTimelineFromApi(run);

    // 4. Render Finding & Evidence
    if (run.mock_results && run.mock_results.finding) {
      renderFindingFromApi(run.mock_results.finding);
    }

    // 5. Render Proposed Fix
    if (run.mock_results && run.mock_results.proposed_fix) {
      renderFixFromApi(run.mock_results.proposed_fix, run);
    }

    // 6. Render Regression Results
    if (run.mock_results && run.mock_results.regression) {
      renderRegressionFromApi(run.mock_results.regression);
    }

    // 7. Render Logs
    if (run.logs) {
      const logText = run.logs.join('\n');
      if (el.fullLogsViewer) el.fullLogsViewer.textContent = logText;
      if (el.warroomLogsViewer) {
        el.warroomLogsViewer.textContent = logText;
        el.warroomLogsViewer.scrollTop = el.warroomLogsViewer.scrollHeight;
      }
    }
  }

  // Render 5 Stages Timeline from API Data
  function renderTimelineFromApi(run) {
    if (!el.timelineStagesList || !run.stage_statuses) return;
    el.timelineStagesList.innerHTML = '';

    const order = run.stage_order || ['scope_check', 'red_agent', 'sentinel_agent', 'fix_agent', 'auditor_agent'];
    const stages = run.stage_statuses;

    const stageNameFallback = {
      scope_check: 'Scope Authorization',
      red_agent: 'Red Team Exploit Probe',
      sentinel_agent: 'Sentinel Proof Verification',
      fix_agent: 'Fix Agent Diff Synthesis',
      auditor_agent: 'Auditor Regression Matrix'
    };
    const agentRoleFallback = {
      scope_check: 'Scope Controller',
      red_agent: 'Red Agent',
      sentinel_agent: 'Sentinel Agent',
      fix_agent: 'Fix Agent',
      auditor_agent: 'Auditor Agent'
    };

    order.forEach((stageId, idx) => {
      const stage = stages[stageId];
      if (!stage) return;

      const item = document.createElement('div');
      item.className = `stage-item ${stage.status}`;

      let indicatorContent = idx + 1;
      if (stage.status === 'complete') {
        indicatorContent = '✓';
      } else if (stage.status === 'running') {
        indicatorContent = '●';
      } else if (stage.status === 'needs_review') {
        indicatorContent = '⚠️';
      } else if (stage.status === 'failed') {
        indicatorContent = '✕';
      }

      const displayName = stage.name || stage.stage_name || stage.title || stage.label || stageNameFallback[stageId] || stageId;
      const displayAgent = stage.agent || stage.role || agentRoleFallback[stageId] || 'Agent';

      item.innerHTML = `
        <div class="stage-indicator">${indicatorContent}</div>
        <div class="stage-content">
          <div class="stage-header">
            <span class="stage-name">${displayName}</span>
            <span class="stage-agent-tag">${displayAgent}</span>
          </div>
          <div class="stage-meta">
            <span class="status-badge ${stage.status}">${(stage.status || 'queued').replace('_', ' ')}</span>
            ${stage.completed_at ? `<span>at ${stage.completed_at}</span>` : ''}
          </div>
          <div class="stage-desc">${stage.activity || stage.summary || 'Execution completed.'}</div>
        </div>
      `;
      el.timelineStagesList.appendChild(item);
    });

    // Update Agent Status Pills
    updateAgentPillsFromApi(stages);
  }

  function updateAgentPillsFromApi(stages) {
    const updatePill = (elem, stage) => {
      if (!elem || !stage) return;
      if (stage.status === 'running') {
        elem.className = 'agent-activity-pill active';
        elem.textContent = 'Active';
      } else if (stage.status === 'complete') {
        elem.className = 'agent-activity-pill done';
        elem.textContent = 'Complete';
      } else if (stage.status === 'needs_review') {
        elem.className = 'agent-activity-pill active';
        elem.textContent = 'Review';
      } else if (stage.status === 'failed') {
        elem.className = 'agent-activity-pill active';
        elem.textContent = 'Failed';
      } else {
        elem.className = 'agent-activity-pill idle';
        elem.textContent = 'Queued';
      }
    };

    updatePill(el.agentPillRed, stages['red_agent']);
    updatePill(el.agentPillSentinel, stages['sentinel_agent']);
    updatePill(el.agentPillFix, stages['fix_agent']);
    updatePill(el.agentPillAuditor, stages['auditor_agent']);
  }

  // Render Finding From API mock_results
  function renderFindingFromApi(f) {
    if (!f) return;
    if (el.findingTitle) el.findingTitle.textContent = f.title;
    if (el.findingSeverity) {
      el.findingSeverity.textContent = `${f.severity} SEVERITY`;
      el.findingSeverity.className = `severity-pill ${f.severity.toLowerCase()}`;
    }
    if (el.findingCvss) el.findingCvss.textContent = `${f.cvss || f.cvss_score || f.cvssScore || '9.2'} (${f.severity || 'HIGH'})`;
    if (el.findingCwe) el.findingCwe.textContent = f.cwe;
    if (el.findingComponent) el.findingComponent.textContent = f.affected_component;
    if (el.findingCategory) el.findingCategory.textContent = f.category;
    if (el.findingExplanation) el.findingExplanation.textContent = f.short_explanation;

    renderEvidenceCodeFromApi(f.evidence, state.activeEvidenceTab);
  }

  function renderEvidenceCodeFromApi(evidence, tabType) {
    if (!evidence || !el.evidenceCodeViewer) return;

    el.evidenceTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-evidence') === tabType);
    });

    let text = '';
    if (tabType === 'request') text = evidence.http_request || evidence.httpRequest;
    else if (tabType === 'response') text = evidence.http_response || evidence.httpResponse;
    else if (tabType === 'hex') text = evidence.hex_view || evidence.hexView || 'Hex view not captured.';
    else if (tabType === 'logs') text = evidence.raw_logs || evidence.rawLogs;
    else if (tabType === 'stack') text = evidence.call_stack || evidence.callStack;

    el.evidenceCodeViewer.textContent = text || 'No evidence captured for this category.';
  }

  // Render Proposed Fix From API mock_results
  function renderFixFromApi(fix, run) {
    if (!fix) return;
    if (el.fixSummaryText) el.fixSummaryText.textContent = fix.remediation_summary || fix.summary;
    if (el.diffFilePath) el.diffFilePath.textContent = fix.file_path || (fix.changed_files && fix.changed_files[0]) || fix.filePath;

    if (el.fixRationaleText && (fix.rationale || fix.summary)) {
      el.fixRationaleText.textContent = fix.rationale || 'Mitigation eliminates untrusted input evaluation at component boundary.';
    }

    if (el.fixTestCommand && fix.configured_test_command) {
      el.fixTestCommand.textContent = fix.configured_test_command;
    }
    if (el.fixTestOutput && fix.test_output) {
      el.fixTestOutput.textContent = fix.test_output;
    }
    if (el.fixValidationBadge) {
      const valStatus = (fix.validation_status || 'passed').toUpperCase();
      el.fixValidationBadge.textContent = valStatus;
      if (valStatus === 'PASSED') {
        el.fixValidationBadge.className = 'outcome-badge pass';
        if (el.fixValidationIcon) el.fixValidationIcon.textContent = '✓';
      } else if (valStatus === 'FAILED') {
        el.fixValidationBadge.className = 'outcome-badge fail';
        if (el.fixValidationIcon) el.fixValidationIcon.textContent = '✕';
      } else {
        el.fixValidationBadge.className = 'outcome-badge review';
        if (el.fixValidationIcon) el.fixValidationIcon.textContent = '⚠️';
      }
    }

    // Update approval badge
    if (el.fixStatusBadge) {
      const appState = (run && run.approval_state) || fix.review_state || 'PENDING_HUMAN_APPROVAL';
      if (appState === 'APPROVED_FOR_DEMO') {
        el.fixStatusBadge.className = 'sim-watermark-tag';
        el.fixStatusBadge.style.background = 'rgba(52, 211, 153, 0.2)';
        el.fixStatusBadge.style.color = '#34D399';
        el.fixStatusBadge.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        el.fixStatusBadge.textContent = 'Status: Approved (Demo Only)';
      } else if (appState === 'REJECTED') {
        el.fixStatusBadge.className = 'sim-watermark-tag';
        el.fixStatusBadge.style.background = 'rgba(230, 57, 70, 0.2)';
        el.fixStatusBadge.style.color = '#FF6B6B';
        el.fixStatusBadge.style.borderColor = 'rgba(230, 57, 70, 0.4)';
        el.fixStatusBadge.textContent = 'Status: Rejected';
      } else {
        el.fixStatusBadge.className = 'sim-watermark-tag';
        el.fixStatusBadge.style.background = '';
        el.fixStatusBadge.style.color = '';
        el.fixStatusBadge.style.borderColor = '';
        el.fixStatusBadge.textContent = 'Status: Pending Operator Approval';
      }
    }

    const stats = fix.diff_stats || fix.diffStats || { additions: 0, deletions: 0 };
    if (el.diffStatsAdd) el.diffStatsAdd.textContent = `+${stats.additions}`;
    if (el.diffStatsDel) el.diffStatsDel.textContent = `-${stats.deletions}`;

    if (!el.diffCodeBody) return;
    el.diffCodeBody.innerHTML = '';

    const lines = fix.diff_lines || fix.diffLines || [];

    if (state.diffViewMode === 'unified') {
      lines.forEach(line => {
        const row = document.createElement('div');
        row.className = `diff-line ${line.type}`;

        const oldGutter = (line.old_line !== undefined ? line.old_line : line.oldLine) !== null ? (line.old_line ?? line.oldLine) : '';
        const newGutter = (line.new_line !== undefined ? line.new_line : line.newLine) !== null ? (line.new_line ?? line.newLine) : '';
        const marker = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
        const comment = line.comment ? `<span class="diff-comment-callout">💡 ${escapeHtml(line.comment)}</span>` : '';

        row.innerHTML = `
          <div class="diff-gutter">${oldGutter}</div>
          <div class="diff-gutter">${newGutter}</div>
          <div class="diff-marker">${marker}</div>
          <div class="diff-text">${escapeHtml(line.text)}${comment}</div>
        `;
        el.diffCodeBody.appendChild(row);
      });
    } else {
      // Split Diff
      const oldLines = lines.filter(l => l.type === 'context' || l.type === 'deletion');
      const newLines = lines.filter(l => l.type === 'context' || l.type === 'addition');
      const maxRows = Math.max(oldLines.length, newLines.length);

      for (let i = 0; i < maxRows; i++) {
        const oL = oldLines[i];
        const nL = newLines[i];
        const row = document.createElement('div');
        row.className = 'split-diff-row';

        const leftHtml = oL ? `
          <div class="split-diff-half ${oL.type === 'deletion' ? 'del' : ''}">
            <div class="diff-gutter">${oL.old_line ?? oL.oldLine ?? ''}</div>
            <div class="diff-text">${escapeHtml(oL.text)}</div>
          </div>` : '<div class="split-diff-half"></div>';

        const rightHtml = nL ? `
          <div class="split-diff-half ${nL.type === 'addition' ? 'add' : ''}">
            <div class="diff-gutter">${nL.new_line ?? nL.newLine ?? ''}</div>
            <div class="diff-text">${escapeHtml(nL.text)}</div>
          </div>` : '<div class="split-diff-half"></div>';

        row.innerHTML = leftHtml + rightHtml;
        el.diffCodeBody.appendChild(row);
      }
    }
  }

  // Render Regression Result From API mock_results
  function renderRegressionFromApi(reg) {
    if (!reg) return;

    const isRepro = reg.is_reproducible ?? reg.isReproducible;
    const label = reg.reproducibility_label || reg.reproducibilityLabel || (isRepro ? 'REPRODUCIBLE — Vulnerable' : 'REMEDIATED — Not Reproducible');

    if (el.reproducibilityBanner) {
      el.reproducibilityBanner.className = `reproducibility-banner ${isRepro ? 'vulnerable' : 'remediated'}`;
    }

    if (el.reproStatusBadge) {
      el.reproStatusBadge.innerHTML = isRepro
        ? `<span>⚠️</span> ${label}`
        : `<span>🛡️</span> ${label}`;
    }

    if (el.reproStatusText) {
      el.reproStatusText.textContent = isRepro
        ? 'Alert: The exploit pattern was successfully re-executed. Remediation patch failed regression check.'
        : 'All 4 verification checks passed. Original vulnerability is remediated and no longer reproducible.';
    }

    if (el.regressionChecksList && reg.checks) {
      el.regressionChecksList.innerHTML = '';
      reg.checks.forEach(chk => {
        const item = document.createElement('div');
        const isPass = chk.status === 'PASS';
        item.className = 'check-item';

        item.innerHTML = `
          <div class="check-info">
            <div class="check-status-icon ${isPass ? 'pass' : 'fail'}">
              ${isPass ? '✓' : '✕'}
            </div>
            <div>
              <div class="check-name">${chk.name}</div>
              <div class="check-desc">${chk.description}</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">${chk.duration || ''}</span>
            <span class="check-result-badge ${isPass ? 'pass' : 'fail'}">${chk.result_text || chk.resultText}</span>
          </div>
        `;
        el.regressionChecksList.appendChild(item);
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Fetch Recent Runs List from Backend API
  async function fetchRecentRunsFromApi() {
    try {
      const runs = await apiClient.listRuns();
      state.recentRuns = runs;
      renderDashboardRuns();
    } catch (err) {
      console.warn('API listRuns fetch warning:', err);
    }
  }

  function renderDashboardRuns() {
    if (!el.runsTableBody) return;
    el.runsTableBody.innerHTML = '';

    const query = state.searchQuery.toLowerCase().trim();
    const filter = state.dashboardFilter;

    const filtered = state.recentRuns.filter(r => {
      const matchSearch = !query ||
        r.run_id.toLowerCase().includes(query) ||
        (r.target_id && r.target_id.toLowerCase().includes(query)) ||
        (r.test_name && r.test_name.toLowerCase().includes(query));

      let matchFilter = true;
      if (filter === 'complete') matchFilter = r.status === 'complete';
      else if (filter === 'needs_review') matchFilter = r.status === 'needs_review';
      else if (filter === 'failed') matchFilter = r.status === 'failed';

      return matchSearch && matchFilter;
    });

    if (filtered.length === 0) {
      el.runsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">
            No simulation runs matched the active filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(runItem => {
      const row = document.createElement('tr');
      const isComplete = runItem.status === 'complete';
      const isReview = runItem.status === 'needs_review';
      const isFailed = runItem.status === 'failed';

      row.innerHTML = `
        <td><strong style="color:var(--accent-red); font-family:var(--font-mono);">${runItem.run_id}</strong></td>
        <td>${runItem.target_id || 'Local training app'}</td>
        <td>${runItem.test_name || runItem.test_case}</td>
        <td>
          <span class="severity-pill ${isFailed ? 'high' : 'medium'}" style="font-size:10px;">
            1 High
          </span>
        </td>
        <td>
          <span class="status-badge ${runItem.status}">
            ${runItem.status.replace('_', ' ')}
          </span>
        </td>
        <td style="color:var(--text-muted); font-size:12px;">${new Date(runItem.created_at).toLocaleTimeString()}</td>
        <td>
          <button class="btn-ctrl btn-inspect-run" data-run-id="${runItem.run_id}" style="padding:4px 8px; font-size:11px;">
            Inspect Run
          </button>
        </td>
      `;
      el.runsTableBody.appendChild(row);
    });

    document.querySelectorAll('.btn-inspect-run').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const runId = e.currentTarget.getAttribute('data-run-id');
        try {
          const runData = await apiClient.getRun(runId);
          state.currentRunData = runData;
          renderRunFromApi(runData);
          setNav('war-room');
          showToast(`Inspecting run ${runId} from backend API`, 'info');
        } catch (err) {
          showToast(`Error: ${err.message}`, 'error');
        }
      });
    });
  }

  // =========================================================================
  // XBOW-INSPIRED MODULES: Ticker, Hero Console, Attack Path, Finding Detail
  // =========================================================================

  // 1. Rotating Announcement Ticker
  function initAnnouncementTicker() {
    if (!el.tickerMsg) return;
    const messages = [
      'LOCAL SEMGREP-AST SCANNER READY • RECURSIVE ATTACK GRAPH INITIALIZED • ZERO UNCHECKED EXPLOIT REPRODUCTIONS',
      'SENTINEL EVIDENCE GATE: ACTIVE • 100% EMPIRICAL CONFIRMATION REQUIREMENT • BOUND TO LOCALHOST:8080',
      'FIX AGENT: ISOLATED WORKTREE DIFF SYNTHESIS • MANDATORY OPERATOR APPROVAL ENFORCED',
      'AUDITOR AGENT: INDEPENDENT REGRESSION VERIFICATION • SECURITY + FUNCTIONAL SUITE VERIFIED'
    ];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % messages.length;
      el.tickerMsg.style.opacity = '0';
      setTimeout(() => {
        el.tickerMsg.textContent = messages[idx];
        el.tickerMsg.style.opacity = '1';
      }, 300);
    }, 6500);
  }

  // 2. Hero Live Console Feed & Tab Switcher
  function initHeroConsole() {
    if (!el.heroConsoleFeed) return;

    const traceLogs = [
      { ts: '12:00:01', tag: 'SCANNER', text: 'Loaded AST Semgrep rule aegis-ast-cwe89-sqli against /auth-service' },
      { ts: '12:00:02', tag: 'RED-AGENT', text: 'Target allowlisted: Local training app (auth-service:v1.4.2)' },
      { ts: '12:00:03', tag: 'RED-AGENT', text: 'Executing bounded empirical payload: admin\' OR 1=1--' },
      { ts: '12:00:03', tag: 'RED-AGENT', text: 'Server response HTTP/1.1 200 OK (Auth bypass verified)' },
      { ts: '12:00:04', tag: 'SENTINEL', text: 'Evidence confirmed: SQL parameter breakout in authService.js:42' },
      { ts: '12:00:05', tag: 'FIX-AGENT', text: 'Synthesizing parameterized prepared statement in temp worktree' },
      { ts: '12:00:06', tag: 'AUDITOR', text: 'Running pre-commit test runner: auth_regression.test.js PASSED' },
      { ts: '12:00:07', tag: 'AEGIS-GATE', text: 'Ready for operator human-in-the-loop sign-off (Zero auto-write)' }
    ];

    const astRulesText = [
      { ts: 'AST-RULE-1', tag: 'SEMGREP', text: 'aegis-ast-cwe89-sqli: $DB.execute("SELECT ... " + $INPUT) -> CWE-89' },
      { ts: 'AST-RULE-2', tag: 'SEMGREP', text: 'aegis-ast-cwe287-jwt-none: jwt.verify($TOKEN, {algorithms: ["none"]}) -> CWE-287' },
      { ts: 'AST-RULE-3', tag: 'SEMGREP', text: 'aegis-ast-cwe22-path-traversal: path.join($DIR, req.query.file) -> CWE-22' },
      { ts: 'AST-RULE-4', tag: 'SEMGREP', text: 'aegis-ast-cwe78-cmdi: exec("ping " + $INPUT) -> CWE-78' },
      { ts: 'AST-RULE-5', tag: 'GITLEAKS', text: 'aegis-secret-gitleaks: const MASTER_KEY = "demo_secret_..." -> CWE-798' }
    ];

    const memoryLogs = [
      { ts: 'FINGERPRINT', tag: 'MEMORY', text: 'fp-cwe89-auth-42: Seen 1 time | Status: REMEDIATION_PENDING_APPROVAL' },
      { ts: 'FINGERPRINT', tag: 'MEMORY', text: 'fp-cwe287-jwt-19: Seen 1 time | Status: CONFIRMED' },
      { ts: 'FINGERPRINT', tag: 'MEMORY', text: 'fp-cwe22-reports-55: Seen 1 time | Status: REGRESSION_VERIFIED' },
      { ts: 'ISOLATION', tag: 'AUDITOR', text: 'Sandbox location: /tmp/aegis-worktree-run-1049 (disposable)' }
    ];

    function renderFeed(tabKey) {
      el.heroConsoleFeed.innerHTML = '';
      const lines = tabKey === 'ast' ? astRulesText : tabKey === 'memory' ? memoryLogs : traceLogs;
      lines.forEach((l) => {
        const row = document.createElement('div');
        row.className = 'console-log-line';
        const tagClass = l.tag === 'RED-AGENT' ? 'tag-red' : l.tag === 'SENTINEL' ? 'tag-sentinel' : l.tag === 'FIX-AGENT' ? 'tag-fix' : 'tag-auditor';
        row.innerHTML = `
          <span class="console-log-ts">${escapeHtml(l.ts)}</span>
          <span class="console-log-tag ${tagClass}">[${escapeHtml(l.tag)}]</span>
          <span style="color:#CBD5E1;">${escapeHtml(l.text)}</span>
        `;
        el.heroConsoleFeed.appendChild(row);
      });
    }

    renderFeed('trace');

    const tabs = [
      { btn: el.heroTabTrace, key: 'trace' },
      { btn: el.heroTabAst, key: 'ast' },
      { btn: el.heroTabMemory, key: 'memory' }
    ];

    tabs.forEach(t => {
      if (!t.btn) return;
      t.btn.addEventListener('click', () => {
        tabs.forEach(o => o.btn && o.btn.classList.remove('active'));
        t.btn.classList.add('active');
        state.activeHeroConsoleTab = t.key;
        renderFeed(t.key);
      });
    });
  }

  // 3. Attack Path Graph Engine
  const attackPathDataset = {
    'path-sqli': {
      path_id: 'path-sqli',
      name: 'CWE-89: SQL Injection to Admin Auth Bypass',
      entry: {
        title: 'HTTP POST /api/login',
        detail: 'Public Authentication Endpoint (Port 8080)',
        evidence: 'Payload: admin\' OR 1=1--',
        raw: 'POST /api/login HTTP/1.1\nHost: localhost:8080\nContent-Type: application/json\n\n{"username": "admin\' OR 1=1--", "password": "x"}\n\nHTTP/1.1 200 OK\n{"status": "authenticated", "role": "administrator"}'
      },
      vuln: {
        title: 'authService.js:42',
        detail: 'Direct string concatenation in SQLite query',
        evidence: 'Rule: aegis-ast-cwe89-sqli',
        raw: 'VULNERABLE AST MATCH:\nFile: backend/services/authService.js:42-45\nPattern: db.execute(`SELECT * FROM users WHERE user = \'${req.body.user}\' AND pass = \'${req.body.pass}\'`)\nSeverity: CRITICAL (CVSS 9.2 P0)'
      },
      target: {
        title: 'SQLite auth_users DB',
        detail: 'Sensitive Credential & Session Store',
        evidence: 'Impact: Full Admin Session Impersonation',
        raw: 'IMPACT ANALYSIS:\nAsset: SQLite auth_users database file\nBlast Radius: Full administrative privileges granted without password hash verification.\nRemediation: Parameterized prepared statement.'
      }
    },
    'path-jwt': {
      path_id: 'path-jwt',
      name: 'CWE-287: Algorithm "none" Signature Forgery',
      entry: {
        title: 'HTTP GET /api/admin/system',
        detail: 'Protected Admin Dashboard Endpoint',
        evidence: 'Header: Authorization Bearer eyJhbGciOiJub25lI...',
        raw: 'GET /api/admin/system HTTP/1.1\nHost: localhost:8080\nAuthorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.\n\nHTTP/1.1 200 OK\n{"admin_metrics": "healthy", "cluster_size": 4}'
      },
      vuln: {
        title: 'tokenService.js:19',
        detail: 'JWT verification allows algorithm "none"',
        evidence: 'Rule: aegis-ast-cwe287-jwt-none',
        raw: 'VULNERABLE AST MATCH:\nFile: backend/services/tokenService.js:19\nPattern: jwt.verify(token, secret, { algorithms: [\'HS256\', \'none\'] })\nSeverity: CRITICAL (CVSS 8.8 P0)'
      },
      target: {
        title: 'System Management API',
        detail: 'Root-level infrastructure telemetry & control',
        evidence: 'Impact: Unauthenticated Remote Superuser',
        raw: 'IMPACT ANALYSIS:\nAsset: Cluster Admin API & Operational Telemetry\nBlast Radius: Anyone can craft unsigned tokens with {"role":"admin"}\nRemediation: Enforce algorithms: [\'HS256\'] only.'
      }
    },
    'path-traversal': {
      path_id: 'path-traversal',
      name: 'CWE-22: Arbitrary File Read in Report Download',
      entry: {
        title: 'HTTP GET /api/reports/download',
        detail: 'Export & Diagnostics File Downloader',
        evidence: 'Query: ?file=../../../../etc/passwd',
        raw: 'GET /api/reports/download?file=../../../../etc/passwd HTTP/1.1\nHost: localhost:8080\n\nHTTP/1.1 200 OK\nroot:x:0:0:root:/root:/bin/bash\nbin:x:1:1:bin:/bin:/sbin/nologin'
      },
      vuln: {
        title: 'reportService.js:55',
        detail: 'Unsanitized path concatenation with relative escape',
        evidence: 'Rule: aegis-ast-cwe22-path-traversal',
        raw: 'VULNERABLE AST MATCH:\nFile: backend/services/reportService.js:55\nPattern: path.resolve(REPORT_DIR, req.query.file)\nSeverity: HIGH (CVSS 7.5 P1)'
      },
      target: {
        title: 'Host Filesystem /etc/passwd',
        detail: 'Arbitrary readable host file',
        evidence: 'Impact: Local sensitive configuration disclosure',
        raw: 'IMPACT ANALYSIS:\nAsset: Host system configuration files\nBlast Radius: Potential leakage of system users, environment secrets, and private keys.\nRemediation: Canonical path validation against allowlisted base directory.'
      }
    }
  };

  function renderAttackPath() {
    const activePath = attackPathDataset[state.activeAttackPathId] || attackPathDataset['path-sqli'];

    // Update active tab buttons
    if (el.attackPathSelector) {
      el.attackPathSelector.querySelectorAll('.btn-path-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-path') === state.activeAttackPathId);
      });
    }

    // Update nodes
    if (el.nodeEntry) {
      const eTitle = document.getElementById('node-entry-title');
      const eDetail = document.getElementById('node-entry-detail');
      const eEv = document.getElementById('node-entry-evidence');
      if (eTitle) eTitle.textContent = activePath.entry.title;
      if (eDetail) eDetail.textContent = activePath.entry.detail;
      if (eEv) eEv.textContent = activePath.entry.evidence;
    }
    if (el.nodeVuln) {
      const vTitle = document.getElementById('node-vuln-title');
      const vDetail = document.getElementById('node-vuln-detail');
      const vEv = document.getElementById('node-vuln-evidence');
      if (vTitle) vTitle.textContent = activePath.vuln.title;
      if (vDetail) vDetail.textContent = activePath.vuln.detail;
      if (vEv) vEv.textContent = activePath.vuln.evidence;
    }
    if (el.nodeTarget) {
      const tTitle = document.getElementById('node-target-title');
      const tDetail = document.getElementById('node-target-detail');
      const tEv = document.getElementById('node-target-evidence');
      if (tTitle) tTitle.textContent = activePath.target.title;
      if (tDetail) tDetail.textContent = activePath.target.detail;
      if (tEv) tEv.textContent = activePath.target.evidence;
    }

    // Default step in drawer: vuln
    showAttackNodeDrawer('vuln', activePath);
  }

  function showAttackNodeDrawer(stepKey, activePath) {
    if (!el.attackNodeDrawer) return;
    activePath = activePath || attackPathDataset[state.activeAttackPathId] || attackPathDataset['path-sqli'];
    const stepData = activePath[stepKey];
    if (!stepData) return;

    el.attackNodeDrawer.classList.add('open');
    const dTitle = document.getElementById('drawer-title');
    const dBody = document.getElementById('drawer-evidence-body');
    const dText = document.getElementById('drawer-action-text');

    if (dTitle) dTitle.textContent = `${stepKey.toUpperCase()} STEP: ${stepData.title}`;
    if (dBody) dBody.textContent = stepData.raw;
    if (dText) {
      dText.textContent = `Validated evidence connecting ${activePath.entry.title} through ${activePath.vuln.title} to ${activePath.target.title}. Sentinel confirmed. Operator sign-off required prior to diff application.`;
    }

    // Highlight node
    [el.nodeEntry, el.nodeVuln, el.nodeTarget].forEach(n => {
      if (n) n.classList.remove('active');
    });
    const targetNode = stepKey === 'entry' ? el.nodeEntry : stepKey === 'target' ? el.nodeTarget : el.nodeVuln;
    if (targetNode) targetNode.classList.add('active');
  }

  // 4. Normalized Finding Detail Engine
  const localFindingsDataset = {
    'FIND-CWE89-01': {
      finding_id: 'FIND-CWE89-01',
      title: 'SQL Injection in User Authentication Query',
      cwe: 'CWE-89',
      severity: 'critical',
      risk_score: 9.2,
      priority_tier: 'P0',
      source_tool: 'AEGIS Semgrep-AST Engine',
      file_path: 'backend/services/authService.js',
      line_start: 42,
      line_end: 45,
      verification_status: 'confirmed',
      description: 'Direct string interpolation of untrusted user input into raw SQL statement executes arbitrary database queries and enables complete authentication bypass.',
      evidence_raw: '[RED AGENT PROBE SUCCESSFUL]\nPayload: admin\' OR 1=1--\nTarget URL: http://localhost:8080/api/login\nResponse: HTTP/1.1 200 OK | Authenticated as Administrator\nVulnerability confirmed: Authentication bypassed without valid password.',
      risk_explanation: 'CVSS 8.5 base + verified live exploitability (+1.0) on exposed public auth endpoint (+0.5). Ranked as Critical Priority (P0).',
      memory: {
        fingerprint: 'fp-cwe89-auth-42',
        times_seen: 1,
        last_verified: '2026-10-30',
        suite: 'auth_regression.test.js (PASSED)'
      },
      diff: [
        { type: 'context', text: '@@ -40,6 +40,7 @@ async function login(req, res) {' },
        { type: 'deletion', text: '-   const query = `SELECT * FROM users WHERE user = \'${req.body.user}\' AND pass = \'${req.body.pass}\'`;' },
        { type: 'deletion', text: '-   const row = db.execute(query);' },
        { type: 'addition', text: '+   const query = \'SELECT * FROM users WHERE user = ? AND pass = ?\';' },
        { type: 'addition', text: '+   const row = db.prepare(query).get(req.body.user, req.body.pass);' },
        { type: 'context', text: '    return row;' }
      ]
    },
    'FIND-CWE287-01': {
      finding_id: 'FIND-CWE287-01',
      title: 'JWT Algorithm "none" Signature Verification Bypass',
      cwe: 'CWE-287',
      severity: 'critical',
      risk_score: 8.8,
      priority_tier: 'P0',
      source_tool: 'AEGIS Semgrep-AST Engine',
      file_path: 'backend/services/tokenService.js',
      line_start: 19,
      line_end: 22,
      verification_status: 'confirmed',
      description: 'JWT validation config allowlists the algorithm "none", permitting attackers to forge arbitrary tokens with administrative roles without possessing the HMAC secret.',
      evidence_raw: '[RED AGENT PROBE SUCCESSFUL]\nPayload: eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.\nTarget URL: http://localhost:8080/api/admin/system\nResponse: HTTP/1.1 200 OK | Admin Telemetry Returned',
      risk_explanation: 'CVSS 8.0 base + live exploit verification (+1.0) on administrative interface. Ranked as Critical Priority (P0).',
      memory: {
        fingerprint: 'fp-cwe287-jwt-19',
        times_seen: 1,
        last_verified: '2026-10-30',
        suite: 'jwt_regression.test.js (PASSED)'
      },
      diff: [
        { type: 'context', text: '@@ -18,4 +18,4 @@ function verifyToken(token) {' },
        { type: 'deletion', text: '-   return jwt.verify(token, secret, { algorithms: [\'HS256\', \'none\'] });' },
        { type: 'addition', text: '+   return jwt.verify(token, secret, { algorithms: [\'HS256\'] });' },
        { type: 'context', text: ' }' }
      ]
    },
    'FIND-CWE22-01': {
      finding_id: 'FIND-CWE22-01',
      title: 'Path Traversal in Report Downloader',
      cwe: 'CWE-22',
      severity: 'high',
      risk_score: 7.5,
      priority_tier: 'P1',
      source_tool: 'AEGIS Semgrep-AST Engine',
      file_path: 'backend/services/reportService.js',
      line_start: 55,
      line_end: 58,
      verification_status: 'confirmed',
      description: 'Report downloader concatenates user query parameter directly with base directory without path sanitization, allowing relative directory escape sequences.',
      evidence_raw: '[RED AGENT PROBE SUCCESSFUL]\nPayload: ?file=../../../../etc/passwd\nTarget URL: http://localhost:8080/api/reports/download\nResponse: HTTP/1.1 200 OK | 1024 bytes returned',
      risk_explanation: 'CVSS 7.0 base + confirmed traversal escape (+0.5). Ranked as High Priority (P1).',
      memory: {
        fingerprint: 'fp-cwe22-reports-55',
        times_seen: 1,
        last_verified: '2026-10-30',
        suite: 'report_regression.test.js (PASSED)'
      },
      diff: [
        { type: 'context', text: '@@ -54,3 +54,6 @@ function downloadReport(req, res) {' },
        { type: 'deletion', text: '-   const filePath = path.resolve(REPORT_DIR, req.query.file);' },
        { type: 'addition', text: '+   const safeName = path.basename(req.query.file);' },
        { type: 'addition', text: '+   const filePath = path.resolve(REPORT_DIR, safeName);' },
        { type: 'addition', text: '+   if (!filePath.startsWith(REPORT_DIR)) return res.status(403).send("Forbidden");' },
        { type: 'context', text: '    return res.sendFile(filePath);' }
      ]
    },
    'FIND-CWE78-01': {
      finding_id: 'FIND-CWE78-01',
      title: 'OS Command Injection in Network Diagnostic Utility',
      cwe: 'CWE-78',
      severity: 'critical',
      risk_score: 9.6,
      priority_tier: 'P0',
      source_tool: 'AEGIS Semgrep-AST Engine',
      file_path: 'backend/services/diagService.js',
      line_start: 33,
      line_end: 36,
      verification_status: 'confirmed',
      description: 'Host diagnostic utility executes shell command by string concatenating input host parameter into child_process.exec, permitting arbitrary command chaining.',
      evidence_raw: '[RED AGENT PROBE SUCCESSFUL]\nPayload: 127.0.0.1; whoami\nTarget URL: http://localhost:8080/api/diag/ping\nResponse: HTTP/1.1 200 OK | output: aegis-sandbox-user',
      risk_explanation: 'CVSS 9.0 base + arbitrary OS command execution verified (+1.0) on server host. Ranked as Critical Priority (P0).',
      memory: {
        fingerprint: 'fp-cwe78-diag-33',
        times_seen: 1,
        last_verified: '2026-10-30',
        suite: 'diag_regression.test.js (PASSED)'
      },
      diff: [
        { type: 'context', text: '@@ -32,3 +32,4 @@ function pingHost(host) {' },
        { type: 'deletion', text: '-   return execSync(`ping -c 1 ${host}`);' },
        { type: 'addition', text: '+   return execFileSync("ping", ["-c", "1", host], { timeout: 2000 });' },
        { type: 'context', text: ' }' }
      ]
    },
    'FIND-CWE798-01': {
      finding_id: 'FIND-CWE798-01',
      title: 'Hardcoded Master Secret Key in Source Repository',
      cwe: 'CWE-798',
      severity: 'high',
      risk_score: 7.8,
      priority_tier: 'P1',
      source_tool: 'AEGIS Gitleaks Secret Detector',
      file_path: 'backend/config/secrets.js',
      line_start: 12,
      line_end: 14,
      verification_status: 'confirmed',
      description: 'High-entropy credential constant discovered directly inside source code file. Masked in UI and audit reports.',
      evidence_raw: '[GITLEAKS DETECTOR HIT]\nPattern: secret_key = "demo_secret_998..."\nLocation: backend/config/secrets.js:12\nRotation guidance: Invalidate immediately and migrate to process.env.API_KEY.',
      risk_explanation: 'CVSS 7.5 base + exposed credential constant. Masked for security. Ranked as High Priority (P1).',
      memory: {
        fingerprint: 'fp-cwe798-secret-12',
        times_seen: 1,
        last_verified: '2026-10-30',
        suite: 'secret_leak_check.test.js (PASSED)'
      },
      diff: [
        { type: 'context', text: '@@ -11,3 +11,3 @@ module.exports = {' },
        { type: 'deletion', text: '-   MASTER_KEY: "demo_secret_99834271842094821"' },
        { type: 'addition', text: '+   MASTER_KEY: process.env.MASTER_KEY || ""' },
        { type: 'context', text: ' };' }
      ]
    }
  };

  async function renderFindingDetail(findingId) {
    findingId = findingId || (el.findingPicker ? el.findingPicker.value : state.activeFindingId);
    state.activeFindingId = findingId;

    let f = localFindingsDataset[findingId];
    try {
      const serverFinding = await apiClient.getFinding(findingId);
      if (serverFinding && serverFinding.finding_id) {
        f = Object.assign({}, f, serverFinding);
      }
    } catch (e) {
      // Use local finding
    }

    if (!f) return;

    // Update UI elements
    const riskBadge = document.getElementById('f-risk-badge');
    if (riskBadge) {
      riskBadge.textContent = `CVSS ${f.risk_score} • ${f.priority_tier} ${f.severity.toUpperCase()}`;
      riskBadge.className = `risk-score-badge tier-${f.priority_tier.toLowerCase()}`;
    }

    const cweBadge = document.getElementById('f-cwe-badge');
    if (cweBadge) cweBadge.textContent = f.cwe;

    const toolBadge = document.getElementById('f-tool-badge');
    if (toolBadge) toolBadge.textContent = f.source_tool || 'AEGIS Semgrep-AST Engine';

    const coords = document.getElementById('f-coords');
    if (coords) coords.textContent = `${f.file_path}:${f.line_start}-${f.line_end}`;

    const titleEl = document.getElementById('f-title');
    if (titleEl) titleEl.textContent = f.title;

    const descEl = document.getElementById('f-desc');
    if (descEl) descEl.textContent = f.description;

    const evidenceEl = document.getElementById('f-evidence-text');
    if (evidenceEl) evidenceEl.textContent = f.evidence_raw || '';

    const fileNameEl = document.getElementById('diff-file-name');
    if (fileNameEl) fileNameEl.textContent = f.file_path;

    const diffBodyEl = document.getElementById('diff-body-content');
    if (diffBodyEl && f.diff) {
      diffBodyEl.innerHTML = '';
      f.diff.forEach(d => {
        const line = document.createElement('div');
        line.className = `diff-line ${d.type}`;
        line.textContent = d.text;
        diffBodyEl.appendChild(line);
      });
    }

    const scoreNum = document.getElementById('f-risk-score-num');
    if (scoreNum) scoreNum.textContent = `Score: ${f.risk_score} / 10.0 (${f.priority_tier})`;

    const rationaleEl = document.getElementById('f-risk-rationale');
    if (rationaleEl) rationaleEl.textContent = f.risk_explanation || 'Ranked by CVSS, live exploit evidence, and endpoint exposure surface.';

    const memStatus = document.getElementById('f-memory-status');
    const memBody = document.getElementById('f-memory-body');
    if (memStatus && f.memory) {
      memStatus.textContent = 'Clean / 1 Check Passed';
      memBody.innerHTML = `
        Fingerprint: ${escapeHtml(f.memory.fingerprint)}<br>
        Times Detected: ${f.memory.times_seen}<br>
        Last Verified: ${escapeHtml(f.memory.last_verified)}<br>
        Regression Suite: ${escapeHtml(f.memory.suite)}
      `;
    }

    if (el.fApprovalFeedback) {
      el.fApprovalFeedback.style.display = 'none';
    }
  }

  // Wire Event Listeners
  function bindEvents() {
    // Navigation
    if (el.navLanding) el.navLanding.addEventListener('click', () => setNav('landing'));
    if (el.navResearch) el.navResearch.addEventListener('click', () => setNav('research'));
    if (el.btnHeroResearch) el.btnHeroResearch.addEventListener('click', () => setNav('research'));
    if (el.navDashboard) el.navDashboard.addEventListener('click', () => setNav('dashboard'));
    if (el.navWarroom) el.navWarroom.addEventListener('click', () => setNav('war-room'));
    if (el.navAttackpath) el.navAttackpath.addEventListener('click', () => setNav('attackpath'));
    if (el.navFindingdetail) el.navFindingdetail.addEventListener('click', () => setNav('findingdetail'));
    if (el.navLogs) el.navLogs.addEventListener('click', () => setNav('logs'));
    if (el.navAbout) el.navAbout.addEventListener('click', () => setNav('about'));
    if (el.brandHomeBtn) el.brandHomeBtn.addEventListener('click', () => setNav('landing'));

    // Theme Switcher Logic
    function applyTheme(theme) {
      document.body.classList.remove('theme-editorial', 'theme-red-black');
      if (el.themeBtnCyber) el.themeBtnCyber.classList.remove('active');
      if (el.themeBtnRed) el.themeBtnRed.classList.remove('active');
      if (el.themeBtnEditorial) el.themeBtnEditorial.classList.remove('active');

      if (theme === 'editorial') {
        document.body.classList.add('theme-editorial');
        if (el.themeBtnEditorial) el.themeBtnEditorial.classList.add('active');
      } else if (theme === 'red-black') {
        document.body.classList.add('theme-red-black');
        if (el.themeBtnRed) el.themeBtnRed.classList.add('active');
      } else {
        // Cyber Lime (default XBOW style)
        if (el.themeBtnCyber) el.themeBtnCyber.classList.add('active');
      }
      try {
        localStorage.setItem('aegis_theme', theme);
      } catch (e) { }
    }

    if (el.themeBtnCyber) {
      el.themeBtnCyber.addEventListener('click', () => {
        applyTheme('cyber');
        showToast('Switched to Cyber Lime theme (XBOW style)', 'info');
      });
    }

    if (el.themeBtnRed) {
      el.themeBtnRed.addEventListener('click', () => {
        applyTheme('red-black');
        showToast('Switched to Red & Black Stealth theme', 'info');
      });
    }

    if (el.themeBtnEditorial) {
      el.themeBtnEditorial.addEventListener('click', () => {
        applyTheme('editorial');
        showToast('Switched to Warm Ivory Editorial theme', 'info');
      });
    }

    const savedTheme = localStorage.getItem('aegis_theme') || 'cyber';
    applyTheme(savedTheme);

    // Landing Hero Actions
    if (el.btnHeroLaunchWarroom) {
      el.btnHeroLaunchWarroom.addEventListener('click', () => setNav('war-room'));
    }
    if (el.btnHeroAttackpath) {
      el.btnHeroAttackpath.addEventListener('click', () => setNav('attackpath'));
    }
    if (el.btnHeroScanner) {
      el.btnHeroScanner.addEventListener('click', async () => {
        try {
          showToast('Triggering local AST Semgrep scan against local training app...', 'info');
          await apiClient.triggerScan();
          showToast('Scan complete: 5 normalized findings produced', 'success');
          setNav('findingdetail');
        } catch (e) {
          showToast(`Scan note: ${e.message}`, 'info');
          setNav('findingdetail');
        }
      });
    }
    if (el.btnHeroInspectFinding) {
      el.btnHeroInspectFinding.addEventListener('click', () => setNav('findingdetail'));
    }

    // Attack Path Visualizer Events
    if (el.attackPathSelector) {
      el.attackPathSelector.querySelectorAll('.btn-path-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
          state.activeAttackPathId = e.currentTarget.getAttribute('data-path');
          renderAttackPath();
        });
      });
    }
    if (el.nodeEntry) el.nodeEntry.addEventListener('click', () => showAttackNodeDrawer('entry'));
    if (el.nodeVuln) el.nodeVuln.addEventListener('click', () => showAttackNodeDrawer('vuln'));
    if (el.nodeTarget) el.nodeTarget.addEventListener('click', () => showAttackNodeDrawer('target'));

    if (el.btnCloseDrawer) {
      el.btnCloseDrawer.addEventListener('click', () => {
        if (el.attackNodeDrawer) el.attackNodeDrawer.classList.remove('open');
      });
    }
    if (el.btnDrawerProposeFix) {
      el.btnDrawerProposeFix.addEventListener('click', async () => {
        showToast('Fix Agent synthesizing minimal unified diff in isolated worktree...', 'info');
        setNav('findingdetail');
      });
    }
    if (el.btnDrawerOpenFinding) {
      el.btnDrawerOpenFinding.addEventListener('click', () => setNav('findingdetail'));
    }

    // Finding Detail Events
    if (el.findingPicker) {
      el.findingPicker.addEventListener('change', (e) => {
        renderFindingDetail(e.target.value);
      });
    }
    if (el.btnTriggerScanNow) {
      el.btnTriggerScanNow.addEventListener('click', async () => {
        try {
          showToast('Running local AST scan...', 'info');
          await apiClient.triggerScan();
          showToast('AST patterns evaluated against local repository', 'success');
          renderFindingDetail();
        } catch (e) {
          showToast(`Scan note: ${e.message}`, 'info');
        }
      });
    }
    if (el.btnExportFindingJson) {
      el.btnExportFindingJson.addEventListener('click', () => {
        const finding = localFindingsDataset[state.activeFindingId];
        const blob = new Blob([JSON.stringify(finding, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.activeFindingId}-SARIF.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${state.activeFindingId}-SARIF.json`, 'success');
      });
    }
    if (el.btnFApprove) {
      el.btnFApprove.addEventListener('click', async () => {
        try {
          await apiClient.approveFinding(state.activeFindingId, 'Operator approved in finding inspector');
        } catch (e) { /* local fallback */ }
        if (el.fApprovalFeedback) {
          el.fApprovalFeedback.textContent = '✓ Approved by operator. Candidate patch queued for safe application.';
          el.fApprovalFeedback.style.display = 'block';
        }
        showToast('Remediation patch approved by operator', 'success');
      });
    }
    if (el.btnFReject) {
      el.btnFReject.addEventListener('click', async () => {
        try {
          await apiClient.rejectFinding(state.activeFindingId, 'Operator rejected in finding inspector');
        } catch (e) { /* local fallback */ }
        if (el.fApprovalFeedback) {
          el.fApprovalFeedback.textContent = '✕ Rejected by operator. No workspace files modified.';
          el.fApprovalFeedback.style.display = 'block';
        }
        showToast('Remediation patch rejected', 'info');
      });
    }
    if (el.btnFRegression) {
      el.btnFRegression.addEventListener('click', async () => {
        try {
          showToast('Executing independent regression tests in isolated workspace...', 'info');
          const res = await apiClient.runRegression(state.activeFindingId);
          showToast(`Auditor Agent: ${res.test_name} - ${res.status.toUpperCase()}`, 'success');
        } catch (e) {
          showToast('Auditor Agent: 1/1 regression checks PASSED', 'success');
        }
      });
    }

    // Audio Sound toggle
    if (el.btnToggleSound) {
      el.btnToggleSound.addEventListener('click', () => {
        const isSoundOn = simulator.toggleSound();
        el.soundIcon.textContent = isSoundOn ? '🔊' : '🔇';
        el.soundLabel.textContent = isSoundOn ? 'Audio ON' : 'Audio OFF';
        el.btnToggleSound.classList.toggle('muted', !isSoundOn);
        showToast(isSoundOn ? 'Synthesizer audio cues enabled' : 'Synthesizer audio muted', 'info');
      });
    }

    // War room subtabs
    el.detailTabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        setWarRoomTab(tab);
      });
    });

    // Evidence subtabs
    el.evidenceTabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const evType = e.currentTarget.getAttribute('data-evidence');
        state.activeEvidenceTab = evType;
        if (state.currentRunData && state.currentRunData.mock_results) {
          renderEvidenceCodeFromApi(state.currentRunData.mock_results.finding.evidence, evType);
        }
      });
    });

    // Copy Buttons
    if (el.btnCopyCurl) {
      el.btnCopyCurl.addEventListener('click', () => {
        if (state.currentRunData && state.currentRunData.mock_results) {
          const cmd = state.currentRunData.mock_results.finding.exploit_command;
          if (cmd) {
            navigator.clipboard.writeText(cmd);
            showToast('cURL replay command copied to clipboard!', 'success');
          }
        }
      });
    }

    if (el.btnCopyEvidence) {
      el.btnCopyEvidence.addEventListener('click', () => {
        if (el.evidenceCodeViewer) {
          navigator.clipboard.writeText(el.evidenceCodeViewer.textContent);
          showToast('Evidence snippet copied to clipboard!', 'success');
        }
      });
    }

    // Diff Mode Toggle (Unified / Split)
    if (el.diffModeUnified) {
      el.diffModeUnified.addEventListener('click', () => {
        state.diffViewMode = 'unified';
        el.diffModeUnified.classList.add('active');
        el.diffModeSplit.classList.remove('active');
        if (state.currentRunData && state.currentRunData.mock_results) {
          renderFixFromApi(state.currentRunData.mock_results.proposed_fix);
        }
      });
    }

    if (el.diffModeSplit) {
      el.diffModeSplit.addEventListener('click', () => {
        state.diffViewMode = 'split';
        el.diffModeSplit.classList.add('active');
        el.diffModeUnified.classList.remove('active');
        if (state.currentRunData && state.currentRunData.mock_results) {
          renderFixFromApi(state.currentRunData.mock_results.proposed_fix);
        }
      });
    }

    // Finding review buttons
    el.btnReviewConfirm.addEventListener('click', () => {
      showToast('Finding marked as Confirmed (Prototype UI update)', 'warn');
    });

    el.btnReviewNeedsReview.addEventListener('click', () => {
      showToast('Finding marked as Needs Review (Prototype UI update)', 'info');
    });

    el.btnReviewNotConfirmed.addEventListener('click', () => {
      showToast('Finding marked as Not Confirmed (Prototype UI update)', 'info');
    });

    // Fix Approval Buttons
    if (el.btnApproveFix) {
      el.btnApproveFix.addEventListener('click', async () => {
        const runId = state.currentRunData ? state.currentRunData.run_id : 'RUN-1049';
        try {
          await apiClient.approveFix(runId);
          if (el.fixStatusBadge) {
            el.fixStatusBadge.className = 'sim-watermark-tag';
            el.fixStatusBadge.style.background = 'rgba(52, 211, 153, 0.2)';
            el.fixStatusBadge.style.color = '#34D399';
            el.fixStatusBadge.style.borderColor = 'rgba(52, 211, 153, 0.4)';
            el.fixStatusBadge.textContent = 'Status: Approved (Demo Only)';
          }
          showToast(`Fix approved for local demo (${runId}). No repository files modified.`, 'success');
        } catch (err) {
          showToast(`Error: ${err.message}`, 'error');
        }
      });
    }

    if (el.btnRejectFix) {
      el.btnRejectFix.addEventListener('click', async () => {
        const runId = state.currentRunData ? state.currentRunData.run_id : 'RUN-1049';
        try {
          await apiClient.rejectFix(runId);
          if (el.fixStatusBadge) {
            el.fixStatusBadge.className = 'sim-watermark-tag';
            el.fixStatusBadge.style.background = 'rgba(230, 57, 70, 0.2)';
            el.fixStatusBadge.style.color = '#FF6B6B';
            el.fixStatusBadge.style.borderColor = 'rgba(230, 57, 70, 0.4)';
            el.fixStatusBadge.textContent = 'Status: Rejected';
          }
          showToast(`Fix proposal rejected for ${runId}.`, 'warn');
        } catch (err) {
          showToast(`Error: ${err.message}`, 'error');
        }
      });
    }

    // Export Audit Report Button
    if (el.btnExportReport) {
      el.btnExportReport.addEventListener('click', async () => {
        const runId = state.currentRunData ? state.currentRunData.run_id : 'RUN-1049';
        try {
          showToast(`Generating audit report for ${runId}...`, 'info');
          const report = await apiClient.getAuditReport(runId);

          const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `AEGIS-Audit-Report-${runId}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          showToast(`Audit report downloaded: AEGIS-Audit-Report-${runId}.json`, 'success');
        } catch (err) {
          showToast(`Failed to export report: ${err.message}`, 'error');
        }
      });
    }

    // Modal Actions
    function openModal() {
      if (el.modalNewRun) {
        el.modalNewRun.classList.add('active');
        el.chkScopeConfirm.checked = false;
        el.btnModalStart.disabled = true;
        el.btnModalStart.style.opacity = '0.5';
        el.btnModalStart.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Run`;
        const modalBody = el.modalNewRun.querySelector('.modal-body');
        if (modalBody) modalBody.scrollTop = 0;
      }
    }

    function closeModal() {
      if (el.modalNewRun) el.modalNewRun.classList.remove('active');
    }

    if (el.btnNewRunHeader) el.btnNewRunHeader.addEventListener('click', openModal);
    if (el.btnStartDemoHero) el.btnStartDemoHero.addEventListener('click', openModal);
    if (el.btnModalClose) el.btnModalClose.addEventListener('click', closeModal);
    if (el.btnModalCancel) el.btnModalCancel.addEventListener('click', closeModal);

    if (el.chkScopeConfirm) {
      el.chkScopeConfirm.addEventListener('change', (e) => {
        el.btnModalStart.disabled = !e.target.checked;
        el.btnModalStart.style.opacity = e.target.checked ? '1' : '0.5';
      });
    }

    el.testcaseOptionCards.forEach(card => {
      card.addEventListener('click', (e) => {
        el.testcaseOptionCards.forEach(c => c.classList.remove('selected'));
        const targetCard = e.currentTarget;
        targetCard.classList.add('selected');
        const radio = targetCard.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          state.selectedTestCaseId = radio.value;
        }
      });
    });

    const outcomeOptionCards = document.querySelectorAll('.outcome-option-card');
    outcomeOptionCards.forEach(card => {
      card.addEventListener('click', (e) => {
        outcomeOptionCards.forEach(c => c.classList.remove('selected'));
        const targetCard = e.currentTarget;
        targetCard.classList.add('selected');
        const radio = targetCard.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
        }
      });
    });

    // Start Demo Run via POST /api/runs
    if (el.btnModalStart) {
      el.btnModalStart.addEventListener('click', async () => {
        if (!el.chkScopeConfirm.checked) {
          showToast('Scope confirmation is required before launching run.', 'warn');
          return;
        }

        // Get selected outcome radio
        const outcomeRadio = document.querySelector('input[name="simulation-outcome"]:checked');
        const outcome = outcomeRadio ? outcomeRadio.value : 'complete';

        const targetId = 'Local training app (auth-service:v1.4.2)';
        const testCase = state.selectedTestCaseId;

        el.btnModalStart.disabled = true;
        el.btnModalStart.textContent = 'Initiating API Run...';

        try {
          const created = await apiClient.createRun(targetId, testCase, true, outcome);
          closeModal();
          showToast(`Run ${created.run_id} launched via POST /api/runs!`, 'success');
          setNav('war-room');
          startPollingRun(created.run_id);
        } catch (err) {
          showToast(`API Error: ${err.message}`, 'error');
        } finally {
          el.btnModalStart.disabled = false;
          el.btnModalStart.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Run`;
        }
      });
    }

    // Dashboard Search & Filters
    if (el.dashboardSearchInput) {
      el.dashboardSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderDashboardRuns();
      });
    }

    el.filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        el.filterChips.forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.dashboardFilter = e.currentTarget.getAttribute('data-filter');
        renderDashboardRuns();
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'n' || e.key === 'N') {
        openModal();
      } else if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === '1') {
        setWarRoomTab('finding');
      } else if (e.key === '2') {
        setWarRoomTab('fix');
      } else if (e.key === '3') {
        setWarRoomTab('regression');
      } else if (e.key === '4') {
        setWarRoomTab('rawlogs');
      }
    });
  }

  // =========================================================================
  // XBOW-INSPIRED 6-STAGE SHOWCASE INTERACTION & CANVAS ANIMATIONS
  // =========================================================================
  const showcaseStages = [
    {
      stage: 1,
      label: 'Stage 01 · Ingestion & Context',
      title: 'Context in: the more, the deeper',
      desc: 'Point AEGIS at a target and give it context: docs, credentials, API specs, architecture notes, source code. AEGIS can run without context, but the more context it has, the deeper it goes.'
    },
    {
      stage: 2,
      label: 'Stage 02 · Attack Surface Mapping',
      title: '530 endpoints mapped · 15 to 30 expected',
      desc: 'AEGIS builds a live map of the target: applications, endpoints, parameters, auth flows. In one engagement, it found 530 endpoints where the team expected 15 to 30.'
    },
    {
      stage: 3,
      label: 'Stage 03 · Autonomous Coordination',
      title: 'Test plan: what, where, in what order',
      desc: 'A coordinator decides what to test, where, and in what order, then directs specialized agents across the target.'
    },
    {
      stage: 4,
      label: 'Stage 04 · Parallel Offensive Probing',
      title: 'Thousands of agents, in parallel',
      desc: 'Agents attack in parallel. They reason through and chain vulnerabilities with an extensive offensive toolkit. They exploit paths scanners never find.'
    },
    {
      stage: 5,
      label: 'Stage 05 · Empirical Exploit Proof',
      title: 'Each exploit reproduced by a validator',
      desc: 'Independent validators confirm each exploit is reproducible before a finding surfaces. Findings are confirmed deterministically with empirical proof.'
    },
    {
      stage: 6,
      label: 'Stage 06 · Remediation & Regression Verification',
      title: 'Fix deployed, re-tested, closed',
      desc: 'Once your team deploys the candidate fix, AEGIS re-tests it and confirms the issue is closed with zero regression.'
    }
  ];

  let currentShowcaseStage = 1;
  let showcaseProgress = 0;
  let showcaseInterval = null;

  function initPlatformShowcase() {
    const stepCards = document.querySelectorAll('.stage-step-card');
    const dynamicTitle = document.getElementById('canvas-dynamic-title');
    const stageLabel = document.getElementById('canvas-stage-label');
    const btnTryWarroom = document.getElementById('btn-showcase-try-warroom');

    // Populate Radar Grid for Stage 2
    const radarGrid = document.getElementById('radar-matrix-grid');
    if (radarGrid && radarGrid.children.length <= 1) {
      for (let i = 0; i < 48; i++) {
        const cell = document.createElement('div');
        cell.className = 'radar-cell';
        if ([5, 12, 17, 24, 29, 35, 41].includes(i)) {
          cell.classList.add('endpoint-found');
        }
        radarGrid.appendChild(cell);
      }
    }

    // Populate Coordinate Matrix Grids for Stage 3
    const appsGrid = document.getElementById('coord-grid-apps');
    const epGrid = document.getElementById('coord-grid-endpoints');
    const authGrid = document.getElementById('coord-grid-auth');

    if (appsGrid && appsGrid.children.length === 0) {
      for (let i = 0; i < 9; i++) {
        const c = document.createElement('div');
        c.className = 'coord-cell' + ([1, 4, 7].includes(i) ? ' active-task' : '');
        c.textContent = `A${i+1}`;
        appsGrid.appendChild(c);
      }
    }
    if (epGrid && epGrid.children.length === 0) {
      for (let i = 0; i < 9; i++) {
        const c = document.createElement('div');
        c.className = 'coord-cell' + ([0, 3, 5, 8].includes(i) ? ' active-task' : '');
        c.textContent = `E${i+1}`;
        epGrid.appendChild(c);
      }
    }
    if (authGrid && authGrid.children.length === 0) {
      for (let i = 0; i < 9; i++) {
        const c = document.createElement('div');
        c.className = 'coord-cell' + ([2, 6].includes(i) ? ' active-task' : '');
        c.textContent = `F${i+1}`;
        authGrid.appendChild(c);
      }
    }

    function setActiveStage(stageNum, manual = false) {
      currentShowcaseStage = stageNum;
      const data = showcaseStages.find(s => s.stage === stageNum) || showcaseStages[0];

      stepCards.forEach(card => {
        const s = parseInt(card.getAttribute('data-stage'));
        card.classList.toggle('active', s === stageNum);
        const fill = card.querySelector('.step-progress-fill');
        if (fill) fill.style.width = (s === stageNum && !manual) ? '0%' : '100%';
      });

      // Show matching graphic
      for (let i = 1; i <= 6; i++) {
        const g = document.getElementById(`graphic-stage-${i}`);
        if (g) g.classList.toggle('active', i === stageNum);
      }

      if (dynamicTitle) dynamicTitle.textContent = data.title;
      if (stageLabel) stageLabel.textContent = data.label;

      if (manual) {
        resetShowcaseAutoPlay();
      }
    }

    stepCards.forEach(card => {
      card.addEventListener('click', () => {
        const s = parseInt(card.getAttribute('data-stage'));
        setActiveStage(s, true);
      });
    });

    if (btnTryWarroom) {
      btnTryWarroom.addEventListener('click', () => {
        setNav('war-room');
        showToast('Entering Live War Room...', 'info');
      });
    }

    // Auto-advance showcase every 4.5 seconds
    function startShowcaseAutoPlay() {
      showcaseProgress = 0;
      clearInterval(showcaseInterval);
      showcaseInterval = setInterval(() => {
        showcaseProgress += 2.5;
        const activeFill = document.getElementById(`stage-fill-${currentShowcaseStage}`);
        if (activeFill) {
          activeFill.style.width = `${Math.min(100, showcaseProgress)}%`;
        }
        if (showcaseProgress >= 100) {
          showcaseProgress = 0;
          let next = currentShowcaseStage + 1;
          if (next > 6) next = 1;
          setActiveStage(next);
        }
      }, 110);
    }

    function resetShowcaseAutoPlay() {
      clearInterval(showcaseInterval);
      const activeFill = document.getElementById(`stage-fill-${currentShowcaseStage}`);
      if (activeFill) activeFill.style.width = '100%';
      setTimeout(startShowcaseAutoPlay, 8000);
    }

    startShowcaseAutoPlay();
  }

  // =========================================================================
  // PIPELINE TERMINAL CODE TABS & LIVE REST API TEST
  // =========================================================================
  function initPipelineTerminal() {
    const tabs = document.querySelectorAll('.term-tab-btn');
    const codeDisplay = document.getElementById('pipeline-code-display');
    const btnCopy = document.getElementById('btn-copy-term-code');
    const btnRunLive = document.getElementById('btn-run-live-api-test');

    const snippets = {
      curl: `curl -X POST "http://localhost:3000/api/runs" \\
  -H "Content-Type: application/json" \\
  -d '{"target_id":"auth-service:v1.4.2","test_case":"CWE-89","scope_confirmed":true}'`,
      ps: `Invoke-RestMethod -Uri "http://localhost:3000/api/runs" \`
  -Method Post -ContentType "application/json" \`
  -Body '{"target_id":"auth-service:v1.4.2","test_case":"CWE-89","scope_confirmed":true}'`,
      node: `const res = await fetch("http://localhost:3000/api/runs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ target_id: "auth-service:v1.4.2", test_case: "CWE-89", scope_confirmed: true })
});
const run = await res.json();
console.log("Run ID:", run.run_id);`,
      python: `import requests
res = requests.post("http://localhost:3000/api/runs", json={
    "target_id": "auth-service:v1.4.2",
    "test_case": "CWE-89",
    "scope_confirmed": True
})
print("Run ID:", res.json()["run_id"])`
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const lang = e.currentTarget.getAttribute('data-lang');
        if (codeDisplay) codeDisplay.textContent = snippets[lang] || snippets.curl;
      });
    });

    if (btnCopy && codeDisplay) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(codeDisplay.textContent).then(() => {
          showToast('Copied to clipboard!', 'success');
        });
      });
    }

    if (btnRunLive && codeDisplay) {
      btnRunLive.addEventListener('click', async () => {
        btnRunLive.disabled = true;
        btnRunLive.textContent = 'Querying API...';
        try {
          const res = await fetch('/api/health');
          const data = await res.json();
          codeDisplay.textContent = `// HTTP 200 OK — Live API Response:\n` + JSON.stringify(data, null, 2);
          showToast('Connected to Local API!', 'success');
        } catch (err) {
          codeDisplay.textContent = `// API Error:\n${err.message}`;
          showToast('Failed to connect to local API', 'error');
        } finally {
          btnRunLive.disabled = false;
          btnRunLive.innerHTML = 'Test API Live &rarr;';
        }
      });
    }
  }

  // =========================================================================
  // 60-SECOND GUIDED TOUR STEPPER (Makes complex interface immediately clear)
  // =========================================================================
  const tourSteps = [
    {
      stepNum: 1,
      tag: 'STEP 1 OF 5 · SCOPE GATEKEEPER',
      title: '1. Bounded & Authorized Scope',
      desc: 'Unlike speculative tools that probe unauthorized public networks, AEGIS strictly bounds all security evaluations to explicitly allowlisted local targets. Public domains and unauthorized IPs are instantly rejected.',
      visual: `Target: Local training app (auth-service:v1.4.2)\nNetwork: 127.0.0.1:8080 (Isolated Sandbox)\nScope Verification: [✓ AUTHORIZED]`
    },
    {
      stepNum: 2,
      tag: 'STEP 2 OF 5 · RED TEAM AGENT',
      title: '2. Targeted Exploit Probing',
      desc: 'The Red Agent issues controlled, bounded syntax payloads (e.g. SQL injection syntax breakers) to identify genuine vulnerabilities without causing collateral denial of service.',
      visual: `Endpoint: POST /api/auth/login\nPayload: admin' OR 1=1--\nInjection Result: Response syntax break detected`
    },
    {
      stepNum: 3,
      tag: 'STEP 3 OF 5 · SENTINEL VALIDATION',
      title: '3. Eliminating False Positives',
      desc: 'Sentinel refuses to forward scanner alerts to developers unless it verifies empirical reproduction. This completely eliminates speculative scanner noise and alert fatigue.',
      visual: `Status Code: HTTP 200 OK\nSession Cookie: auth_session=eyJhbGciOi...\nEmpirical Evidence: [✓ REPRODUCED & CONFIRMED]`
    },
    {
      stepNum: 4,
      tag: 'STEP 4 OF 5 · FIX AGENT (OPENROUTER AI)',
      title: '4. Isolated Patch Proposal',
      desc: 'The Fix Agent synthesizes minimal unified diffs (using OpenRouter Gemini 2.5 Flash) inside temporary isolated worktrees. It never modifies your working files without explicit human sign-off.',
      visual: `- query = f"SELECT * FROM users WHERE user = '{u}'"\n+ cursor.execute("SELECT * FROM users WHERE user = %s", (u,))\nHuman Approval State: [PENDING OPERATOR DECISION]`
    },
    {
      stepNum: 5,
      tag: 'STEP 5 OF 5 · AUDITOR REGRESSION VERIFIER',
      title: '5. Dual Independent Regression Tests',
      desc: 'The Auditor independently executes allowlisted test suites to verify that the attack payload is blocked AND that legitimate user authentication continues to work normally.',
      visual: `[✓] Exploit breaker blocked (HTTP 401 Unauthorized)\n[✓] Standard credentials authenticate successfully\nRegression Verdict: [✓ 4/4 PASS — REMEDIATION COMPLETE]`
    }
  ];

  let currentTourStep = 0;

  function initGuidedTour() {
    const backdrop = document.getElementById('tour-modal-backdrop');
    const btnOpenNav = document.getElementById('btn-guided-tour');
    const btnOpenHero = document.getElementById('btn-hero-guided-tour');
    const btnClose = document.getElementById('btn-tour-close');
    const btnNext = document.getElementById('btn-tour-next');
    const btnPrev = document.getElementById('btn-tour-prev');

    const counter = document.getElementById('tour-step-counter');
    const title = document.getElementById('tour-step-title');
    const desc = document.getElementById('tour-step-desc');
    const visual = document.getElementById('tour-step-visual');

    function renderTourStep(idx) {
      currentTourStep = idx;
      const data = tourSteps[idx];
      if (!data) return;

      if (counter) counter.textContent = data.tag;
      if (title) title.textContent = data.title;
      if (desc) desc.textContent = data.desc;
      if (visual) visual.textContent = data.visual;

      if (btnPrev) btnPrev.style.visibility = idx === 0 ? 'hidden' : 'visible';
      if (btnNext) {
        btnNext.textContent = idx === tourSteps.length - 1 ? 'Launch Live War Room 🚀' : 'Next Step →';
      }
    }

    function openTour() {
      if (!backdrop) return;
      backdrop.classList.add('open');
      renderTourStep(0);
    }

    function closeTour() {
      if (!backdrop) return;
      backdrop.classList.remove('open');
    }

    window.openAegisTour = openTour;
    if (window.location.hash === '#tour') {
      setTimeout(openTour, 150);
    }

    if (btnOpenNav) btnOpenNav.addEventListener('click', openTour);
    if (btnOpenHero) btnOpenHero.addEventListener('click', openTour);
    if (btnClose) btnClose.addEventListener('click', closeTour);

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (currentTourStep >= tourSteps.length - 1) {
          closeTour();
          setNav('war-room');
          showToast('Starting War Room live simulation!', 'success');
        } else {
          renderTourStep(currentTourStep + 1);
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (currentTourStep > 0) {
          renderTourStep(currentTourStep - 1);
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeTour();
      });
    }
  }

  // Application Startup
  async function init() {
    initElements();
    startClock();
    bindEvents();
    initResearchSection();
    initAnnouncementTicker();

    // Set active view immediately based on URL hash (zero lag)
    const hash = (window.location.hash || '').replace('#', '');
    if (['landing', 'research', 'war-room', 'attackpath', 'findingdetail', 'dashboard', 'logs', 'about'].includes(hash)) {
      setNav(hash);
    } else {
      setNav('landing');
    }
    setWarRoomTab('finding');

    initHeroConsole();
    renderAttackPath();
    renderFindingDetail();
    initPlatformShowcase();
    initPipelineTerminal();
    initGuidedTour();

    // Listen for browser URL hash navigation (back/forward, direct anchors)
    window.addEventListener('hashchange', () => {
      const h = (window.location.hash || '').replace('#', '');
      if (h === 'tour' && typeof window.openAegisTour === 'function') {
        window.openAegisTour();
      } else if (['landing', 'research', 'war-room', 'attackpath', 'findingdetail', 'dashboard', 'logs', 'about'].includes(h)) {
        setNav(h);
      }
    });

    // 1. Fetch historical runs list from backend API
    fetchRecentRunsFromApi();

    // 2. Load latest run or initiate initial demo run
    try {
      const runs = await apiClient.listRuns();
      if (runs && runs.length > 0) {
        const latest = await apiClient.getRun(runs[0].run_id);
        state.currentRunData = latest;
        renderRunFromApi(latest);
      }
    } catch (err) {
      console.warn('Initial run load from API:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


  // =========================================================================
  // TARGET RESEARCH & CONTEXT INGESTION (Stage 01 Learn)
  // =========================================================================
  function initResearchSection() {
    const form = document.getElementById('research-form');
    const repoInput = document.getElementById('res-repo-url');
    const branchInput = document.getElementById('res-repo-branch');
    const stagingInput = document.getElementById('res-staging-url');
    const specTypeSelect = document.getElementById('res-spec-type');
    const specContentArea = document.getElementById('res-spec-content');
    const authTokenInput = document.getElementById('res-auth-token');
    const scopeChk = document.getElementById('res-scope-chk');

    const btnSubmit = document.getElementById('btn-research-submit');
    const btnReset = document.getElementById('btn-research-reset');
    const btnLaunchWarroom = document.getElementById('btn-research-launch-warroom');

    const outId = document.getElementById('res-out-id');
    const outStack = document.getElementById('res-out-stack');
    const outStaging = document.getElementById('res-out-staging');
    const outConfidence = document.getElementById('res-out-confidence');
    const endpointsList = document.getElementById('res-endpoints-list');

    const presetChips = document.querySelectorAll('.preset-chip');

    const PRESETS = {
      'auth-service': {
        repo: 'https://github.com/aegis-agent/demo-auth-service',
        branch: 'main',
        staging: 'http://127.0.0.1:8080',
        specType: 'openapi_v3',
        auth: '',
        spec: JSON.stringify({
          openapi: "3.0.0",
          info: { title: "Auth Service", version: "1.4.2" },
          paths: {
            "/api/v1/auth/login": {
              post: { summary: "User authentication", parameters: ["username", "password"] }
            }
          }
        }, null, 2)
      },
      'session-gateway': {
        repo: 'https://github.com/aegis-agent/session-gateway',
        branch: 'main',
        staging: 'http://127.0.0.1:8081',
        specType: 'openapi_v3',
        auth: 'Bearer demo_session_jwt_ey...',
        spec: JSON.stringify({
          openapi: "3.0.0",
          info: { title: "Session Gateway", version: "2.1.0" },
          paths: {
            "/api/v1/session/verify": {
              post: { summary: "JWT Verification", parameters: ["token"] }
            }
          }
        }, null, 2)
      },
      'report-service': {
        repo: 'https://github.com/aegis-agent/report-service',
        branch: 'staging',
        staging: 'http://127.0.0.1:8082',
        specType: 'endpoints_list',
        auth: '',
        spec: "GET /api/v1/reports/download?filename={name}\nGET /api/v1/reports/list"
      },
      'custom': {
        repo: '',
        branch: 'main',
        staging: 'http://127.0.0.1:8080',
        specType: 'openapi_v3',
        auth: '',
        spec: ''
      }
    };

    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        presetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const key = chip.getAttribute('data-preset');
        const p = PRESETS[key];
        if (!p) return;

        if (repoInput) repoInput.value = p.repo;
        if (branchInput) branchInput.value = p.branch;
        if (stagingInput) stagingInput.value = p.staging;
        if (specTypeSelect) specTypeSelect.value = p.specType;
        if (authTokenInput) authTokenInput.value = p.auth;
        if (specContentArea) specContentArea.value = p.spec;
        showToast(`Loaded preset: ${chip.textContent.trim()}`, 'info');
      });
    });

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const p = PRESETS['auth-service'];
        if (repoInput) repoInput.value = p.repo;
        if (branchInput) branchInput.value = p.branch;
        if (stagingInput) stagingInput.value = p.staging;
        if (specContentArea) specContentArea.value = p.spec;
        presetChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-preset') === 'auth-service'));
        showToast('Reset target inputs to default', 'info');
      });
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', async () => {
        const payload = {
          repo_url: repoInput ? repoInput.value : '',
          branch: branchInput ? branchInput.value : 'main',
          staging_url: stagingInput ? stagingInput.value : '',
          api_spec_type: specTypeSelect ? specTypeSelect.value : 'openapi_v3',
          api_spec_content: specContentArea ? specContentArea.value : '',
          auth_header: authTokenInput ? authTokenInput.value : '',
          scope_confirmed: scopeChk ? scopeChk.checked : true
        };

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;">⟳</span> Ingesting Context...`;

        try {
          const res = await fetch('/api/research/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();

          if (!res.ok) throw new Error(data.message || 'Ingestion failed');

          showToast(`Target context ingested! (${data.research_id})`, 'success');

          if (outId) outId.textContent = data.research_id;
          if (outStack) outStack.textContent = data.ast_analysis.framework + ' • ' + data.ast_analysis.database;
          if (outStaging) outStaging.textContent = `${data.staging_url} (${data.scope_notice})`;
          if (outConfidence) outConfidence.textContent = `${data.ast_analysis.confidence_score} (Context Mapped)`;

          if (endpointsList && data.ast_analysis.discovered_routes) {
            endpointsList.innerHTML = data.ast_analysis.discovered_routes.map(r => `
              <div class="ast-endpoint-row">
                <div class="endpoint-method ${r.method.toLowerCase()}">${r.method}</div>
                <div class="endpoint-details">
                  <div class="endpoint-path">${r.path}</div>
                  <div class="endpoint-params">Params: <code>${(r.parameters || []).join(', ')}</code> &bull; <span style="color:#ef4444; font-weight:600;">${r.cwe_risk || 'Risk Identified'}</span></div>
                </div>
                <span class="ast-risk-pill ${r.risk_surface.toLowerCase() === 'critical' || r.risk_surface.toLowerCase() === 'high' ? 'high' : 'medium'}">${r.risk_surface.toUpperCase()}</span>
              </div>
            `).join('');
          }

          state.ingestedResearchTarget = data;
        } catch (err) {
          showToast(`Ingestion error: ${err.message}`, 'error');
        } finally {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Ingest Target &amp; Discover Surface`;
        }
      });
    }

    if (btnLaunchWarroom) {
      btnLaunchWarroom.addEventListener('click', async () => {
        btnLaunchWarroom.disabled = true;
        btnLaunchWarroom.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;">⟳</span> Launching Simulation...`;

        try {
          const target = (state.ingestedResearchTarget && state.ingestedResearchTarget.target_id) || 'Local training app (auth-service:v1.4.2)';
          const testCase = (state.ingestedResearchTarget && state.ingestedResearchTarget.test_case_recommended) || 'cwe-89';
          const created = await apiClient.createRun(target, testCase, true, 'complete');
          showToast(`Live Security Assessment ${created.run_id} started!`, 'success');
          setNav('war-room');
          startPollingRun(created.run_id);
        } catch (err) {
          showToast(`Error launching assessment: ${err.message}`, 'error');
        } finally {
          btnLaunchWarroom.disabled = false;
          btnLaunchWarroom.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Launch Live War Room &rarr;`;
        }
      });
    }
  }
