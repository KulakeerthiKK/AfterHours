// AEGIS-AGENT Advanced Dynamic Frontend Controller
// Coordinates real-time stopwatch, dynamic progress HUD, audio synth cues, split/unified diffs,
// interactive regression replay suite, CVSS breakdowns, and clipboard actions.

(function () {
  'use strict';

  // Simulator Instance
  const simulator = new window.AegisWorkflowSimulator();

  // Application State
  const state = {
    activeNav: 'war-room',
    activeDetailTab: 'finding',
    activeEvidenceTab: 'request',
    diffViewMode: 'unified', // 'unified' or 'split'
    dashboardFilter: 'all',
    searchQuery: '',
    recentRuns: [...window.AEGIS_MOCK.recentRuns],
    selectedTestCaseId: 'input-validation'
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
    if (type === 'success') toast.style.borderLeftColor = 'var(--agent-auditor)';
    if (type === 'warn') toast.style.borderLeftColor = 'var(--agent-sentinel)';
    if (type === 'error') toast.style.borderLeftColor = 'var(--agent-red)';

    toast.innerHTML = `<div>${message}</div>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Stopwatch Formatter (mm:ss.s)
  function formatStopwatch(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');
    return `⏱ ${mStr}:${sStr}.${tenths}s`;
  }

  // System Clock
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

  // Main View Navigation
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
      renderDashboardRuns();
    }
  }

  // War Room Sub-tab Navigation
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

  // Update Dynamic HUD & Agent Pipeline Network Graph
  function updateHUD(simState) {
    const run = simState.run;
    if (!run) return;

    if (el.simRunTag) el.simRunTag.textContent = run.id;
    if (el.activeTargetLabel) el.activeTargetLabel.textContent = run.targetLabel;
    if (el.simStopwatch) el.simStopwatch.textContent = formatStopwatch(simState.elapsedMs);

    // Progress Bar Fill
    const pct = simState.progressPct;
    if (el.progressBarFill) el.progressBarFill.style.width = pct + '%';
    if (el.simProgressPct) el.simProgressPct.textContent = `${pct}% Complete`;

    // State Badge
    if (el.simStateBadge) {
      el.simStateBadge.className = `sim-state-badge ${run.status}`;
      el.simStateBadge.innerHTML = simState.isPaused 
        ? '<span>⏸</span> PAUSED' 
        : run.status === 'completed' 
          ? '<span>✓</span> COMPLETED' 
          : '<span>●</span> SIMULATING';
    }

    if (el.btnPauseResume) {
      el.btnPauseResume.innerHTML = simState.isPaused
        ? '<span>▶</span> Resume Demo'
        : '<span>⏸</span> Pause Demo';
    }

    // Update Multi-Agent Graph Network Nodes
    const stageIdx = simulator.currentStageIndex;
    const nodes = [el.netNodeSystem, el.netNodeRed, el.netNodeSentinel, el.netNodeFix, el.netNodeAuditor];

    nodes.forEach((node, i) => {
      if (!node) return;
      const isCurrent = (i === stageIdx && run.status === 'running');
      const isDone = (i < stageIdx || run.status === 'completed');
      node.classList.toggle('active-node', isCurrent || isDone);
    });

    if (el.netArrows) {
      el.netArrows.forEach((arr, i) => {
        if (!arr) return;
        arr.classList.toggle('flow-active', i === stageIdx - 1);
      });
    }

    if (el.netActiveStepLabel) {
      const stage = run.stages[Math.min(stageIdx, run.stages.length - 1)];
      el.netActiveStepLabel.textContent = stage ? `${stage.name} (${stage.agent})` : 'Workflow Completed';
    }

    if (el.netLatencyTag && run.latencyImpact) {
      el.netLatencyTag.textContent = `Latency: ${run.latencyImpact}`;
    }
  }

  // Render 5 Stages Timeline
  function renderTimeline() {
    const run = simulator.currentRun;
    if (!run || !el.timelineStagesList) return;

    el.timelineStagesList.innerHTML = '';

    run.stages.forEach((stage, idx) => {
      const item = document.createElement('div');
      item.className = `stage-item ${stage.status}`;

      let indicatorContent = idx + 1;
      if (stage.status === 'complete') {
        indicatorContent = '✓';
      } else if (stage.status === 'running') {
        indicatorContent = '●';
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
            <span class="status-badge ${stage.status}">${stage.status}</span>
            ${stage.completedAt ? `<span>at ${stage.completedAt}</span>` : ''}
          </div>
          <div class="stage-desc">${stage.activity || stage.summary}</div>
        </div>
      `;
      el.timelineStagesList.appendChild(item);
    });

    updateAgentPills(run);
  }

  // Update Agent Status Pills
  function updateAgentPills(run) {
    if (!run) return;

    const resetPill = (elem) => {
      if (!elem) return;
      elem.className = 'agent-activity-pill idle';
      elem.textContent = 'Idle';
    };

    resetPill(el.agentPillRed);
    resetPill(el.agentPillSentinel);
    resetPill(el.agentPillFix);
    resetPill(el.agentPillAuditor);

    run.stages.forEach((stage) => {
      let pillElem = null;
      if (stage.agent.includes('Red Agent')) pillElem = el.agentPillRed;
      else if (stage.agent.includes('Sentinel Agent')) pillElem = el.agentPillSentinel;
      else if (stage.agent.includes('Fix Agent')) pillElem = el.agentPillFix;
      else if (stage.agent.includes('Auditor Agent')) pillElem = el.agentPillAuditor;

      if (!pillElem) return;

      if (stage.status === 'running') {
        pillElem.className = 'agent-activity-pill active';
        pillElem.textContent = 'Active';
      } else if (stage.status === 'complete') {
        pillElem.className = 'agent-activity-pill done';
        pillElem.textContent = 'Complete';
      }
    });
  }

  // Render Finding Details with CVSS Breakdown
  function renderFindingDetails() {
    const run = simulator.currentRun;
    if (!run || !run.finding) return;

    const f = run.finding;
    if (el.findingTitle) el.findingTitle.textContent = f.title;
    if (el.findingSeverity) {
      el.findingSeverity.textContent = f.severity + ' SEVERITY';
      el.findingSeverity.className = `severity-pill ${f.severity.toLowerCase()}`;
    }
    if (el.findingCvss) el.findingCvss.textContent = `${f.cvss} (${f.severity})`;
    if (el.findingCwe) el.findingCwe.textContent = f.cwe;
    if (el.findingComponent) el.findingComponent.textContent = f.affectedComponent;
    if (el.findingCategory) el.findingCategory.textContent = f.category;
    if (el.findingExplanation) el.findingExplanation.textContent = f.shortExplanation;

    // Render CVSS Vector Chips
    if (el.cvssVectorGrid && run.cvssBreakdown) {
      const b = run.cvssBreakdown;
      el.cvssVectorGrid.innerHTML = `
        <div class="cvss-chip"><strong>AV:</strong> ${b.av}</div>
        <div class="cvss-chip"><strong>AC:</strong> ${b.ac}</div>
        <div class="cvss-chip"><strong>PR:</strong> ${b.pr}</div>
        <div class="cvss-chip"><strong>UI:</strong> ${b.ui}</div>
        <div class="cvss-chip"><strong>Scope:</strong> ${b.scope}</div>
        <div class="cvss-chip"><strong>Conf:</strong> ${b.conf}</div>
        <div class="cvss-chip"><strong>Integ:</strong> ${b.integ}</div>
      `;
    }

    renderEvidenceCode(state.activeEvidenceTab);
    renderReviewControlsState();
  }

  // Render Evidence Subtab
  function renderEvidenceCode(tabType) {
    state.activeEvidenceTab = tabType;
    const run = simulator.currentRun;
    if (!run || !run.finding || !el.evidenceCodeViewer) return;

    el.evidenceTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-evidence') === tabType);
    });

    const ev = run.finding.evidence;
    let text = '';
    if (tabType === 'request') text = ev.httpRequest;
    else if (tabType === 'response') text = ev.httpResponse;
    else if (tabType === 'hex') text = ev.hexView || 'Hex view not available.';
    else if (tabType === 'logs') text = ev.rawLogs;
    else if (tabType === 'stack') text = ev.callStack;

    el.evidenceCodeViewer.textContent = text || 'No evidence captured for this category.';
  }

  // Render Prototype Review State
  function renderReviewControlsState() {
    const run = simulator.currentRun;
    if (!run) return;

    const status = run.reviewStatus || 'Needs review';
    if (el.reviewStateDisplay) {
      el.reviewStateDisplay.textContent = status.toUpperCase();
      el.reviewStateDisplay.style.background = 
        status === 'Confirmed' ? 'var(--agent-red-bg)' :
        status === 'Needs review' ? 'var(--agent-sentinel-bg)' : 'rgba(100,116,139,0.2)';
      el.reviewStateDisplay.style.color =
        status === 'Confirmed' ? '#f87171' :
        status === 'Needs review' ? '#fbbf24' : '#cbd5e1';
      el.reviewStateDisplay.style.border = '1px solid ' + (
        status === 'Confirmed' ? 'rgba(239,68,68,0.4)' :
        status === 'Needs review' ? 'rgba(245,158,11,0.4)' : 'rgba(100,116,139,0.4)');
    }

    [
      { btn: el.btnReviewConfirm, name: 'Confirmed' },
      { btn: el.btnReviewNeedsReview, name: 'Needs review' },
      { btn: el.btnReviewNotConfirmed, name: 'Not confirmed' }
    ].forEach(({ btn, name }) => {
      if (btn) btn.classList.toggle('active', status === name);
    });
  }

  // Render Proposed Fix View (Unified and Split)
  function renderProposedFix() {
    const run = simulator.currentRun;
    if (!run || !run.proposedFix) return;

    const fix = run.proposedFix;
    if (el.fixSummaryText) el.fixSummaryText.textContent = fix.summary;
    if (el.diffFilePath) el.diffFilePath.textContent = fix.filePath;
    if (el.diffStatsAdd) el.diffStatsAdd.textContent = `+${fix.diffStats.additions}`;
    if (el.diffStatsDel) el.diffStatsDel.textContent = `-${fix.diffStats.deletions}`;

    if (!el.diffCodeBody) return;
    el.diffCodeBody.innerHTML = '';

    if (state.diffViewMode === 'unified') {
      // Unified Diff View
      fix.diffLines.forEach(line => {
        const row = document.createElement('div');
        row.className = `diff-line ${line.type}`;

        const oldGutter = line.oldLine !== null ? line.oldLine : '';
        const newGutter = line.newLine !== null ? line.newLine : '';
        const marker = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
        const commentBadge = line.comment 
          ? `<span class="diff-comment-callout">💡 ${escapeHtml(line.comment)}</span>` 
          : '';

        row.innerHTML = `
          <div class="diff-gutter">${oldGutter}</div>
          <div class="diff-gutter">${newGutter}</div>
          <div class="diff-marker">${marker}</div>
          <div class="diff-text">${escapeHtml(line.text)}${commentBadge}</div>
        `;
        el.diffCodeBody.appendChild(row);
      });
    } else {
      // Side-by-Side Split Diff View
      const oldLines = fix.diffLines.filter(l => l.type === 'context' || l.type === 'deletion');
      const newLines = fix.diffLines.filter(l => l.type === 'context' || l.type === 'addition');
      const maxRows = Math.max(oldLines.length, newLines.length);

      for (let i = 0; i < maxRows; i++) {
        const oL = oldLines[i];
        const nL = newLines[i];
        const row = document.createElement('div');
        row.className = 'split-diff-row';

        const leftHtml = oL ? `
          <div class="split-diff-half ${oL.type === 'deletion' ? 'del' : ''}">
            <div class="diff-gutter">${oL.oldLine || ''}</div>
            <div class="diff-text">${escapeHtml(oL.text)}</div>
          </div>` : '<div class="split-diff-half"></div>';

        const rightHtml = nL ? `
          <div class="split-diff-half ${nL.type === 'addition' ? 'add' : ''}">
            <div class="diff-gutter">${nL.newLine || ''}</div>
            <div class="diff-text">${escapeHtml(nL.text)}</div>
          </div>` : '<div class="split-diff-half"></div>';

        row.innerHTML = leftHtml + rightHtml;
        el.diffCodeBody.appendChild(row);
      }
    }

    if (el.fixStatusBadge) {
      const fixStatus = run.fixStatus || 'Pending';
      el.fixStatusBadge.textContent = `Status: ${fixStatus}`;
      el.fixStatusBadge.className = `status-badge ${
        fixStatus === 'Approved' ? 'completed' : fixStatus === 'Rejected' ? 'failed' : 'review'
      }`;
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

  // Render Regression Result View
  function renderRegressionResults() {
    const run = simulator.currentRun;
    if (!run || !run.regression) return;

    const reg = run.regression;
    const isRepro = reg.isReproducible;

    if (el.reproducibilityBanner) {
      el.reproducibilityBanner.className = `reproducibility-banner ${isRepro ? 'vulnerable' : 'remediated'}`;
    }

    if (el.reproStatusBadge) {
      el.reproStatusBadge.innerHTML = isRepro 
        ? `<span>⚠️</span> ${reg.reproducibilityLabel}` 
        : `<span>🛡️</span> ${reg.reproducibilityLabel}`;
    }

    if (el.reproStatusText) {
      el.reproStatusText.textContent = isRepro
        ? 'Alert: The exploit pattern was successfully re-executed. Remediation patch failed regression check.'
        : 'All 4 verification checks passed. Original vulnerability is remediated and no longer reproducible.';
    }

    if (el.regressionChecksList) {
      el.regressionChecksList.innerHTML = '';
      reg.checks.forEach(chk => {
        const item = document.createElement('div');
        const isRunning = Boolean(chk._running);
        item.className = `check-item ${isRunning ? 'retesting' : ''}`;
        const isPass = chk.status === 'PASS';

        item.innerHTML = `
          <div class="check-info">
            <div class="check-status-icon ${isRunning ? 'spinner' : isPass ? 'pass' : 'fail'}">
              ${isRunning ? '⟳' : isPass ? '✓' : '✕'}
            </div>
            <div>
              <div class="check-name">${chk.name}</div>
              <div class="check-desc">${chk.description}</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">${chk.duration || ''}</span>
            <span class="check-result-badge ${isPass ? 'pass' : 'fail'}">${chk.resultText}</span>
          </div>
        `;
        el.regressionChecksList.appendChild(item);
      });
    }
  }

  // Render Full Telemetry Logs
  function renderLogs() {
    const run = simulator.currentRun;
    if (!run) return;

    const logsText = run.logs.join('\n');
    if (el.fullLogsViewer) el.fullLogsViewer.textContent = logsText;
    if (el.warroomLogsViewer) {
      el.warroomLogsViewer.textContent = logsText;
      el.warroomLogsViewer.scrollTop = el.warroomLogsViewer.scrollHeight;
    }
  }

  // Render Dashboard Table with Search & Filter
  function renderDashboardRuns() {
    if (!el.runsTableBody) return;
    el.runsTableBody.innerHTML = '';

    const query = state.searchQuery.toLowerCase().trim();
    const filter = state.dashboardFilter;

    const filtered = state.recentRuns.filter(r => {
      const matchSearch = !query || 
        r.id.toLowerCase().includes(query) ||
        r.targetLabel.toLowerCase().includes(query) ||
        r.testName.toLowerCase().includes(query);

      let matchFilter = true;
      if (filter === 'High') matchFilter = r.severity === 'High';
      else if (filter === 'Medium') matchFilter = r.severity === 'Medium';
      else if (filter === 'remediated') matchFilter = r.remediated === true;

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
      row.innerHTML = `
        <td><strong style="color:var(--accent-cyan); font-family:var(--font-mono);">${runItem.id}</strong></td>
        <td>${runItem.targetLabel}</td>
        <td>${runItem.testName}</td>
        <td>
          <span class="severity-pill ${runItem.severity.toLowerCase()}" style="font-size:10px;">
            ${runItem.findingsCount} ${runItem.severity}
          </span>
        </td>
        <td>
          <span class="status-badge ${runItem.remediated ? 'completed' : 'review'}">
            ${runItem.status}
          </span>
        </td>
        <td style="color:var(--text-muted); font-size:12px;">${runItem.timestamp}</td>
        <td>
          <button class="btn-ctrl btn-inspect-run" data-run-id="${runItem.id}" data-case="${runItem.testCaseId}" style="padding:4px 8px; font-size:11px;">
            Inspect Run
          </button>
        </td>
      `;
      el.runsTableBody.appendChild(row);
    });

    document.querySelectorAll('.btn-inspect-run').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const caseId = e.currentTarget.getAttribute('data-case');
        simulator.startRun(caseId);
        setNav('war-room');
        showToast(`Loaded scenario inspection for run`, 'info');
      });
    });
  }

  // Export Audit Report (JSON)
  function exportAuditReport() {
    const run = simulator.currentRun;
    if (!run) return;

    const reportObj = {
      project: 'AEGIS-AGENT Security War Room',
      version: '1.0-prototype',
      generatedAt: new Date().toISOString(),
      runId: run.id,
      target: run.targetLabel,
      testCase: run.testName,
      status: run.status,
      stages: run.stages,
      finding: run.finding,
      proposedFix: {
        summary: run.proposedFix.summary,
        filePath: run.proposedFix.filePath,
        status: run.fixStatus
      },
      regressionAudit: {
        reproducibility: run.regression.reproducibilityLabel,
        checks: run.regression.checks
      },
      disclaimer: 'Front-end demo prototype. Bounded strictly to authorized local testing.'
    };

    const blob = new Blob([JSON.stringify(reportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AEGIS_Audit_${run.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Audit report manifest exported successfully!', 'success');
  }

  // Wire Event Listeners
  function bindEvents() {
    // Nav bar buttons
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
      } catch (e) {}
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

    // Initialize Default Theme: Red & Black
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

    // Simulation controllers
    el.btnPauseResume.addEventListener('click', () => simulator.togglePause());

    el.btnResetDemo.addEventListener('click', () => {
      simulator.reset();
      showToast('Simulation reset to beginning', 'info');
    });

    el.btnStepDemo.addEventListener('click', () => {
      simulator.stepForward();
      showToast('Stepped to next stage', 'info');
    });

    // Speed buttons
    el.speedBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        el.speedBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const speed = parseFloat(e.currentTarget.getAttribute('data-speed'));
        simulator.setSpeed(speed);
        showToast(`Simulation speed set to ${speed}x`, 'info');
      });
    });

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
        renderEvidenceCode(evType);
      });
    });

    // Copy Buttons
    if (el.btnCopyCurl) {
      el.btnCopyCurl.addEventListener('click', () => {
        const run = simulator.currentRun;
        if (run && run.finding && run.finding.exploitCommand) {
          navigator.clipboard.writeText(run.finding.exploitCommand);
          showToast('cURL replay command copied to clipboard!', 'success');
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
        renderProposedFix();
      });
    }

    if (el.diffModeSplit) {
      el.diffModeSplit.addEventListener('click', () => {
        state.diffViewMode = 'split';
        el.diffModeSplit.classList.add('active');
        el.diffModeUnified.classList.remove('active');
        renderProposedFix();
      });
    }

    // Finding review buttons
    el.btnReviewConfirm.addEventListener('click', () => {
      simulator.updateReviewState('Confirmed');
      renderReviewControlsState();
      showToast('Finding marked as Confirmed (Prototype UI update)', 'warn');
    });

    el.btnReviewNeedsReview.addEventListener('click', () => {
      simulator.updateReviewState('Needs review');
      renderReviewControlsState();
      showToast('Finding marked as Needs Review (Prototype UI update)', 'info');
    });

    el.btnReviewNotConfirmed.addEventListener('click', () => {
      simulator.updateReviewState('Not confirmed');
      renderReviewControlsState();
      showToast('Finding marked as Not Confirmed (Prototype UI update)', 'info');
    });

    // Proposed fix approval buttons
    el.btnApproveFix.addEventListener('click', () => {
      simulator.updateFixState('Approved');
      renderProposedFix();
      showToast('Fix approved for demo. (No code was actually changed)', 'success');
    });

    el.btnRejectFix.addEventListener('click', () => {
      simulator.updateFixState('Rejected');
      renderProposedFix();
      showToast('Fix rejected for demo. (No code was actually changed)', 'warn');
    });

    // Toggle regression reproducibility
    el.btnToggleReproducibility.addEventListener('click', () => {
      simulator.toggleRegressionReproducibility();
      renderRegressionResults();
      const status = simulator.currentRun.isReproducible ? 'VULNERABLE (Reproduced)' : 'REMEDIATED';
      showToast(`Auditor outcome toggled: ${status}`, 'info');
    });

    // Live Step-by-Step Regression Retest
    if (el.btnRetestSuite) {
      el.btnRetestSuite.addEventListener('click', () => {
        el.btnRetestSuite.disabled = true;
        showToast('Auditor Agent replaying regression test suite...', 'info');
        simulator.replayRegressionSuite(
          (idx, chk) => {
            renderRegressionResults();
          },
          () => {
            el.btnRetestSuite.disabled = false;
            renderRegressionResults();
            showToast('Regression suite verification completed!', 'success');
          }
        );
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

    // Export Audit Report
    if (el.btnExportReport) {
      el.btnExportReport.addEventListener('click', exportAuditReport);
    }

    // Modal Events
    function openModal() {
      if (el.modalNewRun) {
        el.modalNewRun.classList.add('active');
        el.chkScopeConfirm.checked = false;
        el.btnModalStart.disabled = true;
        el.btnModalStart.style.opacity = '0.5';
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
          const selectedCase = window.AEGIS_MOCK.testCases[radio.value];
          if (selectedCase && el.modalTargetLabel) {
            el.modalTargetLabel.textContent = selectedCase.targetLabel;
          }
        }
      });
    });

    if (el.btnModalStart) {
      el.btnModalStart.addEventListener('click', () => {
        if (!el.chkScopeConfirm.checked) return;
        closeModal();
        simulator.startRun(state.selectedTestCaseId);
        setNav('war-room');
        showToast('Authorized local demo run initiated!', 'success');
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        simulator.togglePause();
      } else if (e.key === 'r' || e.key === 'R') {
        simulator.reset();
        showToast('Demo reset (Key: R)', 'info');
      } else if (e.key === 'n' || e.key === 'N') {
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

    // Simulator Bus Subscriptions
    simulator.subscribe((eventType, data, simState) => {
      updateHUD(simState);
      renderTimeline();
      renderFindingDetails();
      renderProposedFix();
      renderRegressionResults();
      renderLogs();

      if (eventType === 'stopwatch_tick') {
        if (el.simStopwatch) el.simStopwatch.textContent = formatStopwatch(simState.elapsedMs);
      }

      if (eventType === 'run_completed') {
        showToast('Multi-agent workflow run completed successfully!', 'success');
        const r = simState.run;
        state.recentRuns.unshift({
          id: r.id,
          testCaseId: r.testCaseId,
          testName: r.testName,
          targetLabel: r.targetLabel,
          findingsCount: 1,
          severity: r.finding.severity === 'HIGH' ? 'High' : 'Medium',
          status: 'Completed',
          remediated: !r.isReproducible,
          duration: `${(simState.elapsedMs / 1000).toFixed(1)}s`,
          timestamp: 'Just now'
        });
        renderDashboardRuns();
      }
    });
  }

  // Application Startup
  function init() {
    initElements();
    startClock();
    bindEvents();
    renderDashboardRuns();

    // Launch default initial run
    simulator.startRun('input-validation');
    setNav('war-room');
    setWarRoomTab('finding');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
