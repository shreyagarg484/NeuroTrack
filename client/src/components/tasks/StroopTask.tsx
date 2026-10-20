import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import TaskPurposeCard from '../TaskPurposeCard';
import { apiRequest } from '../../services/api';

type ColorName = 'RED' | 'BLUE' | 'GREEN';
type Condition = 'congruent' | 'incongruent';
type StroopTrial = { word: ColorName; ink: ColorName; condition: Condition };
type StroopResult = { trialType: Condition; stimulus: string; userResponse: string; correct: boolean; responseMs: number };
type Screen = 'intro' | 'countdown' | 'practice' | 'practice-done' | 'active' | 'saving' | 'complete';
const COLORS: ColorName[] = ['RED', 'BLUE', 'GREEN'];
const INK: Record<ColorName, string> = { RED: '#ff6b79', BLUE: '#83aaff', GREEN: '#4fe0b6' };
const MAIN_TRIALS = 20;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function makeTrial(condition: Condition): StroopTrial {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)];
  const alternatives = COLORS.filter((color) => color !== word);
  const ink = condition === 'congruent' ? word : alternatives[Math.floor(Math.random() * alternatives.length)];
  return { word, ink, condition };
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return Math.round(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2);
}

export default function StroopTask() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [countdown, setCountdown] = useState(3);
  const [trialIndex, setTrialIndex] = useState(0);
  const [trial, setTrial] = useState<StroopTrial | null>(null);
  const [trialStart, setTrialStart] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [results, setResults] = useState<StroopResult[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const practiceTrials = useRef<StroopTrial[]>([]);
  const mainTrials = useRef<StroopTrial[]>([]);

  function presentPractice(index: number) {
    if (index >= practiceTrials.current.length) {
      setTrial(null);
      setScreen('practice-done');
      return;
    }
    setPracticeIndex(index);
    setTrial(practiceTrials.current[index]);
    setTrialStart(performance.now());
    setScreen('practice');
  }

  function presentMain(index: number) {
    if (index >= mainTrials.current.length) {
      setTrial(null);
      setScreen('saving');
      void saveSession(results);
      return;
    }
    setTrialIndex(index);
    setTrial(mainTrials.current[index]);
    setTrialStart(performance.now());
    setScreen('active');
  }

  function countdownTo(destination: 'practice' | 'active', value = 3) {
    setScreen('countdown');
    setCountdown(value);
    if (value <= 0) {
      if (destination === 'practice') presentPractice(0);
      else presentMain(0);
      return;
    }
    timer.current = window.setTimeout(() => countdownTo(destination, value - 1), 700);
  }

  function beginPractice() {
    practiceTrials.current = [makeTrial('congruent'), makeTrial('incongruent'), makeTrial('congruent'), makeTrial('incongruent')];
    countdownTo('practice');
  }

  function beginAssessment() {
    mainTrials.current = shuffle([...Array.from({ length: MAIN_TRIALS / 2 }, () => 'congruent' as const), ...Array.from({ length: MAIN_TRIALS / 2 }, () => 'incongruent' as const)]).map(makeTrial);
    setResults([]);
    setSaved(false);
    setSaveError(null);
    countdownTo('active');
  }

  async function saveSession(trialResults: StroopResult[]) {
    const accuracy = Math.round(trialResults.filter((result) => result.correct).length / trialResults.length * 100);
    const medianRt = median(trialResults.map((result) => result.responseMs));
    try {
      const payload: unknown = await apiRequest('/api/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ taskType: 'stroop', trials: trialResults.length, accuracy, medianRt, falseStarts: 0, trialResults }) });
      if (!payload || typeof payload !== 'object' || !('saved' in payload) || payload.saved !== true || !('id' in payload) || typeof payload.id !== 'number') throw new Error('Could not verify that this Stroop session was saved.');
      setSaved(true);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Could not save this session. Check the API connection and retry.');
    } finally {
      setScreen('complete');
    }
  }

  function respond(color: ColorName) {
    if (!trial) return;
    if (screen === 'practice') {
      presentPractice(practiceIndex + 1);
      return;
    }
    if (screen !== 'active') return;
    const result: StroopResult = { trialType: trial.condition, stimulus: `${trial.word} in ${trial.ink} ink`, userResponse: color, correct: color === trial.ink, responseMs: Math.max(0, Math.round(performance.now() - trialStart)) };
    const updated = [...results, result];
    setResults(updated);
    if (trialIndex + 1 >= MAIN_TRIALS) {
      setTrial(null);
      setScreen('saving');
      void saveSession(updated);
    } else {
      presentMain(trialIndex + 1);
    }
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const congruentMedian = median(results.filter((result) => result.trialType === 'congruent').map((result) => result.responseMs));
  const incongruentMedian = median(results.filter((result) => result.trialType === 'incongruent').map((result) => result.responseMs));
  const accuracy = results.length ? Math.round(results.filter((result) => result.correct).length / results.length * 100) : 0;
  const currentNumber = screen === 'practice' ? practiceIndex + 1 : trialIndex + 1;

  return <section className="cognitive-task stroop-task" aria-labelledby="stroop-title">
    {screen === 'intro' && <div className="panel cognitive-instructions"><span className="cognitive-task-icon"><Sparkles size={20} /></span><span className="task-chip">STROOP · INHIBIT THE WORD</span><h2 id="stroop-title">Name the ink color.</h2><p>Ignore what the word says. Select the color of the letters, even when the word and ink color disagree.</p><TaskPurposeCard task="stroop"/><div className="stroop-example"><b style={{ color: INK.BLUE }}>RED</b><span>The correct answer here is <strong>Blue</strong>.</span></div><ul><li>4 practice trials before the assessment</li><li>20 assessment trials with a balanced mix of matching and conflicting colors</li><li>Try to respond accurately at a comfortable pace</li></ul><button className="primary cognitive-primary" onClick={beginPractice}>Start practice <span>→</span></button><small className="cognitive-disclaimer"><ShieldCheck size={13} /> Personal observations only; this task does not diagnose ADHD, anxiety, or cognitive disorders.</small></div>}
    {screen === 'countdown' && <div className="panel cognitive-countdown"><span className="task-chip">{countdown > 0 ? 'GET READY' : 'BEGIN'}</span><strong>{countdown > 0 ? countdown : 'GO'}</strong><p>Keep your attention on the screen.</p></div>}
    {(screen === 'practice' || screen === 'active') && trial && <div className="panel cognitive-active">
      <div className="cognitive-progress-head"><span>{screen === 'practice' ? 'PRACTICE' : 'ASSESSMENT'}</span><span>{currentNumber} / {screen === 'practice' ? practiceTrials.current.length : MAIN_TRIALS}</span></div>
      <div className="cognitive-progress"><i style={{ width: `${(currentNumber / (screen === 'practice' ? practiceTrials.current.length : MAIN_TRIALS)) * 100}%` }} /></div>
      <div className="stroop-stimulus" aria-live="polite" style={{ color: INK[trial.ink] }}>{trial.word}</div>
      <p className="cognitive-prompt">Select the <b>ink color</b></p>
      <div className="stroop-choices">{COLORS.map((color) => <button className="stroop-choice" type="button" key={color} onClick={() => respond(color)}>{color}</button>)}</div>
      {screen === 'practice' && <small className="cognitive-practice-label">Practice responses are not saved.</small>}
    </div>}
    {screen === 'practice-done' && <div className="panel cognitive-finished"><span className="cognitive-task-icon"><Check size={20} /></span><span className="task-chip">PRACTICE COMPLETE</span><h2>Ready for the assessment?</h2><p>You’ll see 20 color-word trials. Focus on the ink, not the word.</p><button className="primary cognitive-primary" onClick={beginAssessment}>Begin 20 trials <span>→</span></button></div>}
    {(screen === 'saving' || screen === 'complete') && <div className="panel cognitive-results">
      <span className="task-chip">STROOP · SESSION SUMMARY</span><h2>{screen === 'saving' ? 'Saving your results…' : 'Assessment complete'}</h2>
      <div className="cognitive-result-stats"><div><small>ACCURACY</small><strong>{accuracy}%</strong></div><div><small>OVERALL MEDIAN</small><strong>{median(results.map((result) => result.responseMs))}<i>ms</i></strong></div><div><small>CONGRUENT MEDIAN</small><strong>{congruentMedian}<i>ms</i></strong></div><div><small>INCONGRUENT MEDIAN</small><strong>{incongruentMedian}<i>ms</i></strong></div></div>
      {screen === 'complete' && (saved ? <div className="cognitive-save-ok"><Check size={15} />Saved and verified in your local database.</div> : <div className="cognitive-save-error" role="alert"><AlertCircle size={15} />{saveError || 'The save could not be verified.'}</div>)}
      {screen === 'complete' && <button className="secondary cognitive-restart" onClick={() => { setScreen('intro'); setResults([]); setSaveError(null); setSaved(false); }}><RotateCcw size={14} /> Run another session</button>}
    </div>}
  </section>;
}
