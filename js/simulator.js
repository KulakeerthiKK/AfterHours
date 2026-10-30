// AEGIS-AGENT Workflow Simulation Engine
// Drives the 5-stage security war room progress with realistic delays and agent state management.

class AegisWorkflowSimulator {
  constructor() {
    this.currentRun = null;
    this.currentStageIndex = 0;
    this.timerId = null;
    this.isPaused = false;
    this.speedMultiplier = 1; // 1x, 2x, 0.5x, 10x (instant)
    this.baseStageDelay = 2200; // ms per stage at 1x
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(eventType, data) {
    this.listeners.forEach(fn => {
      try {
        fn(eventType, data, this.getState());
      } catch (err) {
        console.error('Simulator listener error:', err);
      }
    });
  }

  getState() {
    return {
      run: this.currentRun,
      stageIndex: this.currentStageIndex,
      isPaused: this.isPaused,
      speed: this.speedMultiplier,
      isRunning: Boolean(this.timerId && !this.isPaused)
    };
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
    this.emit('speed_changed', { speed: multiplier });
  }

  startRun(testCaseId, options = {}) {
    this.stop();

    const mockCase = (window.AEGIS_MOCK && window.AEGIS_MOCK.testCases[testCaseId]) || 
                     window.AEGIS_MOCK.testCases['input-validation'];

    const newRunId = 'RUN-' + (Math.floor(Math.random() * 900) + 1100);

    // Deep clone stages so changes don't mutate template
    const stages = mockCase.stages.map(s => ({
      ...s,
      status: 'queued',
      completedAt: null
    }));

    this.currentRun = {
      id: newRunId,
      testCaseId: mockCase.id,
      testName: mockCase.name,
      targetLabel: mockCase.targetLabel,
      endpoint: mockCase.endpoint,
      finding: JSON.parse(JSON.stringify(mockCase.finding)),
      proposedFix: JSON.parse(JSON.stringify(mockCase.proposedFix)),
      regression: JSON.parse(JSON.stringify(mockCase.regression)),
      stages: stages,
      startTime: new Date(),
      status: 'running',
      reviewStatus: 'Needs review', // Confirmed, Needs review, Not confirmed
      fixStatus: 'Pending', // Pending, Approved, Rejected
      isReproducible: false,
      logs: [
        `[${new Date().toLocaleTimeString()}] [System] Scope verification accepted. Target: ${mockCase.targetLabel}`,
        `[${new Date().toLocaleTimeString()}] [AEGIS] Initializing multi-agent security test workflow...`
      ]
    };

    this.currentStageIndex = 0;
    this.isPaused = false;

    this.emit('run_started', { run: this.currentRun });
    this.advanceStage();
  }

  advanceStage() {
    if (!this.currentRun || this.isPaused) return;

    if (this.currentStageIndex >= this.currentRun.stages.length) {
      this.completeRun();
      return;
    }

    const stage = this.currentRun.stages[this.currentStageIndex];
    stage.status = 'running';
    stage.startedAt = new Date().toLocaleTimeString();

    // Log the stage start
    const agentName = stage.agent;
    const logMsg = `[${new Date().toLocaleTimeString()}] [${agentName}] Active: ${stage.summary}`;
    this.currentRun.logs.push(logMsg);

    this.emit('stage_running', {
      stageIndex: this.currentStageIndex,
      stage: stage,
      log: logMsg
    });

    const delay = Math.max(200, Math.floor(this.baseStageDelay / this.speedMultiplier));

    this.timerId = setTimeout(() => {
      this.finishCurrentStage();
    }, delay);
  }

  finishCurrentStage() {
    if (!this.currentRun || this.isPaused) return;

    const stage = this.currentRun.stages[this.currentStageIndex];
    stage.status = 'complete';
    stage.completedAt = new Date().toLocaleTimeString();

    const activityLog = `[${new Date().toLocaleTimeString()}] [${stage.agent}] Completed: ${stage.activity}`;
    this.currentRun.logs.push(activityLog);

    this.emit('stage_complete', {
      stageIndex: this.currentStageIndex,
      stage: stage,
      log: activityLog
    });

    this.currentStageIndex++;
    
    // Slight pause before next stage for natural realism
    const transitionDelay = Math.max(150, Math.floor(600 / this.speedMultiplier));
    this.timerId = setTimeout(() => {
      this.advanceStage();
    }, transitionDelay);
  }

  pause() {
    if (!this.currentRun || this.isPaused) return;
    this.isPaused = true;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    const logMsg = `[${new Date().toLocaleTimeString()}] [System] Simulation paused by operator.`;
    this.currentRun.logs.push(logMsg);
    this.emit('run_paused', { run: this.currentRun });
  }

  resume() {
    if (!this.currentRun || !this.isPaused) return;
    this.isPaused = false;
    const logMsg = `[${new Date().toLocaleTimeString()}] [System] Simulation resumed by operator.`;
    this.currentRun.logs.push(logMsg);
    this.emit('run_resumed', { run: this.currentRun });
    this.advanceStage();
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  reset() {
    this.stop();
    if (this.currentRun) {
      this.startRun(this.currentRun.testCaseId);
    }
    this.emit('run_reset', { run: this.currentRun });
  }

  stepForward() {
    if (!this.currentRun) return;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.isPaused = true;
    
    if (this.currentStageIndex < this.currentRun.stages.length) {
      const stage = this.currentRun.stages[this.currentStageIndex];
      if (stage.status !== 'complete') {
        stage.status = 'complete';
        stage.completedAt = new Date().toLocaleTimeString();
        this.currentStageIndex++;
      }
      this.emit('stage_stepped', { stageIndex: this.currentStageIndex, run: this.currentRun });
    }

    if (this.currentStageIndex >= this.currentRun.stages.length) {
      this.completeRun();
    }
  }

  completeRun() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentRun.status = 'completed';
    this.currentRun.completedAt = new Date();
    const doneLog = `[${new Date().toLocaleTimeString()}] [Auditor Agent] Workflow execution complete. All stages verified.`;
    this.currentRun.logs.push(doneLog);

    this.emit('run_completed', { run: this.currentRun });
  }

  stop() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.isPaused = false;
  }

