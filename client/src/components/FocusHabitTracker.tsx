import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Check, Clock3, Mic, Pause, Pencil, Play, RotateCcw, Smartphone, Timer, Trash2, Volume2, X } from 'lucide-react';
import VoiceInputButton from './VoiceInputButton';
import { apiRequest } from '../services/api';
import { SpecularCta, WakeRange } from './ui/reactBitsAdapters';

type Habit = { id: number; date: string; screenTimeMinutes: number; distractingAppMinutes: number; focusSessionsStarted: number; focusSessionsCompleted: number; phoneEnvironment: string; studyInterruptCount: number; notes: string; createdAt: string };
type HabitForm = Omit<Habit, 'id' | 'createdAt'>;
const today = () => new Date().toLocaleDateString('en-CA');
const blank = (): HabitForm => ({ date: today(), screenTimeMinutes: 240, distractingAppMinutes: 45, focusSessionsStarted: 2, focusSessionsCompleted: 1, phoneEnvironment: 'On desk face down', studyInterruptCount: 0, notes: '' });
const environments = ['In another room', 'On desk face down', 'In hand / Nearby'];
type HabitParsed = Partial<Pick<HabitForm, 'screenTimeMinutes' | 'distractingAppMinutes' | 'focusSessionsStarted' | 'focusSessionsCompleted' | 'phoneEnvironment' | 'studyInterruptCount'>>;
const minutesFrom = (value: number, unit: string | undefined) => /hour|hr|h/.test((unit ?? '').toLowerCase()) ? Math.round(value * 60) : Math.round(value);
// Best-effort extraction of daily-log fields from a free-text transcript.
function parseHabitTranscript(text: string): HabitParsed {
  const result: HabitParsed = {};
  const lower = text.toLowerCase();
  const num = (re: RegExp) => { const m = lower.match(re); return m ? Number(m[1]) : undefined; };
  const screen = lower.match(/screen(?:\s*time)?[^0-9]*(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)?/) ?? lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)[^.]*screen/);
  if (screen) { const value = minutesFrom(Number(screen[1]), screen[2]); if (value >= 0 && value <= 900) result.screenTimeMinutes = value; }
  const distracting = lower.match(/distract(?:ing|ion)?\s*(?:app|apps|use)?[^0-9]*(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)?/) ?? lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)[^.]*distract/);
  if (distracting) { const value = minutesFrom(Number(distracting[1]), distracting[2]); if (value >= 0 && value <= 360) result.distractingAppMinutes = value; }
  const started = num(/(\d+)\s*(?:focus\s*)?sessions?\s*started/) ?? num(/started[^0-9]*(\d+)/);
  if (started !== undefined && started >= 0 && started <= 100) result.focusSessionsStarted = started;
  const completed = num(/(\d+)\s*(?:focus\s*)?sessions?\s*completed/) ?? num(/completed[^0-9]*(\d+)/);
  if (completed !== undefined && completed >= 0 && completed <= 100) result.focusSessionsCompleted = completed;
  if (/another room|different room|other room/.test(lower)) result.phoneEnvironment = 'In another room';
  else if (/face\s*down|on (?:the |my )?desk/.test(lower)) result.phoneEnvironment = 'On desk face down';
  else if (/in (?:my )?hand|nearby|pocket|next to me/.test(lower)) result.phoneEnvironment = 'In hand / Nearby';
  const interruptions = num(/interrupt(?:ion|ions|ed)?[^0-9]*(\d+)/) ?? num(/(\d+)\s*interruptions?/);
  if (interruptions !== undefined && interruptions >= 0 && interruptions <= 500) result.studyInterruptCount = interruptions;
  return result;
}
const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function FocusHabitTracker() {
  const [entries, setEntries] = useState<Habit[]>([]), [form, setForm] = useState<HabitForm>(blank), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [tab, setTab] = useState<'daily'|'deep-work'>('daily');
  const [mode, setMode] = useState<'choose'|'manual'|'speech'>('choose');
  const [transcript, setTranscript] = useState('');
  const [parsedSummary, setParsedSummary] = useState<string[]>([]);
  async function load() { setLoading(true); try { const data = await apiRequest<unknown>('/api/habits'); if (!Array.isArray(data)) throw new Error('The API returned an invalid habit log.'); setEntries(data as Habit[]); setError(''); } catch (e) { setEntries([]); setError(e instanceof Error ? e.message : 'Could not load habit logs.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  const summary = useMemo(() => {
    const groups = environments.map((environment) => { const rows = entries.filter((entry) => entry.phoneEnvironment === environment); return { environment, rows: rows.length, started: rows.reduce((n, row) => n + row.focusSessionsStarted, 0), completed: rows.reduce((n, row) => n + row.focusSessionsCompleted, 0) }; });
    const maxRate = Math.max(1, ...groups.map((group) => group.started ? group.completed / group.started : 0));
    return { groups, maxRate };
  }, [entries]);
  function change<K extends keyof HabitForm>(key: K, value: HabitForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setNotice(''); setError(''); try { const data = await apiRequest<Habit>('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (!data || typeof data.id !== 'number') throw new Error('Could not verify that this log was saved.'); setEntries((current) => [data, ...current]); setForm(blank()); setNotice('Habit log saved to this device.'); setMode('choose'); setTranscript(''); setParsedSummary([]); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this log.'); } finally { setSaving(false); } }
  async function remove(id: number) { try { await apiRequest(`/api/habits/${id}`, { method: 'DELETE' }); setEntries((current) => current.filter((entry) => entry.id !== id)); setNotice('Entry deleted.'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete this entry.'); } }
  const appendTranscript = (text: string) => setTranscript((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
  function backToChoose() { setMode('choose'); setTranscript(''); setParsedSummary([]); setError(''); setNotice(''); }
  // Auto-fill the daily-log fields from the transcript whenever it changes (speech mode).
  useEffect(() => {
    if (mode !== 'speech' || !transcript.trim()) return;
    const parsed = parseHabitTranscript(transcript);
    const filled: string[] = [];
    setForm((current) => {
      const next = { ...current };
      if (parsed.screenTimeMinutes !== undefined) next.screenTimeMinutes = parsed.screenTimeMinutes;
      if (parsed.distractingAppMinutes !== undefined) next.distractingAppMinutes = Math.min(parsed.distractingAppMinutes, next.screenTimeMinutes);
      if (parsed.focusSessionsStarted !== undefined) next.focusSessionsStarted = parsed.focusSessionsStarted;
      if (parsed.focusSessionsCompleted !== undefined) next.focusSessionsCompleted = Math.min(parsed.focusSessionsCompleted, next.focusSessionsStarted);
      if (parsed.phoneEnvironment !== undefined) next.phoneEnvironment = parsed.phoneEnvironment;
      if (parsed.studyInterruptCount !== undefined) next.studyInterruptCount = parsed.studyInterruptCount;
      next.notes = transcript.trim().slice(0, 500);
      return next;
    });
    if (parsed.screenTimeMinutes !== undefined) filled.push(`Screen time: ${parsed.screenTimeMinutes} min`);
    if (parsed.distractingAppMinutes !== undefined) filled.push(`Distracting apps: ${parsed.distractingAppMinutes} min`);
    if (parsed.focusSessionsStarted !== undefined) filled.push(`Focus sessions started: ${parsed.focusSessionsStarted}`);
    if (parsed.focusSessionsCompleted !== undefined) filled.push(`Focus sessions completed: ${parsed.focusSessionsCompleted}`);
    if (parsed.phoneEnvironment !== undefined) filled.push(`Phone: ${parsed.phoneEnvironment}`);
    if (parsed.studyInterruptCount !== undefined) filled.push(`Interruptions: ${parsed.studyInterruptCount}`);
    setParsedSummary(filled);
  }, [transcript, mode]);
  const habitForm = <form className="panel focus-habit-form" onSubmit={submit}>
    <div className="panel-head"><div><span className="focus-habit-kicker"><Smartphone size={13}/> DAILY HABIT LOG</span><h2>Capture your focus context</h2><p>Record what your day looked like alongside task sessions.</p></div></div>
    {mode === 'speech' && parsedSummary.length > 0 && <div className="context-message success" role="status"><Check size={15}/> Auto-filled from your recording: {parsedSummary.join(' · ')}</div>}
    <label className="habit-field">Log date<input type="date" value={form.date} onChange={(e) => change('date', e.target.value)} required/></label>
    <label className="habit-field">Total screen time <b>{form.screenTimeMinutes} min</b><input type="range" min="0" max="900" step="15" value={form.screenTimeMinutes} onChange={(e) => { const value = Number(e.target.value); setForm((current) => ({ ...current, screenTimeMinutes: value, distractingAppMinutes: Math.min(value, current.distractingAppMinutes) })); }}/></label>
    <label className="habit-field">Distracting app use <b>{form.distractingAppMinutes} min</b><input type="range" min="0" max={Math.min(360, form.screenTimeMinutes)} step="5" value={Math.min(form.distractingAppMinutes, form.screenTimeMinutes)} onChange={(e) => change('distractingAppMinutes', Number(e.target.value))}/></label>
    <div className="habit-number-grid"><label className="habit-field">Focus sessions started<input type="number" min="0" max="100" value={form.focusSessionsStarted} onChange={(e) => { const value = Number(e.target.value); setForm((current) => ({ ...current, focusSessionsStarted: value, focusSessionsCompleted: Math.min(value, current.focusSessionsCompleted) })); }}/></label><label className="habit-field">Completed<input type="number" min="0" max={form.focusSessionsStarted} value={form.focusSessionsCompleted} onChange={(e) => change('focusSessionsCompleted', Number(e.target.value))}/></label></div>
    <label className="habit-field">Phone placement<select value={form.phoneEnvironment} onChange={(e) => change('phoneEnvironment', e.target.value)}>{environments.map((place) => <option key={place}>{place}</option>)}</select></label>
    <label className="habit-field">Study interruptions<input type="number" min="0" max="500" value={form.studyInterruptCount} onChange={(e) => change('studyInterruptCount', Number(e.target.value))}/></label>
    <label className="habit-field">Notes (optional)<div className="voice-input-row"><textarea maxLength={500} rows={3} value={form.notes} onChange={(e) => change('notes', e.target.value)} placeholder="What else shaped your focus today?"/>{mode === 'manual' ? null : <VoiceInputButton label="Dictate daily log" onTranscript={appendTranscript} />}</div></label>
    {error && <p className="habit-message error" role="alert">{error}</p>}{notice && <p className="habit-message" role="status"><Check size={14}/>{notice}</p>}
    <button className="primary habit-submit" disabled={saving}>{saving ? 'Saving…' : 'Save daily log'} <span>→</span></button>
  </form>;
  const impactCard = <section className="panel focus-impact-card">
    <div className="panel-head"><div><span className="focus-habit-kicker"><Activity size={13}/> VISUAL IMPACT</span><h2>Focus completion by phone placement</h2><p>Logged completed sessions ÷ started sessions, grouped by recorded environment.</p></div></div>
    {entries.length ? <div className="habit-bars">{summary.groups.map((group) => { const rate = group.started ? group.completed / group.started : 0; return <div className="habit-bar-row" key={group.environment}><div><span>{group.environment}</span><b>{group.started ? `${Math.round(rate * 100)}%` : '—'}</b></div><div className="habit-bar-track"><i style={{ width: `${Math.round(rate / summary.maxRate * 100)}%` }}/></div><small>{group.rows} {group.rows === 1 ? 'day' : 'days'} · {group.completed}/{group.started} sessions</small></div>; })}</div> : <div className="habit-empty"><Smartphone size={23}/><b>Your first log will start this comparison.</b><span>Comparisons summarize recorded entries only.</span></div>}
    <div className="habit-integrity"><b>Behavioral context, not biology</b><span>These comparisons describe associations in your own logs. They do not establish cause, diagnose a condition, or measure dopamine or other biological changes.</span></div>
  </section>;
  const history = <section className="panel habit-history"><div className="panel-head"><div><span className="focus-habit-kicker"><Clock3 size={13}/> YOUR RECORDS</span><h2>Habit timeline</h2><p>{entries.length} saved {entries.length === 1 ? 'entry' : 'entries'} on this device.</p></div></div>
    {loading ? <div className="habit-empty">Loading your entries…</div> : entries.length ? <div className="habit-entry-list">{entries.map((entry) => <article className="habit-entry" key={entry.id}><div className="habit-entry-date"><b>{formatDate(entry.date)}</b><button className="context-delete" aria-label={`Delete ${entry.date} habit entry`} onClick={() => void remove(entry.id)}><Trash2 size={15}/></button></div><div className="habit-metrics"><span><b>{entry.focusSessionsCompleted}/{entry.focusSessionsStarted}</b> focus sessions</span><span><b>{entry.phoneEnvironment}</b></span><span><b>{entry.screenTimeMinutes} min</b> screen</span><span><b>{entry.distractingAppMinutes} min</b> distracting apps</span><span><b>{entry.studyInterruptCount}</b> interruptions</span></div>{entry.notes && <p className="habit-note">{entry.notes}</p>}</article>)}</div> : <div className="habit-empty"><b>No habit logs yet</b><span>Save a daily entry to begin building your personal timeline.</span></div>}
  </section>;
  return <div className="focus-habit-module">
    <div className="focus-habit-tabs" role="tablist" aria-label="Focus tools"><button role="tab" aria-selected={tab==='daily'} className={tab==='daily'?'active':''} onClick={()=>setTab('daily')}><Smartphone size={15}/> Daily habits</button><button role="tab" aria-selected={tab==='deep-work'} className={tab==='deep-work'?'active':''} onClick={()=>setTab('deep-work')}><Timer size={15}/> Deep Work & Audio</button></div>
    {tab==='deep-work' ? <DeepWorkFocus/> : mode==='choose' ? <>
      <section className="context-journal" aria-label="Daily habit log entry options">
        <div className="panel context-form">
          <div className="panel-head"><div><span className="task-chip"><Smartphone size={14}/> FOCUS &amp; DAILY HABITS</span><h2>Capture your focus context</h2><p>Record what your day looked like alongside task sessions.</p></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <button type="button" className="primary" style={{ minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => setMode('speech')}><Mic size={28}/><strong>Text input</strong><small>Record your day by voice; we auto-fill the fields</small></button>
            <button type="button" className="secondary" style={{ minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => setMode('manual')}><Pencil size={28}/><strong>Manual input</strong><small>Enter each field by hand</small></button>
          </div>
        </div>
        {history}
      </section>
      {impactCard}
    </> : <>
      <div style={{ marginBottom: 12 }}><button className="secondary" type="button" onClick={backToChoose}><X size={14}/> Back</button></div>
      {mode==='speech' && <section className="panel context-form" aria-label="Record daily habit log by voice">
        <div className="panel-head"><div><span className="task-chip"><Mic size={14}/> FOCUS &amp; DAILY HABITS</span><h2>Record by voice</h2><p>Tap dictate, speak your day, and we’ll auto-fill the fields.</p></div></div>
        <div style={{ margin: '12px 0' }}><VoiceInputButton label="Dictate" onTranscript={appendTranscript} /></div>
        <label className="habit-field">Transcription <small>Review &amp; edit</small><textarea rows={4} maxLength={2000} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Your recording will appear here…" /></label>
        {parsedSummary.length > 0 && <div className="context-message success" role="status"><Check size={15}/> Auto-filled: {parsedSummary.join(' · ')}</div>}
      </section>}
      <div className="focus-habit-grid">{habitForm}{impactCard}</div>
      {history}
    </>}
  </div>;
}

type SoundKey = 'white' | 'brown' | 'pink' | 'rainfall' | 'ambient';
type SoundOption = { key: SoundKey; label: string; description: string };

const SOUND_OPTIONS: SoundOption[] = [
  { key: 'white', label: 'White Noise', description: 'Even, full-spectrum masking for noisy spaces.' },
  { key: 'brown', label: 'Brown Noise', description: 'Deep, low-frequency roll for steady concentration.' },
  { key: 'pink', label: 'Pink Noise', description: 'A balanced spectrum with a softer, natural edge.' },
  { key: 'rainfall', label: 'Rainfall', description: 'A real rain recording, bundled for offline playback.' },
  { key: 'ambient', label: 'Ambient Drift', description: 'Slow ocean swells, generated locally in your browser.' },
];

// Only the nature recording is a file; the other soundscapes are synthesised locally.
const SOUND_SRC: Partial<Record<SoundKey, string>> = { rainfall: '/audio/rainfall.ogg' };

function makeNoiseBuffer(context: AudioContext, key: SoundKey) {
  // Eight-second loops whose modulation periods divide the length evenly, so they loop seamlessly.
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * 8);
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, brown = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (key === 'pink') {
      b0 = .99886 * b0 + white * .0555179;
      b1 = .99332 * b1 + white * .0750759;
      b2 = .969 * b2 + white * .153852;
      b3 = .8665 * b3 + white * .3104856;
      b4 = .55 * b4 + white * .5329522;
      b5 = -.7616 * b5 - white * .016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * .5362) * .11;
      b6 = white * .115926;
    } else if (key === 'brown' || key === 'ambient') {
      brown = (brown + .02 * white) / 1.02;
      if (key === 'ambient') {
        const t = i / sampleRate;
        const swell = .55 + .32 * Math.sin((2 * Math.PI * t) / 8 - Math.PI / 2) + .13 * Math.sin((2 * Math.PI * t) / 4);
        data[i] = brown * 3.2 * swell;
      } else {
        data[i] = brown * 3.5;
      }
    } else {
      data[i] = white * .32;
    }
  }
  return buffer;
}

function DeepWorkFocus(){
  const [hours,setHours]=useState(0),[minutes,setMinutes]=useState(45),[remaining,setRemaining]=useState(2700),[running,setRunning]=useState(false),[interruptions,setInterruptions]=useState(0),[soundKey,setSoundKey]=useState<SoundKey>('white'),[playing,setPlaying]=useState(false),[volume,setVolume]=useState(.45),[message,setMessage]=useState('');
  const timerRef=useRef<number|undefined>(),remainingRef=useRef(2700),interruptionsRef=useRef(0),audioRef=useRef<HTMLAudioElement>(null),audioContextRef=useRef<AudioContext|null>(null),noiseNodesRef=useRef<{source:AudioBufferSourceNode;gain:GainNode}|null>(null),completedRef=useRef(false);
  const sound = SOUND_OPTIONS.find(option => option.key === soundKey) ?? SOUND_OPTIONS[0];
  const targetSeconds=(hours*60+minutes)*60, progress=targetSeconds?Math.max(0,Math.min(1,remaining/targetSeconds)):0;

  function stopSource(){
    if(noiseNodesRef.current){
      try{noiseNodesRef.current.source.stop();}catch{}
      noiseNodesRef.current.source.disconnect();
      noiseNodesRef.current.gain.disconnect();
      noiseNodesRef.current=null;
    }
    if(audioRef.current) audioRef.current.pause();
  }

  useEffect(()=>()=>{
    window.clearInterval(timerRef.current);
    stopSource();
    void audioContextRef.current?.close();
  },[]);

  useEffect(()=>{
    if(!playing){stopSource();return;}
    let cancelled=false;
    const begin=async()=>{
      try{
        stopSource();
        const src=SOUND_SRC[soundKey];
        if(src){
          const element=audioRef.current;
          if(!element) throw new Error('The audio player is not ready.');
          element.src=src;
          element.volume=volume;
          await element.play();
        }else{
          const Context=window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if(!Context) throw new Error('Web Audio is not supported in this browser.');
          const context=audioContextRef.current??new Context();
          audioContextRef.current=context;
          await context.resume();
          if(cancelled) return;
          const source=context.createBufferSource(),gain=context.createGain();
          source.buffer=makeNoiseBuffer(context,soundKey);
          source.loop=true;
          gain.gain.value=volume;
          source.connect(gain);
          gain.connect(context.destination);
          source.start();
          noiseNodesRef.current={source,gain};
        }
      }catch(error){
        if(!cancelled){setPlaying(false);setMessage(error instanceof Error?`Could not start this sound: ${error.message}`:'Could not start this sound. Please check your browser audio permissions.');}
      }
    };
    void begin();
    return()=>{cancelled=true;stopSource();};
    // volume is applied by the dedicated effect below, so it is intentionally not a dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[playing,soundKey]);

  useEffect(()=>{
    if(noiseNodesRef.current && audioContextRef.current){
      noiseNodesRef.current.gain.gain.setTargetAtTime(volume,audioContextRef.current.currentTime,.04);
    }
    if(audioRef.current) audioRef.current.volume=volume;
  },[volume]);

  function reset(){window.clearInterval(timerRef.current);timerRef.current=undefined;setRunning(false);const value=(hours*60+minutes)*60;remainingRef.current=value;setRemaining(value);interruptionsRef.current=0;setInterruptions(0);completedRef.current=false;setMessage('');}
  function start(){const target=(hours*60+minutes)*60;if(!target){setMessage('Choose a session duration longer than zero.');return;}if(remainingRef.current<=0||remainingRef.current>target){remainingRef.current=target;setRemaining(target);}setMessage('');setRunning(true);const deadline=Date.now()+remainingRef.current*1000;timerRef.current=window.setInterval(()=>{const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));remainingRef.current=left;setRemaining(left);if(left===0){window.clearInterval(timerRef.current);timerRef.current=undefined;setRunning(false);if(!completedRef.current){completedRef.current=true;void saveSession(target);}}},250);}
  function pause(){window.clearInterval(timerRef.current);timerRef.current=undefined;setRunning(false);}
  async function saveSession(target:number){try{await apiRequest('/api/deepwork',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({targetDurationSeconds:target,completedSeconds:target,distractionCount:interruptionsRef.current})});setMessage('Deep Work session completed and verified in this device’s SQLite database.');}catch(error){setMessage(error instanceof Error?`Timer finished, but saving failed: ${error.message}`:'Timer finished, but the session could not be saved.');}}
  const display=(value:number)=>`${String(Math.floor(value/3600)).padStart(2,'0')}:${String(Math.floor(value%3600/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
  const setDuration=(nextHours:number,nextMinutes:number)=>{setHours(nextHours);setMinutes(nextMinutes);if(!running){const value=(nextHours*60+nextMinutes)*60;remainingRef.current=value;setRemaining(value);}};
  const toggleSound=()=>{setMessage('');setPlaying((current)=>!current);};

  return <div className="deepwork-layout">
    <section className="panel deepwork-timer"><div className="panel-head"><div><span className="focus-habit-kicker"><Timer size={13}/> DEEP WORK TIMER</span><h2>Protect a block of focused time</h2><p>Choose a duration, then start when you’re ready.</p></div></div>
      <div className="deepwork-duration"><label>Hours<select value={hours} disabled={running} onChange={e=>setDuration(Number(e.target.value),minutes)}>{[0,1,2,3,4].map(n=><option key={n} value={n}>{n} hr</option>)}</select></label><label>Minutes<select value={minutes} disabled={running} onChange={e=>setDuration(hours,Number(e.target.value))}>{[0,15,30,45].map(n=><option key={n} value={n}>{n} min</option>)}</select></label></div>
      <div className="timer-ring" style={{'--timer-progress':`${progress*100}%`} as CSSProperties}><div><span>{display(remaining)}</span><small>{running?'FOCUS IN PROGRESS':remaining===0?'SESSION COMPLETE':'READY WHEN YOU ARE'}</small></div></div>
      <div className="timer-controls">{running?<button className="secondary" onClick={pause}><Pause size={15}/> Pause</button>:<button className="primary" onClick={start}><Play size={15} fill="currentColor"/> Start</button>}<button className="secondary" onClick={reset}><RotateCcw size={14}/> Reset</button></div>
      <button className="interrupt-button" disabled={!running} onClick={()=>{interruptionsRef.current+=1;setInterruptions(interruptionsRef.current);}}>＋ Log an interruption <b>{interruptions}</b></button>
      <p className="os-tip">For native OS-wide notification muting, enable Do Not Disturb on your operating system during Deep Work sessions.</p>
      {message&&<p className="habit-message" role="status">{message}</p>}
    </section>
    <section className="panel focus-audio"><div className="panel-head"><div><span className="focus-habit-kicker"><Volume2 size={13}/> FOCUS SOUND GENERATOR</span><h2>Choose a soundscape</h2><p>Noise is generated locally. The rainfall recording is bundled with the app.</p></div></div>
      <div className="sound-options">{SOUND_OPTIONS.map(option=><button className={soundKey===option.key?'selected':''} key={option.key} onClick={()=>{setSoundKey(option.key);setMessage('');}}>{option.label}</button>)}</div>
      <div className={`sound-now${playing?' is-playing':''}`}><div className="sound-wave" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</div><b>{sound.label}</b><span>{playing?'Now playing':'Ready to play'}</span><small>{sound.description}</small></div>
      <div className="sound-controls"><SpecularCta onClick={toggleSound} ariaLabel={playing ? 'Pause sound' : 'Play sound'} size="sm">{playing?<><Pause size={15}/> Pause</>:<><Play size={15} fill="currentColor"/> Play</>}</SpecularCta><label className="sound-volume-slot"><Volume2 size={15}/><WakeRange value={volume} min={0} max={1} step={0.01} onChange={setVolume} ariaLabel="Master volume" className="sound-wake" /></label></div>
      <audio ref={audioRef} loop preload="none" onError={()=>{setPlaying(false);setMessage('The rainfall recording could not be loaded. Try one of the locally generated soundscapes.');}}/>
      <div className="habit-integrity"><b>Sound, on your terms</b><span>White, pink, brown, and ambient drift are generated in your browser with Web Audio — no downloads needed. Rainfall uses a bundled, public-domain recording and works offline.</span></div>
    </section>
  </div>;
}

type Session = { createdAt: string; medianRt: number; taskType?: string; isSynthetic?: boolean | number };
export function FocusHabitInsights() {
  const [habits, setHabits] = useState<Habit[]>([]), [sessions, setSessions] = useState<Session[]>([]), [loading, setLoading] = useState(true), [unavailable, setUnavailable] = useState(false);
  useEffect(() => { let active = true; Promise.all([apiRequest<unknown>('/api/habits'), apiRequest<unknown>('/api/sessions')]).then(([habitRows, sessionRows]) => { if (!Array.isArray(habitRows) || !Array.isArray(sessionRows)) throw new Error('Invalid response'); if (active) { setHabits(habitRows as Habit[]); setSessions(sessionRows as Session[]); } }).catch(() => { if (active) { setHabits([]); setSessions([]); setUnavailable(true); } }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const observations = useMemo(() => {
    const items: string[] = [];
    const away = habits.filter((row) => row.phoneEnvironment === 'In another room'), other = habits.filter((row) => row.phoneEnvironment !== 'In another room');
    const mean = (rows: Habit[]) => rows.reduce((sum, row) => sum + row.focusSessionsCompleted, 0) / rows.length;
    if (away.length >= 2 && other.length >= 2) { const a = mean(away), b = mean(other); if (b > 0 && a !== b) { const pct = Math.round(Math.abs(a - b) / b * 100); items.push(`In these logs, average completed focus sessions were ${pct}% ${a > b ? 'higher' : 'lower'} on days your phone was recorded as in another room (${away.length} days versus ${other.length}).`); } }
    const byDate = new Map(habits.map((entry) => [entry.date, entry]));
    const rtByHabit = sessions.filter((row) => !Boolean(row.isSynthetic) && (row.taskType === 'go-no-go' || !row.taskType)).flatMap((row) => { const habit = byDate.get(new Date(row.createdAt).toLocaleDateString('en-CA')); return habit && Number.isFinite(row.medianRt) ? [{ rt: row.medianRt, low: habit.distractingAppMinutes < 60 }] : []; });
    const low = rtByHabit.filter((row) => row.low), high = rtByHabit.filter((row) => !row.low), med = (rows: typeof rtByHabit) => { const sorted = rows.map((row) => row.rt).sort((a, b) => a - b); return sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : 0; };
    if (low.length >= 2 && high.length >= 2 && med(low) !== med(high)) { const diff = Math.abs(med(low) - med(high)); items.push(`Logged N-back/Go-No-Go median response time was ${diff} ms ${med(low) < med(high) ? 'lower' : 'higher'} on days with under 60 minutes of distracting app use (${low.length} task sessions versus ${high.length}).`); }
    return items;
  }, [habits, sessions]);
  return <section className="panel focus-insight-panel"><div className="panel-head"><div><span className="focus-habit-kicker"><Activity size={13}/> FOCUS & HABIT OBSERVATIONS</span><h2>Patterns in your logged context</h2><p>Comparisons use only your non-synthetic session records and habit entries.</p></div></div>{loading ? <div className="habit-empty">Checking whether there are enough matching records…</div> : unavailable ? <div className="habit-empty">Your habit or session records could not be loaded right now.</div> : observations.length ? <ul className="focus-observation-list">{observations.map((text) => <li key={text}>{text}</li>)}</ul> : <div className="habit-empty">More matching entries are needed before a comparison can be shown. No conclusion is drawn from insufficient data.</div>}<p className="habit-integrity-note">These are behavioral and environmental correlations from user logs. They do not establish causation, make biological claims, or provide medical diagnoses.</p></section>;
}
