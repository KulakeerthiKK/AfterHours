// AEGIS-AGENT Dynamic Multi-Agent Simulation Engine
// Drives real-time stopwatch, dynamic progress percentage, Web Audio synth cues, and inter-agent packet exchange.

class AegisWorkflowSimulator {
  constructor() {
    this.currentRun = null;
    this.currentStageIndex = 0;
    this.timerId = null;
    this.stopwatchInterval = null;
    this.elapsedMs = 0;
    this.isPaused = false;
    this.speedMultiplier = 1; // 0.5x, 1x, 2x, 8x
    this.baseStageDelay = 2200;
    this.soundEnabled = true;
    this.listeners = [];

    // Web Audio Synthesizer (Zero asset dependencies)
    this.audioCtx = null;
  }

  initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
  }

  playCue(type) {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'stage_start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'stage_complete') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'run_done') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.08);
        osc.frequency.setValueAtTime(659.25, now + 0.16);
        osc.frequency.setValueAtTime(880, now + 0.24);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      }
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.emit('sound_toggled', { soundEnabled: this.soundEnabled });
    return this.soundEnabled;
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
    const totalStages = this.currentRun ? this.currentRun.stages.length : 5;
    const progressPct = this.currentRun 
      ? Math.min(100, Math.round(((this.currentStageIndex) / totalStages) * 100))
      : 0;

    return {
      run: this.currentRun,
      stageIndex: this.currentStageIndex,
      isPaused: this.isPaused,
      speed: this.speedMultiplier,
      isRunning: Boolean(this.timerId && !this.isPaused),
      progressPct: progressPct,
      elapsedMs: this.elapsedMs,
      soundEnabled: this.soundEnabled
    };
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
    this.emit('speed_changed', { speed: multiplier });
  }

  startStopwatch() {
    this.stopStopwatch();
    const intervalMs = 100;
    this.stopwatchInterval = setInterval(() => {
      if (!this.isPaused && this.currentRun && this.currentRun.status === 'running') {
        this.elapsedMs += Math.round(intervalMs * this.speedMultiplier);
        this.emit('stopwatch_tick', { elapsedMs: this.elapsedMs });
      }
    }, intervalMs);
  }

  stopStopwatch() {
    if (this.stopwatchInterval) {
      clearInterval(this.stopwatchInterval);
      this.stopwatchInterval = null;
    }
  }

  startRun(testCaseId, options = {}) {
    this.stop();
    this.elapsedMs = 0;

    const mockCase = (window.AEGIS_MOCK && window.AEGIS_MOCK.testCases[testCaseId]) || 
                     window.AEGIS_MOCK.testCases['input-validation'];

    const newRunId = 'RUN-' + (Math.floor(Math.random() * 900) + 1100);

    const stages = mockCase.stages.map(s => ({
      ...s,
      status: 'queued',
      completedAt: null,
      stageElapsedMs: 0
    }));

    this.currentRun = {
      id: newRunId,
      testCaseId: mockCase.id,
      testName: mockCase.name,
      tag: mockCase.tag || 'CWE-89',
      targetLabel: mockCase.targetLabel,
      endpoint: mockCase.endpoint,
      service: mockCase.service,
      latencyImpact: mockCase.latencyImpact,
      cvssBreakdown: mockCase.cvssBreakdown,
      finding: JSON.parse(JSON.stringify(mockCase.finding)),
      proposedFix: JSON.parse(JSON.stringify(mockCase.proposedFix)),
      regression: JSON.parse(JSON.stringify(mockCase.regression)),
      stages: stages,
      startTime: new Date(),
      status: 'running',
      reviewStatus: 'Needs review',
      fixStatus: 'Pending',
      isReproducible: false,
      logs: [
        `[${new Date().toLocaleTimeString()}] [System] Scope verification accepted. Target: ${mockCase.targetLabel}`,
        `[${new Date().toLocaleTimeString()}] [AEGIS] Initializing multi-agent security test workflow...`
      ]
    };

    this.currentStageIndex = 0;
    this.isPaused = false;
    this.startStopwatch();

    this.playCue('stage_start');
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

    const agentName = stage.agent;
    const logMsg = `[${new Date().toLocaleTimeString()}] [${agentName}] Active: ${stage.summary}`;
    this.currentRun.logs.push(logMsg);

    this.playCue('stage_start');
    this.emit('stage_running', {
      stageIndex: this.currentStageIndex,
      stage: stage,
      log: logMsg
    });

    const delay = Math.max(180, Math.floor(this.baseStageDelay / this.speedMultiplier));

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

    this.playCue('stage_complete');
    this.emit('stage_complete', {
      stageIndex: this.currentStageIndex,
      stage: stage,
      log: activityLog
    });

    this.currentStageIndex++;
    
    const transitionDelay = Math.max(120, Math.floor(500 / this.speedMultiplier));
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
      stage.status = 'complete';
      stage.completedAt = new Date().toLocaleTimeString();
      this.currentStageIndex++;
      this.playCue('stage_complete');
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
    this.stopStopwatch();
    this.currentRun.status = 'completed';
    this.currentRun.completedAt = new Date();
    const doneLog = `[${new Date().toLocaleTimeString()}] [Auditor Agent] Workflow execution complete. All stages verified.`;
    this.currentRun.logs.push(doneLog);

    this.playCue('run_done');
    this.emit('run_completed', { run: this.currentRun });
  }

  stop() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.stopStopwatch();
    this.isPaused = false;
  }

  updateReviewState(newState) {
    if (!this.currentRun) return;
    this.currentRun.reviewStatus = newState;
    const log = `[${new Date().toLocaleTimeString()}] [User Review] Finding marked as: "${newState}" (Prototype state update)`;
    this.currentRun.logs.push(log);
    this.playCue(newState === 'Confirmed' ? 'alert' : 'stage_complete');
    this.emit('review_updated', { reviewStatus: newState, run: this.currentRun });
  }

  updateFixState(decision) {
    if (!this.currentRun) return;
    this.currentRun.fixStatus = decision;
    const log = `[${new Date().toLocaleTimeString()}] [User Action] Proposed fix ${decision.toLowerCase()} for demo run (No code modified).`;
    this.currentRun.logs.push(log);
    this.playCue(decision === 'Approved' ? 'stage_complete' : 'alert');
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

    if (this.currentRun.regression.checks && this.currentRun.regression.checks[0]) {
      this.currentRun.regression.checks[0].status = isRepro ? 'FAIL' : 'PASS';
      this.currentRun.regression.checks[0].resultText = isRepro 
        ? 'HTTP 200 OK / Vulnerability Still Reproducible' 
        : 'HTTP 400 Bad Request / Handled Safely';
      this.currentRun.regression.checks[0].reproduced = isRepro;
    }

    const log = `[${new Date().toLocaleTimeString()}] [Auditor Agent] Regression test re-run: ${isRepro ? 'VULNERABILITY REPRODUCED' : 'REMEDIATED (Not Reproducible)'}`;
    this.currentRun.logs.push(log);
    this.playCue(isRepro ? 'alert' : 'stage_complete');

    this.emit('regression_updated', { run: this.currentRun, isReproducible: isRepro });
  }

  // Live Step-by-Step Regression Test Suite Replay
  replayRegressionSuite(onProgress, onDone) {
    if (!this.currentRun || !this.currentRun.regression) return;
    const checks = this.currentRun.regression.checks;
    let idx = 0;

    // Reset check display
    checks.forEach(c => { c._running = true; });
    this.emit('regression_retest_start', { checks });

    const runNextCheck = () => {
      if (idx >= checks.length) {
        checks.forEach(c => { delete c._running; });
        this.playCue(this.currentRun.isReproducible ? 'alert' : 'stage_complete');
        if (onDone) onDone();
        this.emit('regression_retest_done', { run: this.currentRun });
        return;
      }

      const chk = checks[idx];
      chk._running = false;
      this.playCue('stage_complete');
      if (onProgress) onProgress(idx, chk);
      idx++;
      setTimeout(runNextCheck, 320);
    };

    setTimeout(runNextCheck, 200);
  }
}

if (typeof window !== 'undefined') {
  window.AegisWorkflowSimulator = AegisWorkflowSimulator;
}
