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
    }
  };

  // Sound Synthesizer instance for audio cues
  const simulator = new window.AegisWorkflowSimulator();

  // Application State
  const state = {
    activeNav: 'war-room',
    activeDetailTab: 'finding',
    activeEvidenceTab: 'request',
    diffViewMode: 'unified', // 'unified' or 'split'
    dashboardFilter: 'all',
    searchQuery: '',
    selectedTestCaseId: 'input-validation',
    currentRunData: null,
    pollTimer: null,
    recentRuns: []
  };

  // DOM Elements Cache
  const el = {};

  function initElements() {
    // Navigation
    el.navDashboard = document.getElementById('nav-dashboard');
    el.navWarroom = document.getElementById('nav-warroom');
    el.navLogs = document.getElementById('nav-logs');
    el.navAbout = document.getElementById('nav-about');
    el.brandHomeBtn = document.getElementById('brand-home-btn');

    el.viewDashboard = document.getElementById('view-dashboard');
    el.viewWarroom = document.getElementById('view-warroom');
    el.viewLogs = document.getElementById('view-logs');
    el.viewAbout = document.getElementById('view-about');

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

    [el.navDashboard, el.navWarroom, el.navLogs, el.navAbout].forEach(btn => {
      if (!btn) return;
      btn.classList.toggle('active', btn.getAttribute('data-nav') === targetNav);
    });

    [el.viewDashboard, el.viewWarroom, el.viewLogs, el.viewAbout].forEach(view => {
      if (!view) return;
      view.classList.toggle('active', view.id === `view-${targetNav}`);
    });

    if (targetNav === 'dashboard') {
      fetchRecentRunsFromApi();
    }
  }

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
        ? `${activeStageObj.name} (${activeStageObj.agent})`
        : `Run Status: ${run.status.toUpperCase()}`;
    }

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

      item.innerHTML = `
        <div class="stage-indicator">${indicatorContent}</div>
        <div class="stage-content">
          <div class="stage-header">
            <span class="stage-name">${stage.name}</span>
            <span class="stage-agent-tag">${stage.agent}</span>
          </div>
          <div class="stage-meta">
            <span class="status-badge ${stage.status}">${stage.status.replace('_', ' ')}</span>
            ${stage.completed_at ? `<span>at ${stage.completed_at}</span>` : ''}
          </div>
          <div class="stage-desc">${stage.activity || stage.summary}</div>
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
    if (el.findingCvss) el.findingCvss.textContent = `${f.cvss} (${f.severity})`;
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

  // Wire Event Listeners
  function bindEvents() {
    // Navigation
    el.navDashboard.addEventListener('click', () => setNav('dashboard'));
    el.navWarroom.addEventListener('click', () => setNav('war-room'));
    el.navLogs.addEventListener('click', () => setNav('logs'));
    el.navAbout.addEventListener('click', () => setNav('about'));
    if (el.brandHomeBtn) el.brandHomeBtn.addEventListener('click', () => setNav('war-room'));

    // Theme Switcher Logic
    function applyTheme(theme) {
      if (theme === 'editorial') {
        document.body.classList.add('theme-editorial');
        if (el.themeBtnEditorial) el.themeBtnEditorial.classList.add('active');
        if (el.themeBtnRed) el.themeBtnRed.classList.remove('active');
      } else {
        document.body.classList.remove('theme-editorial');
        if (el.themeBtnRed) el.themeBtnRed.classList.add('active');
        if (el.themeBtnEditorial) el.themeBtnEditorial.classList.remove('active');
      }
      try {
        localStorage.setItem('aegis_theme', theme);
      } catch (e) { }
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

    const savedTheme = localStorage.getItem('aegis_theme') || 'red-black';
    applyTheme(savedTheme);

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

  // Application Startup
  async function init() {
    initElements();
    startClock();
    bindEvents();

    // 1. Fetch historical runs list from backend API
    await fetchRecentRunsFromApi();

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

    setNav('war-room');
    setWarRoomTab('finding');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
