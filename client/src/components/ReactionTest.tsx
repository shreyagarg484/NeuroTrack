import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Clock3, MousePointer2, RotateCcw, Zap } from 'lucide-react';
import TaskPurposeCard from './TaskPurposeCard';
import { apiRequest } from '../services/api';

const TRIAL_COUNT = 8;
type TestStatus = 'idle' | 'waiting' | 'ready' | 'saving' | 'complete';

export default function ReactionTest() {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [trialNumber, setTrialNumber] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [falseStart, setFalseStart] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [averageMs, setAverageMs] = useState<number | null>(null);
  const cueAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const resultsRef = useRef<number[]>([]);

  function beginTrial(number: number) {
    window.clearTimeout(timer.current);
    setTrialNumber(number);
    setFalseStart(false);
    setStatus('waiting');
    cueAt.current = 0;
    const delay = 1400 + Math.random() * 2600;
    timer.current = window.setTimeout(() => {
      cueAt.current = performance.now();
      setStatus('ready');
    }, delay);
  }

  function startTest() {
    window.clearTimeout(timer.current);
    resultsRef.current = [];
    setResults([]);
    setAverageMs(null);
    setSaveMessage('');
    setSaveError(null);
    beginTrial(1);
  }

  async function saveResults(times: number[]) {
    const average = Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
    const fastCount = times.filter((time) => time < 250).length;
    setAverageMs(average);
    setStatus('saving');
    try {
      const sorted = [...times].sort((a, b) => a - b);
      const medianRt = Math.round(sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);
      const payload = await apiRequest<unknown>('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskType: 'simple-reaction', trials: times.length, accuracy: 100, medianRt, metrics: { averageRtMs: average, fastCount }, trialResults: times.map((responseMs) => ({ trialType: 'simple', stimulus: 'visual cue', userResponse: 'clicked', correct: true, responseMs })) })
      });
      if (!payload || typeof payload !== 'object' || !('saved' in payload) || payload.saved !== true) {
        throw new Error('Results could not be verified as saved.');
      }
      setSaveMessage('Results saved to this device.');
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Results could not be saved. Check the API connection and retry later.');
    } finally {
      setStatus('complete');
    }
  }

  function handleStageClick() {
    if (status === 'waiting') {
      window.clearTimeout(timer.current);
      setFalseStart(true);
      timer.current = window.setTimeout(() => beginTrial(trialNumber), 850);
      return;
    }
    if (status !== 'ready') return;
    window.clearTimeout(timer.current);
    const elapsed = Math.max(1, Math.round(performance.now() - cueAt.current));
    const nextResults = [...resultsRef.current, elapsed];
    resultsRef.current = nextResults;
    setResults(nextResults);
    if (nextResults.length === TRIAL_COUNT) {
      void saveResults(nextResults);
      return;
    }
    setStatus('waiting');
    setTrialNumber(nextResults.length + 1);
    setFalseStart(false);
    timer.current = window.setTimeout(() => beginTrial(nextResults.length + 1), 650);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const isActive = status === 'waiting' || status === 'ready';
  const fastCount = results.filter((time) => time < 250).length;

  return <section className="reaction-test" aria-labelledby="reaction-test-title">
    <div className="reaction-intro panel">
      <div className="reaction-heading-icon"><Zap size={20} /></div>
      <div className="reaction-intro-copy">
        <span className="task-chip"><MousePointer2 size={14} /> REACTION TIME</span>
        <h2 id="reaction-test-title">Respond when the signal appears.</h2>
        <p>Wait for the panel to turn green, then click as quickly as you comfortably can. Early clicks restart that trial.</p>
      </div>
      <div className="reaction-count"><b>{TRIAL_COUNT}</b><small>TRIALS</small></div>
    </div>

    {status === 'idle' && <TaskPurposeCard task="simple-reaction"/>}
    <div className="reaction-layout">
      <div className="panel reaction-main">
        <div className="reaction-progress-head"><span>{status === 'idle' ? 'READY WHEN YOU ARE' : status === 'complete' ? 'SESSION COMPLETE' : status === 'saving' ? 'SAVING RESULTS' : `TRIAL ${trialNumber} OF ${TRIAL_COUNT}`}</span><span>{results.length} / {TRIAL_COUNT}</span></div>
        <div className="reaction-progress"><i style={{ width: `${(results.length / TRIAL_COUNT) * 100}%` }} /></div>
        <button type="button" className={`reaction-stage ${status === 'ready' ? 'cue' : ''} ${falseStart ? 'false-start' : ''}`} onClick={handleStageClick} disabled={!isActive} aria-live="polite" aria-label={status === 'ready' ? 'Green cue. Click now.' : status === 'waiting' ? 'Wait until the panel turns green.' : 'Reaction test area'}>
          {status === 'idle' && <><span className="reaction-stage-symbol"><MousePointer2 size={25} /></span><b>Start a short reaction test</b><small>A green cue will appear after a random wait.</small></>}
          {status === 'waiting' && <><span className="reaction-stage-symbol"><Clock3 size={25} /></span><b>{falseStart ? 'Too soon — wait for green' : 'Wait for the signal'}</b><small>{falseStart ? 'We’ll retry this trial.' : 'Keep your hand ready, but don’t click yet.'}</small></>}
          {status === 'ready' && <><span className="reaction-cue-dot"/><b>CLICK NOW</b><small>Respond to the green cue.</small></>}
          {(status === 'saving' || status === 'complete') && <><span className="reaction-stage-symbol"><Check size={25} /></span><b>{status === 'saving' ? 'Test complete · saving your result…' : 'Test complete'}</b><small>{results.length} valid responses collected.</small></>}
        </button>
        {status === 'idle' || status === 'complete' ? <button className="primary reaction-start" onClick={startTest}>{status === 'complete' ? <RotateCcw size={15} /> : <Zap size={15} />}{status === 'complete' ? 'Try again' : 'Start test'}<span>· about 1 minute</span></button> : <div className="reaction-instruction">{status === 'saving' ? 'Your average is calculated from all valid trials.' : 'Stay relaxed. The variable delay helps reduce anticipation.'}</div>}
        {averageMs !== null && <div className="reaction-result">
          <div><small>AVERAGE REACTION TIME</small><strong>{averageMs}<i>ms</i></strong></div>
          <div className="reaction-result-side"><span>{fastCount} under 250 ms</span><small>of {TRIAL_COUNT} valid trials</small></div>
        </div>}
        {saveMessage && <div className="reaction-save-ok"><Check size={15} />{saveMessage}</div>}
        {saveError && <div className="reaction-save-error" role="alert"><AlertCircle size={15} />{saveError}</div>}
      </div>

      <aside className="panel reaction-side">
        <div className="panel-head"><div><h2>Your trial history</h2><p>Each bar shows one response time</p></div></div>
        {results.length ? <div className="reaction-history" aria-label="Reaction times by trial">{results.map((time, index) => <div className="reaction-history-row" key={`${index}-${time}`}><span>Trial {index + 1}</span><div><i style={{ width: `${Math.min(100, (time / 1000) * 100)}%` }} /></div><b>{time} ms</b></div>)}</div> : <div className="reaction-empty"><span><Clock3 size={21} /></span><b>Your results will appear here</b><small>Complete all 8 trials to see your average.</small></div>}
        <div className="reaction-note"><Zap size={14} /><span>Browser reaction times vary by device, display, and input latency. These personal observations do not diagnose ADHD, anxiety, or cognitive disorders.</span></div>
      </aside>
    </div>
  </section>;
}
