import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, RotateCcw, ShieldCheck } from 'lucide-react';
import TaskPurposeCard from '../TaskPurposeCard';
import { apiRequest } from '../../services/api';

export type SuiteTaskId = 'go-no-go' | 'digit-span' | 'corsi-spatial' | 'visual-search' | 'time-perception' | 'trail-making';
const taskInfo: Record<SuiteTaskId, { title: string; description: string; duration: string }> = {
  'go-no-go': { title: 'Go / No-Go', description: 'Respond to green Go signals and hold back for No-Go signals.', duration: '2 min' },
  'digit-span': { title: 'Digit Span', description: 'Recall number sequences forward or backward as their length increases.', duration: '3 min' },
  'corsi-spatial': { title: 'Corsi Spatial', description: 'Watch a sequence of blocks, then repeat the same path.', duration: '3 min' },
  'visual-search': { title: 'Visual Search', description: 'Find the target symbol in a field of similar shapes.', duration: '2 min' },
  'time-perception': { title: 'Time Perception', description: 'Estimate a 10-second interval without a clock.', duration: '1 min' },
  'trail-making': { title: 'Trail Making', description: 'Connect numbered targets in ascending order as quickly as you can.', duration: '1 min' }
};
type Result = { trialType: string; stimulus: string; userResponse: string; correct: boolean; responseMs: number | null };
const median = (values: number[]) => { const a = [...values].sort((x, y) => x - y); return a.length ? Math.round(a.length % 2 ? a[Math.floor(a.length / 2)] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2) : 0; };