  updateReviewState(newState) {
    if (!this.currentRun) return;
    this.currentRun.reviewStatus = newState;
    const log = `[${new Date().toLocaleTimeString()}] [User Review] Finding marked as: "${newState}" (Prototype state update)`;
    this.currentRun.logs.push(log);
    this.emit('review_updated', { reviewStatus: newState, run: this.currentRun });
  }

  updateFixState(decision) {
    if (!this.currentRun) return;
    this.currentRun.fixStatus = decision;
    const log = `[${new Date().toLocaleTimeString()}] [User Action] Proposed fix ${decision.toLowerCase()} for demo run (No code modified).`;
    this.currentRun.logs.push(log);
    this.emit('fix_updated', { fixStatus: decision, run: this.currentRun });
  }

  toggleRegressionReproducibility() {
    if (!this.currentRun) return;
    this.currentRun.isReproducible = !this.currentRun.isReproducible;
    
    const isRepro = this.currentRun.isReproducible;
    this.currentRun.regression.isReproducible = isRepro;
    this.currentRun.regression.overallStatus = isRepro ? 'Vulnerable' : 'Remediated';
    this.currentRun.regression.reproducibilityLabel = isRepro 
      ? 'REPRODUCIBLE — Exploit Replayed' 
      : 'REMEDIATED — Not Reproducible';

    // Update primary check
    if (this.currentRun.regression.checks && this.currentRun.regression.checks[0]) {
      this.currentRun.regression.checks[0].status = isRepro ? 'FAIL' : 'PASS';
      this.currentRun.regression.checks[0].resultText = isRepro 
        ? 'HTTP 200 OK / Vulnerability Still Reproducible' 
        : 'HTTP 400 Bad Request / Handled Safely';
    }

    const log = `[${new Date().toLocaleTimeString()}] [Auditor Agent] Regression test re-run: ${isRepro ? 'VULNERABILITY REPRODUCED' : 'REMEDIATED (Not Reproducible)'}`;
    this.currentRun.logs.push(log);

    this.emit('regression_updated', { run: this.currentRun, isReproducible: isRepro });
  }
}

// Attach globally
if (typeof window !== 'undefined') {
  window.AegisWorkflowSimulator = AegisWorkflowSimulator;
}

