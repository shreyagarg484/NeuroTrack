import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Circle, RotateCcw, ShieldCheck, Sparkles, Square, Star, Triangle, Zap } from 'lucide-react';
import TaskPurposeCard from '../TaskPurposeCard';

type TargetId = 'circle' | 'triangle' | 'square' | 'star';
type Screen = 'intro' | 'countdown' | 'practice' | 'practice-done' | 'active' | 'saving' | 'complete';
type TrialResult = { trialType: 'choice'; stimulus: string; userResponse: string; correct: boolean; responseMs: number };
const TARGETS: Array<{ id: TargetId; label: string; key: string }> = [
  { id: 'circle', label: 'Circle', key: 'A' },
  { id: 'triangle', label: 'Triangle', key: 'S' },
  { id: 'square', label: 'Square', key: 'K' },
  { id: 'star', label: 'Star', key: 'L' }
];
const MAIN_TRIALS = 20;

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return Math.round(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2);
}

function TargetIcon({ target, size = 28 }: { target: TargetId; size?: number }) {
  if (target === 'circle') return <Circle size={size} />;
  if (target === 'triangle') return <Triangle size={size} />;
  if (target === 'square') return <Square size={size} />;
  return <Star size={size} />;
}

export default function ChoiceReactionTask() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [countdown, setCountdown] = useState(3);
  const [trialNumber, setTrialNumber] = useState(0);
  const [target, setTarget] = useState<TargetId | null>(null);
  const [falseStart, setFalseStart] = useState(false);
  const [falseStarts, setFalseStarts] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const readyAt = useRef(0);
  const practiceSequence = useRef<TargetId[]>([]);
  const mainSequence = useRef<TargetId[]>([]);
  const currentScreen = useRef<Screen>('intro');
  const currentTrialNumber = useRef(0);
  const currentMode = useRef<'practice' | 'active'>('practice');
  const resultsRef = useRef<TrialResult[]>([]);
  const falseStartsRef = useRef(0);
  const chooseRef = useRef<(targetId: TargetId) => void>(() => undefined);

  function changeScreen(next: Screen) {
    currentScreen.current = next;
    setScreen(next);
  }

  function presentTrial(index: number, mode: 'practice' | 'active') {
    const sequence = mode === 'practice' ? practiceSequence.current : mainSequence.current;
    if (index >= sequence.length) {
      setTarget(null);
      if (mode === 'practice') changeScreen('practice-done');
      else {
        changeScreen('saving');
        void saveSession(resultsRef.current, falseStartsRef.current);
      }
      return;
    }
    currentTrialNumber.current = index + 1;
    currentMode.current = mode;
    setTrialNumber(index + 1);
    setTarget(null);
    setFalseStart(false);
    changeScreen(mode);
    const delay = 1100 + Math.random() * 2100;
    timer.current = window.setTimeout(() => {
      readyAt.current = performance.now();
      setTarget(sequence[index]);
    }, delay);
  }

  function countdownTo(mode: 'practice' | 'active', value = 3) {
    changeScreen('countdown');
    setCountdown(value);
    if (value <= 0) {
      presentTrial(0, mode);
      return;
    }
    timer.current = window.setTimeout(() => countdownTo(mode, value - 1), 700);
  }

  function beginPractice() {
    practiceSequence.current = ['circle', 'star', 'triangle', 'square'];
    countdownTo('practice');
  }

  function beginAssessment() {
    mainSequence.current = Array.from({ length: MAIN_TRIALS }, () => TARGETS[Math.floor(Math.random() * TARGETS.length)].id);
    resultsRef.current = [];
    falseStartsRef.current = 0;
    setResults([]);
    setFalseStarts(0);
    setSaved(false);
    setSaveError(null);
    countdownTo('active');
  }

  async function saveSession(trialResults: TrialResult[], prematureClicks: number) {
    const accuracy = Math.round(trialResults.filter((result) => result.correct).length / trialResults.length * 100);
    const medianRt = median(trialResults.map((result) => result.responseMs));
    try {
      const response = await fetch('/api/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ taskType: 'choice-reaction', trials: trialResults.length, accuracy, medianRt, falseStarts: prematureClicks, trialResults }) });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !payload || typeof payload !== 'object' || !('saved' in payload) || payload.saved !== true || !('id' in payload) || typeof payload.id !== 'number') {
        const reason = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string' ? payload.error : `HTTP ${response.status}`;
        throw new Error(`Could not verify that this Choice Reaction session was saved (${reason}).`);
      }
      setSaved(true);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Could not save this session. Check the API connection and retry.');
    } finally {
      changeScreen('complete');
    }
  }

  function choose(targetId: TargetId) {
    const mode = currentMode.current;
    if (currentScreen.current !== 'practice' && currentScreen.current !== 'active') return;
    if (target === null) {
      window.clearTimeout(timer.current);
      setFalseStart(true);
      if (mode === 'active') {
        falseStartsRef.current += 1;
        setFalseStarts(falseStartsRef.current);
      }
      timer.current = window.setTimeout(() => presentTrial(currentTrialNumber.current - 1, mode), 750);
      return;
    }
    window.clearTimeout(timer.current);
    const selected = TARGETS.find((item) => item.id === targetId)!;
    const correct = targetId === target;
    if (mode === 'practice') {
      presentTrial(currentTrialNumber.current, 'practice');
      return;
    }
    const expected = TARGETS.find((item) => item.id === target)!;
    const result: TrialResult = { trialType: 'choice', stimulus: expected.label, userResponse: selected.label, correct, responseMs: Math.max(0, Math.round(performance.now() - readyAt.current)) };
    const updated = [...resultsRef.current, result];
    resultsRef.current = updated;
    setResults(updated);
    presentTrial(updated.length, 'active');
  }

  chooseRef.current = choose;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      const targetForKey = TARGETS.find((item) => item.key === key);
      if (!targetForKey || (currentScreen.current !== 'practice' && currentScreen.current !== 'active')) return;
      event.preventDefault();
      chooseRef.current(targetForKey.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer.current);
    };
  }, []);

  const accuracy = results.length ? Math.round(results.filter((result) => result.correct).length / results.length * 100) : 0;
  const medianRt = median(results.map((result) => result.responseMs));
  const currentIndex = screen === 'practice' ? currentTrialNumber.current : trialNumber;

  return <section className="cognitive-task choice-task" aria-labelledby="choice-title">
    {screen === 'intro' && <div className="panel cognitive-instructions"><span className="cognitive-task-icon"><Zap size={20} /></span><span className="task-chip">CHOICE REACTION · 4 TARGETS</span><h2 id="choice-title">Choose the matching target.</h2><p>When a shape lights up, click its matching button or press its key as quickly and accurately as you can.</p><TaskPurposeCard task="choice-reaction"/><div className="choice-key-guide">{TARGETS.map((item) => <div key={item.id}><span className={`choice-mini-target ${item.id}`}><TargetIcon target={item.id} size={19} /></span><b>{item.label}</b><kbd>{item.key}</kbd></div>)}</div><ul><li>4 guided practice trials before the assessment</li><li>20 randomly ordered assessment targets</li><li>Early presses are counted as false starts and the trial is repeated</li></ul><button className="primary cognitive-primary" onClick={beginPractice}>Start practice <span>→</span></button><small className="cognitive-disclaimer"><ShieldCheck size={13} /> Browser timing is approximate. This task does not diagnose ADHD, anxiety, or cognitive disorders.</small></div>}
    {screen === 'countdown' && <div className="panel cognitive-countdown"><span className="task-chip">{countdown > 0 ? 'GET READY' : 'BEGIN'}</span><strong>{countdown > 0 ? countdown : 'GO'}</strong><p>Get ready to respond to the target.</p></div>}
    {(screen === 'practice' || screen === 'active') && <div className="panel cognitive-active">
      <div className="cognitive-progress-head"><span>{screen === 'practice' ? 'PRACTICE' : 'ASSESSMENT'}</span><span>{currentIndex} / {screen === 'practice' ? practiceSequence.current.length : MAIN_TRIALS}{screen === 'active' && falseStarts > 0 ? ` · ${falseStarts} false ${falseStarts === 1 ? 'start' : 'starts'}` : ''}</span></div>
      <div className="cognitive-progress"><i style={{ width: `${(currentIndex / (screen === 'practice' ? practiceSequence.current.length : MAIN_TRIALS)) * 100}%` }} /></div>
      <div className={`choice-target-grid${target ? ' target-lit' : ''}`} aria-live="polite">{TARGETS.map((item) => <button type="button" className={`choice-target ${item.id}${target === item.id ? ' active' : ''}`} key={item.id} onClick={() => choose(item.id)} aria-label={`${item.label}, key ${item.key}${target === item.id ? ', target' : ''}`}><TargetIcon target={item.id} /><b>{item.label}</b><kbd>{item.key}</kbd></button>)}</div>
      <p className="choice-prompt">{falseStart ? 'Too soon — this trial will repeat.' : target ? 'Match the highlighted shape.' : 'Wait for one shape to light up.'}</p>
    </div>}
    {screen === 'practice-done' && <div className="panel cognitive-finished"><span className="cognitive-task-icon"><Check size={20} /></span><span className="task-chip">PRACTICE COMPLETE</span><h2>Ready for the assessment?</h2><p>Respond to 20 targets. Click a shape or use its keyboard key.</p><button className="primary cognitive-primary" onClick={beginAssessment}>Begin 20 trials <span>→</span></button></div>}
    {(screen === 'saving' || screen === 'complete') && <div className="panel cognitive-results">
      <span className="task-chip">CHOICE REACTION · SESSION SUMMARY</span><h2>{screen === 'saving' ? 'Saving your results…' : 'Assessment complete'}</h2>
      <div className="cognitive-result-stats"><div><small>ACCURACY</small><strong>{accuracy}%</strong></div><div><small>MEDIAN RESPONSE</small><strong>{medianRt}<i>ms</i></strong></div><div><small>CORRECT HITS</small><strong>{results.filter((result) => result.correct).length}<i> / {MAIN_TRIALS}</i></strong></div><div><small>FALSE STARTS</small><strong>{falseStarts}</strong></div></div>
      {screen === 'complete' && (saved ? <div className="cognitive-save-ok"><Check size={15} />Saved and verified in your local database.</div> : <div className="cognitive-save-error" role="alert"><AlertCircle size={15} />{saveError || 'The save could not be verified.'}</div>)}
      {screen === 'complete' && <button className="secondary cognitive-restart" onClick={() => { changeScreen('intro'); setResults([]); setFalseStarts(0); setSaveError(null); setSaved(false); }}><RotateCcw size={14} /> Run another session</button>}
    </div>}
  </section>;
}
