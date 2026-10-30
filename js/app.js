// AEGIS-AGENT Frontend Application Controller
// Orchestrates War Room views, modal interactions, diff rendering, and simulation telemetry.

(function () {
  'use strict';

  // Instantiate simulator
  const simulator = new window.AegisWorkflowSimulator();

  // App State
  const state = {
    activeNav: 'war-room', // 'dashboard', 'war-room', 'logs', 'about'
    activeDetailTab: 'finding', // 'finding', 'fix', 'regression', 'rawlogs'
    activeEvidenceTab: 'request', // 'request', 'response', 'logs', 'stack'
    recentRuns: [...window.AEGIS_MOCK.recentRuns],
    selectedTestCaseId: 'input-validation'
  };

  // DOM Elements Cache
  const el = {};

  function initElements() {
    // Nav elements
    el.navDashboard = document.getElementById('nav-dashboard');
    el.navWarroom = document.getElementById('nav-warroom');
    el.navLogs = document.getElementById('nav-logs');
    el.navAbout = document.getElementById('nav-about');
    el.viewDashboard = document.getElementById('view-dashboard');
    el.viewWarroom = document.getElementById('view-warroom');
    el.viewLogs = document.getElementById('view-logs');
    el.viewAbout = document.getElementById('view-about');

    // Controls
    el.btnNewRunHeader = document.getElementById('btn-new-run-header');
    el.btnStartDemoHero = document.getElementById('btn-start-demo-hero');
    el.btnPauseResume = document.getElementById('btn-pause-resume');
    el.btnResetDemo = document.getElementById('btn-reset-demo');
    el.btnStepDemo = document.getElementById('btn-step-demo');
    el.speedBtns = document.querySelectorAll('.speed-btn');

    // Top status pill
    el.simRunTag = document.getElementById('sim-run-tag');
    el.simStateBadge = document.getElementById('sim-state-badge');
    el.sysClock = document.getElementById('sys-clock');

    // Timeline container
    el.timelineStagesList = document.getElementById('timeline-stages-list');
    el.agentPillRed = document.getElementById('agent-pill-red');
    el.agentPillSentinel = document.getElementById('agent-pill-sentinel');
    el.agentPillFix = document.getElementById('agent-pill-fix');
    el.agentPillAuditor = document.getElementById('agent-pill-auditor');

    // Detail tabs
    el.detailTabBtns = document.querySelectorAll('.detail-tab-btn');
    el.paneFinding = document.getElementById('pane-finding');
    el.paneFix = document.getElementById('pane-fix');
    el.paneRegression = document.getElementById('pane-regression');
    el.paneRawLogs = document.getElementById('pane-rawlogs');

    // Finding pane elements
    el.findingTitle = document.getElementById('finding-title');
    el.findingSeverity = document.getElementById('finding-severity');
    el.findingCvss = document.getElementById('finding-cvss');
    el.findingCwe = document.getElementById('finding-cwe');
    el.findingComponent = document.getElementById('finding-component');
    el.findingCategory = document.getElementById('finding-category');
    el.findingExplanation = document.getElementById('finding-explanation');
    el.evidenceCodeViewer = document.getElementById('evidence-code-viewer');
    el.evidenceTabBtns = document.querySelectorAll('.evidence-tab-btn');
    el.reviewStateDisplay = document.getElementById('review-state-display');
    el.btnReviewConfirm = document.getElementById('btn-review-confirm');
    el.btnReviewNeedsReview = document.getElementById('btn-review-needsreview');
    el.btnReviewNotConfirmed = document.getElementById('btn-review-notconfirmed');

    // Proposed Fix pane elements
    el.fixSummaryText = document.getElementById('fix-summary-text');
    el.diffFilePath = document.getElementById('diff-file-path');
    el.diffStatsAdd = document.getElementById('diff-stats-add');
    el.diffStatsDel = document.getElementById('diff-stats-del');
    el.diffCodeBody = document.getElementById('diff-code-body');
    el.btnApproveFix = document.getElementById('btn-approve-fix');
    el.btnRejectFix = document.getElementById('btn-reject-fix');
    el.fixStatusBadge = document.getElementById('fix-status-badge');

    // Regression pane elements
    el.reproducibilityBanner = document.getElementById('reproducibility-banner');
    el.reproStatusBadge = document.getElementById('repro-status-badge');
    el.reproStatusText = document.getElementById('repro-status-text');
    el.regressionChecksList = document.getElementById('regression-checks-list');
    el.btnToggleReproducibility = document.getElementById('btn-toggle-reproducibility');

    // Logs pane elements
    el.fullLogsViewer = document.getElementById('full-logs-viewer');
    el.warroomLogsViewer = document.getElementById('warroom-logs-viewer');

    // Modal elements
    el.modalNewRun = document.getElementById('modal-new-run');
    el.btnModalClose = document.getElementById('btn-modal-close');
    el.btnModalCancel = document.getElementById('btn-modal-cancel');
    el.btnModalStart = document.getElementById('btn-modal-start');
    el.chkScopeConfirm = document.getElementById('chk-scope-confirm');
    el.testcaseOptionCards = document.querySelectorAll('.testcase-option-card');

    // Dashboard runs table
    el.runsTableBody = document.getElementById('runs-table-body');

    // Toast container
    el.toastContainer = document.getElementById('toast-container');
  }

  // Toast Notification Helper
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

  // Switch Main View
  function setNav(targetNav) {
    state.activeNav = targetNav;

    // Update Nav buttons
    [el.navDashboard, el.navWarroom, el.navLogs, el.navAbout].forEach(btn => {
      if (!btn) return;
      const isTarget = btn.getAttribute('data-nav') === targetNav;
      btn.classList.toggle('active', isTarget);
    });

    // Update View Sections
    [el.viewDashboard, el.viewWarroom, el.viewLogs, el.viewAbout].forEach(view => {
      if (!view) return;
      const isTarget = view.id === `view-${targetNav}`;
      view.classList.toggle('active', isTarget);
    });

    if (targetNav === 'dashboard') {
      renderDashboardRuns();
    }
  }

  // Switch War Room Sub-tab
  function setWarRoomTab(tabName) {
    state.activeDetailTab = tabName;

    el.detailTabBtns.forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', isTarget);
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

    // Update Agent status pills
    updateAgentPills(run);
  }

  // Update Agent Status Pills
  function updateAgentPills(run) {
    if (!run) return;

    // Reset pills
    const resetPill = (elem) => {
      if (!elem) return;
      elem.className = 'agent-activity-pill idle';
      elem.textContent = 'Idle';
    };

    resetPill(el.agentPillRed);
    resetPill(el.agentPillSentinel);
    resetPill(el.agentPillFix);
    resetPill(el.agentPillAuditor);

    // Map stages to agents
    const currentStage = run.stages[simulator.currentStageIndex];

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

  // Render Finding Details
  function renderFindingDetails() {
    const run = simulator.currentRun;
    if (!run || !run.finding) return;

    const f = run.finding;
    if (el.findingTitle) el.findingTitle.textContent = f.title;
    if (el.findingSeverity) {
      el.findingSeverity.textContent = f.severity + ' SEVERITY';
      el.findingSeverity.className = `severity-pill ${f.severity.toLowerCase()}`;
    }
    if (el.findingCvss) el.findingCvss.textContent = f.cvss;
    if (el.findingCwe) el.findingCwe.textContent = f.cwe;
    if (el.findingComponent) el.findingComponent.textContent = f.affectedComponent;
    if (el.findingCategory) el.findingCategory.textContent = f.category;
    if (el.findingExplanation) el.findingExplanation.textContent = f.shortExplanation;

    renderEvidenceCode(state.activeEvidenceTab);
    renderReviewControlsState();
  }

  // Render Evidence Code Viewer
  function renderEvidenceCode(tabType) {
    state.activeEvidenceTab = tabType;
    const run = simulator.currentRun;
    if (!run || !run.finding || !el.evidenceCodeViewer) return;

    el.evidenceTabBtns.forEach(btn => {
      const isTarget = btn.getAttribute('data-evidence') === tabType;
      btn.classList.toggle('active', isTarget);
    });

    const ev = run.finding.evidence;
    let text = '';
    if (tabType === 'request') text = ev.httpRequest;
    else if (tabType === 'response') text = ev.httpResponse;
    else if (tabType === 'logs') text = ev.rawLogs;
    else if (tabType === 'stack') text = ev.callStack;

    el.evidenceCodeViewer.textContent = text || 'No evidence captured for this category.';
  }

  // Render Prototype Review Controls State
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

  // Render Proposed Fix View & Diff
  function renderProposedFix() {
    const run = simulator.currentRun;
    if (!run || !run.proposedFix) return;

    const fix = run.proposedFix;
    if (el.fixSummaryText) el.fixSummaryText.textContent = fix.summary;
    if (el.diffFilePath) el.diffFilePath.textContent = fix.filePath;
    if (el.diffStatsAdd) el.diffStatsAdd.textContent = `+${fix.diffStats.additions}`;
    if (el.diffStatsDel) el.diffStatsDel.textContent = `-${fix.diffStats.deletions}`;

    if (el.diffCodeBody) {
      el.diffCodeBody.innerHTML = '';
      fix.diffLines.forEach(line => {
        const row = document.createElement('div');
        row.className = `diff-line ${line.type}`;

        const oldGutter = line.oldLine !== null ? line.oldLine : '';
        const newGutter = line.newLine !== null ? line.newLine : '';
        const marker = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';

        row.innerHTML = `
          <div class="diff-gutter">${oldGutter}</div>
          <div class="diff-gutter">${newGutter}</div>
          <div class="diff-marker">${marker}</div>
          <div class="diff-text">${escapeHtml(line.text)}</div>
        `;
        el.diffCodeBody.appendChild(row);
      });
    }

    // Render approval status
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
        item.className = 'check-item';
        const isPass = chk.status === 'PASS';

        item.innerHTML = `
          <div class="check-info">
            <div class="check-status-icon ${isPass ? 'pass' : 'fail'}">${isPass ? '✓' : '✕'}</div>
            <div>
              <div class="check-name">${chk.name}</div>
              <div class="check-desc">${chk.description}</div>
            </div>
          </div>
          <div>
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

  // Render Dashboard Recent Runs Table
  function renderDashboardRuns() {
    if (!el.runsTableBody) return;
    el.runsTableBody.innerHTML = '';

    state.recentRuns.forEach(runItem => {
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

    // Wire inspect buttons
    document.querySelectorAll('.btn-inspect-run').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const caseId = e.currentTarget.getAttribute('data-case');
        simulator.startRun(caseId);
        setNav('war-room');
        showToast(`Loaded inspection for run`, 'info');
      });
    });
  }

  // Update Simulation Status Bar
  function updateControlBar(stateObj) {
    const run = stateObj.run;
    if (!run) return;

    if (el.simRunTag) el.simRunTag.textContent = run.id;

    if (el.simStateBadge) {
      el.simStateBadge.className = `sim-state-badge ${run.status}`;
      el.simStateBadge.innerHTML = stateObj.isPaused 
        ? '<span>⏸</span> PAUSED' 
        : run.status === 'completed' 
          ? '<span>✓</span> COMPLETED' 
          : '<span>●</span> SIMULATING';
    }

    if (el.btnPauseResume) {
      el.btnPauseResume.innerHTML = stateObj.isPaused
        ? '<span>▶</span> Resume Demo'
        : '<span>⏸</span> Pause Demo';
    }
  }

  // Wire Event Listeners
  function bindEvents() {
    // Nav bar buttons
    el.navDashboard.addEventListener('click', () => setNav('dashboard'));
    el.navWarroom.addEventListener('click', () => setNav('war-room'));
    el.navLogs.addEventListener('click', () => setNav('logs'));
    el.navAbout.addEventListener('click', () => setNav('about'));

    // Simulation controllers
    el.btnPauseResume.addEventListener('click', () => {
      simulator.togglePause();
    });

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
      showToast(`Auditor test outcome toggled: ${status}`, 'info');
    });

    // New Run Modal Actions
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

    // Scope confirmation checkbox logic
    if (el.chkScopeConfirm) {
      el.chkScopeConfirm.addEventListener('change', (e) => {
        el.btnModalStart.disabled = !e.target.checked;
        el.btnModalStart.style.opacity = e.target.checked ? '1' : '0.5';
      });
    }

    // Test case card selection
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

    // Start Demo Run from modal
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

    // Simulator event bus subscriptions
    simulator.subscribe((eventType, data, simState) => {
      updateControlBar(simState);
      renderTimeline();
      renderFindingDetails();
      renderProposedFix();
      renderRegressionResults();
      renderLogs();

      if (eventType === 'run_completed') {
        showToast('Multi-agent workflow run completed successfully!', 'success');
        // Add to recent runs list in state
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
          duration: '11.2s',
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

    // Start initial default simulation run
    simulator.startRun('input-validation');
    setNav('war-room');
    setWarRoomTab('finding');
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