export default function LabSuiteTask({ task, onBack }: { task: SuiteTaskId; onBack: () => void }) {
  const info = taskInfo[task];
  const [started, setStarted] = useState(false), [done, setDone] = useState(false), [saving, setSaving] = useState(false), [saved, setSaved] = useState(false), [backwardMode, setBackwardMode] = useState(false), [error, setError] = useState('');
  const [results, setResults] = useState<Result[]>([]), [trial, setTrial] = useState(0), [target, setTarget] = useState(''), [input, setInput] = useState(''), [wrong, setWrong] = useState(0), [sequence, setSequence] = useState<number[]>([]), [shown, setShown] = useState(-1), [selected, setSelected] = useState<number[]>([]), [grid, setGrid] = useState<string[]>([]), [goSignal, setGoSignal] = useState(false);
  const startAt = useRef(0), pressAt = useRef(0), timer = useRef<number | undefined>(undefined), resultsRef = useRef<Result[]>([]), modeRef = useRef(0), spanRef = useRef(3), maxSpan = useRef(2), corsiMax = useRef(2), errorsRef = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const addResult = (result: Result) => { resultsRef.current = [...resultsRef.current, result]; setResults(resultsRef.current); };
  const finish = async (finalResults = resultsRef.current, metrics: Record<string, number | boolean | string> = {}) => {
    setDone(true); setSaving(true); setError('');
    const values = finalResults.flatMap((item) => item.responseMs === null ? [] : [item.responseMs]);
    const accuracy = finalResults.length ? Math.round(finalResults.filter((item) => item.correct).length / finalResults.length * 100) : 0;
    try {
      const body: unknown = await apiRequest('/api/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ taskType: task, trials: finalResults.length, accuracy, medianRt: median(values), metrics, trialResults: finalResults }) });
      if (!body || typeof body !== 'object' || !('saved' in body) || body.saved !== true) throw new Error('The API did not confirm that the session was saved.');
      setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this session.'); }
    finally { setSaving(false); }
  };
  const begin = () => {
    setStarted(true); setDone(false); setSaved(false); setError(''); setResults([]); resultsRef.current = []; setTrial(0); setWrong(0); errorsRef.current = 0; setInput('');
    if (task === 'go-no-go') { modeRef.current = 0; showGoTrial(0); }
    if (task === 'digit-span') { spanRef.current = 3; setTarget(backwardMode ? 'Backward' : 'Forward'); showDigits(3, backwardMode); }
    if (task === 'corsi-spatial') { corsiMax.current = 2; showCorsi(2); }
    if (task === 'visual-search') showSearch(0);
    if (task === 'time-perception') setTarget('Press and hold to start, release when you think 10 seconds have passed.');
    if (task === 'trail-making') { startAt.current = performance.now(); setTarget('Connect 1 through 9 in order.'); }
  };
  const complete = (metrics: Record<string, number | boolean | string>) => void finish(resultsRef.current, metrics);
  const showGoTrial = (index: number) => {
    if (index >= 24) { setTrial(24); complete({ correctResponses: resultsRef.current.filter((r) => r.trialType === 'go' && r.correct).length, omissions: resultsRef.current.filter((r) => r.trialType === 'go' && !r.correct).length, commissionErrors: resultsRef.current.filter((r) => r.trialType === 'no-go' && !r.correct).length }); return; }
    setTrial(index + 1); const go = Math.random() < 0.72; setGoSignal(go); setTarget(go ? 'GO' : 'NO-GO'); startAt.current = performance.now();
    timer.current = window.setTimeout(() => { if (go) addResult({ trialType: 'go', stimulus: 'GO', userResponse: 'no response', correct: false, responseMs: null }); else addResult({ trialType: 'no-go', stimulus: 'NO-GO', userResponse: 'withheld', correct: true, responseMs: null }); showGoTrial(index + 1); }, 1000);
  };
  const answerGo = () => { if (!started || done || task !== 'go-no-go') return; window.clearTimeout(timer.current); if (goSignal) addResult({ trialType: 'go', stimulus: 'GO', userResponse: 'pressed', correct: true, responseMs: Math.round(performance.now() - startAt.current) }); else { errorsRef.current += 1; setWrong(errorsRef.current); addResult({ trialType: 'no-go', stimulus: 'NO-GO', userResponse: 'pressed', correct: false, responseMs: Math.round(performance.now() - startAt.current) }); } showGoTrial(trial); };
  const showDigits = (length: number, backward: boolean) => { const nums = Array.from({ length }, () => Math.floor(Math.random() * 10)); setSequence(nums); setTarget(nums.join('   ')); setInput(''); startAt.current = performance.now(); timer.current = window.setTimeout(() => { setTarget('Enter the digits in ' + (backward ? 'reverse' : 'the same') + ' order.'); startAt.current = performance.now(); }, 900 + length * 650); modeRef.current = backward ? 1 : 0; };
  const submitDigits = () => { const expected = modeRef.current ? [...sequence].reverse().join('') : sequence.join(''); const response = input.replace(/\D/g, ''); const correct = expected === response; addResult({ trialType: modeRef.current ? 'backward' : 'forward', stimulus: sequence.join(''), userResponse: response, correct, responseMs: Math.round(performance.now() - startAt.current) }); setInput(''); const nextLength = correct ? spanRef.current + 1 : spanRef.current; if (correct) { spanRef.current = nextLength; maxSpan.current = Math.max(maxSpan.current, nextLength - 1); } setTrial((n) => n + 1); if (trial >= 5 || !correct) complete({ longestSpan: maxSpan.current, direction: modeRef.current ? 'backward' : 'forward' }); else showDigits(nextLength, modeRef.current === 1); };
  const showCorsi = (length: number) => { const next = Array.from({ length }, () => Math.floor(Math.random() * 9)); setSequence(next); setSelected([]); setShown(-2); setTarget('Watch the sequence'); let i = 0; const tick = () => { if (i >= next.length) { setShown(-1); setTarget('Repeat the sequence by selecting the blocks.'); startAt.current = performance.now(); return; } setShown(next[i]); timer.current = window.setTimeout(() => { setShown(-1); i += 1; timer.current = window.setTimeout(tick, 220); }, 550); }; timer.current = window.setTimeout(tick, 500); };
  const pickCorsi = (index: number) => { if (shown !== -1 || done) return; const choices = [...selected, index]; setSelected(choices); if (choices.length < sequence.length) return; const correct = choices.every((value, i) => value === sequence[i]); addResult({ trialType: 'spatial-sequence', stimulus: sequence.join(','), userResponse: choices.join(','), correct, responseMs: Math.round(performance.now() - startAt.current) }); setTrial((n) => n + 1); if (correct) { corsiMax.current = Math.max(corsiMax.current, sequence.length); if (sequence.length >= 8) complete({ maxSequenceLength: corsiMax.current }); else showCorsi(sequence.length + 1); } else if (trial >= 4) complete({ maxSequenceLength: corsiMax.current }); else showCorsi(sequence.length); };
  const showSearch = (index: number) => { const cells = Array.from({ length: 25 }, () => '○'); const answer = Math.floor(Math.random() * cells.length); cells[answer] = '◉'; setGrid(cells); setTarget(String(answer)); setTrial(index + 1); startAt.current = performance.now(); };
  const pickSearch = (index: number) => { const correct = index === Number(target); const rt = Math.round(performance.now() - startAt.current); if (!correct) { errorsRef.current += 1; setWrong(errorsRef.current); return; } addResult({ trialType: 'target-search', stimulus: 'target among distractors', userResponse: `cell-${index + 1}`, correct: true, responseMs: rt }); if (trial >= 10) complete({ correctTargets: resultsRef.current.length, errors: errorsRef.current }); else showSearch(trial); };
  const stopTime = () => { if (!pressAt.current || done) return; const elapsed = Math.round(performance.now() - pressAt.current); const deviation = Math.abs(elapsed - 10_000); addResult({ trialType: 'interval-estimation', stimulus: '10000 ms', userResponse: `${elapsed} ms`, correct: deviation <= 1000, responseMs: elapsed }); complete({ targetIntervalMs: 10_000, estimatedIntervalMs: elapsed, absoluteDeviationMs: deviation }); };
  const trailClick = (value: number) => { if (value !== trial + 1) { errorsRef.current += 1; setWrong(errorsRef.current); return; } const nextTrial = trial + 1; setTrial(nextTrial); if (nextTrial === 9) { const elapsed = Math.round(performance.now() - startAt.current); addResult({ trialType: 'trail-completion', stimulus: '1-9', userResponse: '1-9', correct: true, responseMs: elapsed }); complete({ completionTimeMs: elapsed, errors: errorsRef.current }); } };

  return <section className="suite-task panel">
    <div className="suite-task-head"><button className="secondary" type="button" onClick={onBack}><ChevronLeft size={15}/> All tests</button><span className="task-chip">{info.duration} · local timing</span></div>
    {!started && <div className="suite-intro"><span className="suite-glow">◎</span><h2>{info.title}</h2><p>{info.description}</p><TaskPurposeCard task={task}/>
      {task === 'digit-span' && <div className="direction-choice"><span>Recall direction</span><button type="button" className={backwardMode ? '' : 'selected'} onClick={() => setBackwardMode(false)}>Forward</button><button type="button" className={backwardMode ? 'selected' : ''} onClick={() => setBackwardMode(true)}>Backward</button></div>}<div className="suite-note"><ShieldCheck size={15}/> Browser timing varies by device. These personal observations do not diagnose ADHD, anxiety, or cognitive disorders.</div><button className="primary" type="button" onClick={begin}>Begin task <span>→</span></button></div>}
    {started && !done && <div className="suite-active"><div className="suite-progress">{task === 'go-no-go' ? `Stimulus ${trial} of 24` : task === 'visual-search' ? `Search ${trial} of 10` : task === 'digit-span' ? `Recall trial ${trial + 1}` : task === 'corsi-spatial' ? `Sequence ${trial + 1}` : task === 'trail-making' ? `Next: ${trial + 1}` : 'One timed trial'}</div>
      {task === 'go-no-go' && <><button className={`gng-stimulus ${goSignal ? 'is-go' : 'is-nogo'}`} onClick={answerGo} aria-label="Respond to stimulus">{target}</button><p>Press/click for GO. Hold for NO-GO. Commission errors: {wrong}</p></>}
      {task === 'digit-span' && <><div className="digit-stimulus">{target}</div>{target.startsWith('Enter') && <form className="suite-answer" onSubmit={(e) => { e.preventDefault(); submitDigits(); }}><input autoFocus inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Recall digits"/><button className="primary">Submit sequence</button></form>}</>}
      {task === 'corsi-spatial' && <><div className="corsi-grid">{Array.from({ length: 9 }, (_, i) => <button key={i} className={shown === i || selected.includes(i) ? 'lit' : ''} onClick={() => pickCorsi(i)} aria-label={`Block ${i + 1}`}/>)}</div><p>{target}</p></>}
      {task === 'visual-search' && <><p>Find the filled target</p><div className="search-grid">{grid.map((symbol, i) => <button key={i} onClick={() => pickSearch(i)} aria-label={`Search cell ${i + 1}`}>{symbol}</button>)}</div><p>Miss-clicks: {wrong}</p></>}
      {task === 'time-perception' && <><p className="time-instruction">{target}</p><button className="primary hold-button" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pressAt.current = performance.now(); setTarget('Hold… release at your estimate of 10 seconds'); }} onPointerUp={stopTime} onPointerCancel={stopTime}>Press and hold</button></>}
      {task === 'trail-making' && <><p>{target}</p><div className="trail-grid">{Array.from({ length: 9 }, (_, i) => <button key={i} className={i < trial ? 'connected' : ''} disabled={i < trial} onClick={() => trailClick(i + 1)}>{i + 1}</button>)}</div><small>Errors: {wrong}</small></>}
    </div>}
    {done && <div className="suite-results"><span className="suite-glow"><Check size={22}/></span><h2>{info.title} complete</h2><p>{saving ? 'Saving securely to the local SQLite database…' : saved ? 'Session saved and verified.' : 'Session finished.'}</p><div className="suite-result-stats"><span>Trials<b>{results.length}</b></span><span>Accuracy<b>{results.length ? Math.round(results.filter((r) => r.correct).length / results.length * 100) : 0}%</b></span><span>Median response<b>{median(results.flatMap((r) => r.responseMs === null ? [] : [r.responseMs]))} ms</b></span></div>{error && <div role="alert" className="context-message error"><AlertCircle size={15}/>{error}</div>}<div className="suite-result-actions"><button className="secondary" onClick={onBack}>Back to test library</button><button className="primary" onClick={begin}><RotateCcw size={14}/> Try again</button></div></div>}
  </section>;
}
