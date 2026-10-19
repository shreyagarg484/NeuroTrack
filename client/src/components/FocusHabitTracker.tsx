import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Check, Clock3, Pause, Play, RotateCcw, Smartphone, Timer, Trash2, Volume2 } from 'lucide-react';

type Habit = { id: number; date: string; screenTimeMinutes: number; distractingAppMinutes: number; focusSessionsStarted: number; focusSessionsCompleted: number; phoneEnvironment: string; studyInterruptCount: number; notes: string; createdAt: string };
type HabitForm = Omit<Habit, 'id' | 'createdAt'>;
const today = () => new Date().toLocaleDateString('en-CA');
const blank = (): HabitForm => ({ date: today(), screenTimeMinutes: 240, distractingAppMinutes: 45, focusSessionsStarted: 2, focusSessionsCompleted: 1, phoneEnvironment: 'On desk face down', studyInterruptCount: 0, notes: '' });
const environments = ['In another room', 'On desk face down', 'In hand / Nearby'];
const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function FocusHabitTracker() {
  const [entries, setEntries] = useState<Habit[]>([]), [form, setForm] = useState<HabitForm>(blank), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [tab, setTab] = useState<'daily'|'deep-work'>('daily');
  async function load() { setLoading(true); try { const response = await fetch('/api/habits'); if (!response.ok) throw new Error('Could not load habit logs. Check the API connection.'); const data: unknown = await response.json(); if (!Array.isArray(data)) throw new Error('The API returned an invalid habit log.'); setEntries(data as Habit[]); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load habit logs.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  const summary = useMemo(() => {
    const groups = environments.map((environment) => { const rows = entries.filter((entry) => entry.phoneEnvironment === environment); return { environment, rows: rows.length, started: rows.reduce((n, row) => n + row.focusSessionsStarted, 0), completed: rows.reduce((n, row) => n + row.focusSessionsCompleted, 0) }; });
    const maxRate = Math.max(1, ...groups.map((group) => group.started ? group.completed / group.started : 0));
    return { groups, maxRate };
  }, [entries]);
  function change<K extends keyof HabitForm>(key: K, value: HabitForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setNotice(''); setError(''); try { const response = await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) throw new Error(data?.details?.fieldErrors ? Object.values(data.details.fieldErrors).flat().join(' ') : data?.error || 'Could not save this log.'); setEntries((current) => [data as Habit, ...current]); setForm(blank()); setNotice('Habit log saved to this device.'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this log.'); } finally { setSaving(false); } }
  async function remove(id: number) { try { const response = await fetch(`/api/habits/${id}`, { method: 'DELETE' }); if (!response.ok) throw new Error('Could not delete this entry.'); setEntries((current) => current.filter((entry) => entry.id !== id)); setNotice('Entry deleted.'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete this entry.'); } }
  return <div className="focus-habit-module">
    <div className="focus-habit-tabs" role="tablist" aria-label="Focus tools"><button role="tab" aria-selected={tab==='daily'} className={tab==='daily'?'active':''} onClick={()=>setTab('daily')}><Smartphone size={15}/> Daily habits</button><button role="tab" aria-selected={tab==='deep-work'} className={tab==='deep-work'?'active':''} onClick={()=>setTab('deep-work')}><Timer size={15}/> Deep Work & Audio</button></div>
    {tab==='deep-work' ? <DeepWorkFocus/> : <>
    <div className="focus-habit-grid">
      <form className="panel focus-habit-form" onSubmit={submit}>
        <div className="panel-head"><div><span className="focus-habit-kicker"><Smartphone size={13}/> DAILY HABIT LOG</span><h2>Capture your focus context</h2><p>Record what your day looked like alongside task sessions.</p></div></div>
        <label className="habit-field">Log date<input type="date" value={form.date} onChange={(e) => change('date', e.target.value)} required/></label>
        <label className="habit-field">Total screen time <b>{form.screenTimeMinutes} min</b><input type="range" min="0" max="900" step="15" value={form.screenTimeMinutes} onChange={(e) => { const value = Number(e.target.value); setForm((current) => ({ ...current, screenTimeMinutes: value, distractingAppMinutes: Math.min(value, current.distractingAppMinutes) })); }}/></label>
        <label className="habit-field">Distracting app use <b>{form.distractingAppMinutes} min</b><input type="range" min="0" max={Math.min(360, form.screenTimeMinutes)} step="5" value={Math.min(form.distractingAppMinutes, form.screenTimeMinutes)} onChange={(e) => change('distractingAppMinutes', Number(e.target.value))}/></label>
        <div className="habit-number-grid"><label className="habit-field">Focus sessions started<input type="number" min="0" max="100" value={form.focusSessionsStarted} onChange={(e) => { const value = Number(e.target.value); setForm((current) => ({ ...current, focusSessionsStarted: value, focusSessionsCompleted: Math.min(value, current.focusSessionsCompleted) })); }}/></label><label className="habit-field">Completed<input type="number" min="0" max={form.focusSessionsStarted} value={form.focusSessionsCompleted} onChange={(e) => change('focusSessionsCompleted', Number(e.target.value))}/></label></div>
        <label className="habit-field">Phone placement<select value={form.phoneEnvironment} onChange={(e) => change('phoneEnvironment', e.target.value)}>{environments.map((place) => <option key={place}>{place}</option>)}</select></label>
        <label className="habit-field">Study interruptions<input type="number" min="0" max="500" value={form.studyInterruptCount} onChange={(e) => change('studyInterruptCount', Number(e.target.value))}/></label>
        <label className="habit-field">Notes (optional)<textarea maxLength={500} rows={3} value={form.notes} onChange={(e) => change('notes', e.target.value)} placeholder="What else shaped your focus today?"/></label>
        {error && <p className="habit-message error" role="alert">{error}</p>}{notice && <p className="habit-message" role="status"><Check size={14}/>{notice}</p>}
        <button className="primary habit-submit" disabled={saving}>{saving ? 'Saving…' : 'Save daily log'} <span>→</span></button>
      </form>
      <section className="panel focus-impact-card">
        <div className="panel-head"><div><span className="focus-habit-kicker"><Activity size={13}/> VISUAL IMPACT</span><h2>Focus completion by phone placement</h2><p>Logged completed sessions ÷ started sessions, grouped by recorded environment.</p></div></div>
        {entries.length ? <div className="habit-bars">{summary.groups.map((group) => { const rate = group.started ? group.completed / group.started : 0; return <div className="habit-bar-row" key={group.environment}><div><span>{group.environment}</span><b>{group.started ? `${Math.round(rate * 100)}%` : '—'}</b></div><div className="habit-bar-track"><i style={{ width: `${Math.round(rate / summary.maxRate * 100)}%` }}/></div><small>{group.rows} {group.rows === 1 ? 'day' : 'days'} · {group.completed}/{group.started} sessions</small></div>; })}</div> : <div className="habit-empty"><Smartphone size={23}/><b>Your first log will start this comparison.</b><span>Comparisons summarize recorded entries only.</span></div>}
        <div className="habit-integrity"><b>Behavioral context, not biology</b><span>These comparisons describe associations in your own logs. They do not establish cause, diagnose a condition, or measure dopamine or other biological changes.</span></div>
      </section>
    </div>
    <section className="panel habit-history"><div className="panel-head"><div><span className="focus-habit-kicker"><Clock3 size={13}/> YOUR RECORDS</span><h2>Habit timeline</h2><p>{entries.length} saved {entries.length === 1 ? 'entry' : 'entries'} on this device.</p></div></div>
      {loading ? <div className="habit-empty">Loading your entries…</div> : entries.length ? <div className="habit-entry-list">{entries.map((entry) => <article className="habit-entry" key={entry.id}><div className="habit-entry-date"><b>{formatDate(entry.date)}</b><button className="context-delete" aria-label={`Delete ${entry.date} habit entry`} onClick={() => void remove(entry.id)}><Trash2 size={15}/></button></div><div className="habit-metrics"><span><b>{entry.focusSessionsCompleted}/{entry.focusSessionsStarted}</b> focus sessions</span><span><b>{entry.phoneEnvironment}</b></span><span><b>{entry.screenTimeMinutes} min</b> screen</span><span><b>{entry.distractingAppMinutes} min</b> distracting apps</span><span><b>{entry.studyInterruptCount}</b> interruptions</span></div>{entry.notes && <p className="habit-note">{entry.notes}</p>}</article>)}</div> : <div className="habit-empty"><b>No habit logs yet</b><span>Save a daily entry to begin building your personal timeline.</span></div>}
    </section>
    </>}
  </div>;
}

type Sound = 'White Noise'|'Pink Noise'|'Brown Noise'|'Rainfall'|'Ambient Drift';
const streamSources: Partial<Record<Sound,string>> = {
  Rainfall: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Rain_%281%29.ogg',
  'Ambient Drift': 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Waves.ogg'
};
function makeNoiseBuffer(context: AudioContext, type: Sound) {
  const length = context.sampleRate * 3, buffer = context.createBuffer(1, length, context.sampleRate), data = buffer.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,brown=0;
  for(let i=0;i<length;i++){
    const white=Math.random()*2-1;
    if(type==='Pink Noise'){b0=.99886*b0+white*.0555179;b1=.99332*b1+white*.0750759;b2=.969*b2+white*.153852;b3=.8665*b3+white*.3104856;b4=.55*b4+white*.5329522;b5=-.7616*b5-white*.016898;data[i]=(b0+b1+b2+b3+b4+b5+b6+white*.5362)*.11;b6=white*.115926;}
    else if(type==='Brown Noise'){brown=(brown+.02*white)/1.02;data[i]=brown*3.5;}
    else data[i]=white*.32;
  }
  return buffer;
}
function DeepWorkFocus(){
  const [hours,setHours]=useState(0),[minutes,setMinutes]=useState(45),[remaining,setRemaining]=useState(2700),[running,setRunning]=useState(false),[interruptions,setInterruptions]=useState(0),[sound,setSound]=useState<Sound>('White Noise'),[playing,setPlaying]=useState(false),[volume,setVolume]=useState(.25),[message,setMessage]=useState('');
  const timerRef=useRef<number|undefined>(),remainingRef=useRef(2700),interruptionsRef=useRef(0),audioRef=useRef<HTMLAudioElement>(null),audioContextRef=useRef<AudioContext|null>(null),noiseNodesRef=useRef<{source:AudioBufferSourceNode;gain:GainNode}|null>(null),completedRef=useRef(false);
  const targetSeconds=(hours*60+minutes)*60, progress=targetSeconds?Math.max(0,Math.min(1,remaining/targetSeconds)):0;
  function stopNoise(){if(noiseNodesRef.current){try{noiseNodesRef.current.source.stop();}catch{}noiseNodesRef.current.source.disconnect();noiseNodesRef.current.gain.disconnect();noiseNodesRef.current=null;}}
  function stopAudio(){stopNoise();if(audioRef.current){audioRef.current.pause();audioRef.current.currentTime=0;}setPlaying(false);}
  useEffect(()=>()=>{window.clearInterval(timerRef.current);stopNoise();void audioContextRef.current?.close();},[]);
  useEffect(()=>{if(!playing)return;let cancelled=false;const start=async()=>{try{if(streamSources[sound]){if(audioRef.current){audioRef.current.src=streamSources[sound]!;audioRef.current.volume=volume;await audioRef.current.play();}}else{const Context=window.AudioContext;if(!Context)throw new Error('Web Audio is not supported in this browser.');const context=audioContextRef.current??new Context();audioContextRef.current=context;await context.resume();if(cancelled)return;const source=context.createBufferSource(),gain=context.createGain();source.buffer=makeNoiseBuffer(context,sound);source.loop=true;gain.gain.value=volume;source.connect(gain);gain.connect(context.destination);source.start();noiseNodesRef.current={source,gain};}}catch{if(!cancelled){setPlaying(false);setMessage('Could not start this sound. Try another option or check browser audio permissions.');}}};void start();return()=>{cancelled=true;stopNoise();if(audioRef.current){audioRef.current.pause();}};},[playing,sound]);
  useEffect(()=>{if(noiseNodesRef.current)noiseNodesRef.current.gain.gain.setTargetAtTime(volume,audioContextRef.current?.currentTime??0,.04);if(audioRef.current)audioRef.current.volume=volume;},[volume]);
  function reset(){window.clearInterval(timerRef.current);timerRef.current=undefined;setRunning(false);const value=(hours*60+minutes)*60;remainingRef.current=value;setRemaining(value);interruptionsRef.current=0;setInterruptions(0);completedRef.current=false;setMessage('');}
  function start(){const target=(hours*60+minutes)*60;if(!target){setMessage('Choose a session duration longer than zero.');return;}if(remainingRef.current<=0||remainingRef.current>target){remainingRef.current=target;setRemaining(target);}setMessage('');setRunning(true);const deadline=Date.now()+remainingRef.current*1000;timerRef.current=window.setInterval(()=>{const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));remainingRef.current=left;setRemaining(left);if(left===0){window.clearInterval(timerRef.current);timerRef.current=undefined;setRunning(false);if(!completedRef.current){completedRef.current=true;void saveSession(target);}}},250);}
  function pause(){window.clearInterval(timerRef.current);timerRef.current=undefined;setRunning(false);}
  async function saveSession(target:number){try{const response=await fetch('/api/deepwork',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({targetDurationSeconds:target,completedSeconds:target,distractionCount:interruptionsRef.current})});const data=await response.json();if(!response.ok)throw new Error(data?.error||'Session could not be saved.');setMessage('Deep Work session completed and verified in this device’s SQLite database.');}catch(error){setMessage(error instanceof Error?`Timer finished, but saving failed: ${error.message}`:'Timer finished, but the session could not be saved.');}}
  const display=(value:number)=>`${String(Math.floor(value/3600)).padStart(2,'0')}:${String(Math.floor(value%3600/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
  const setDuration=(nextHours:number,nextMinutes:number)=>{setHours(nextHours);setMinutes(nextMinutes);if(!running){const value=(nextHours*60+nextMinutes)*60;remainingRef.current=value;setRemaining(value);}};
  const toggleSound=()=>{if(playing)stopAudio();else{setMessage('');setPlaying(true);}};
  return <div className="deepwork-layout">
    <section className="panel deepwork-timer"><div className="panel-head"><div><span className="focus-habit-kicker"><Timer size={13}/> DEEP WORK TIMER</span><h2>Protect a block of focused time</h2><p>Choose a duration, then start when you’re ready.</p></div></div>
      <div className="deepwork-duration"><label>Hours<select value={hours} disabled={running} onChange={e=>setDuration(Number(e.target.value),minutes)}>{[0,1,2,3,4].map(n=><option key={n} value={n}>{n} hr</option>)}</select></label><label>Minutes<select value={minutes} disabled={running} onChange={e=>setDuration(hours,Number(e.target.value))}>{[0,15,30,45].map(n=><option key={n} value={n}>{n} min</option>)}</select></label></div>
      <div className="timer-ring" style={{'--timer-progress':`${progress*100}%`} as CSSProperties}><div><span>{display(remaining)}</span><small>{running?'FOCUS IN PROGRESS':remaining===0?'SESSION COMPLETE':'READY WHEN YOU ARE'}</small></div></div>
      <div className="timer-controls">{running?<button className="secondary" onClick={pause}><Pause size={15}/> Pause</button>:<button className="primary" onClick={start}><Play size={15} fill="currentColor"/> Start</button>}<button className="secondary" onClick={reset}><RotateCcw size={14}/> Reset</button></div>
      <button className="interrupt-button" disabled={!running} onClick={()=>{interruptionsRef.current+=1;setInterruptions(interruptionsRef.current);}}>＋ Log interruption <b>{interruptions}</b></button>
      <p className="os-tip">For native OS-wide system notification muting, enable Do Not Disturb on your operating system during Deep Work sessions.</p>
      {message&&<p className="habit-message" role="status">{message}</p>}
    </section>
    <section className="panel focus-audio"><div className="panel-head"><div><span className="focus-habit-kicker"><Volume2 size={13}/> FOCUS SOUND GENERATOR</span><h2>Choose a soundscape</h2><p>Noise is generated locally. Natural recordings stream from Wikimedia Commons.</p></div></div>
      <div className="sound-options">{(['White Noise','Brown Noise','Pink Noise','Rainfall','Ambient Drift'] as Sound[]).map(option=><button className={sound===option?'selected':''} key={option} onClick={()=>{setSound(option);setMessage('');}}>{option}</button>)}</div>
      <div className={`sound-now${playing?' is-playing':''}`}><div className="sound-wave" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><b>{sound}</b><span>{playing?'Now playing':'Ready to play'}</span></div>
      <div className="sound-controls"><button className="primary" onClick={toggleSound}>{playing?<><Pause size={15}/> Pause</>:<><Play size={15} fill="currentColor"/> Play</>}</button><label><Volume2 size={15}/><input aria-label="Master volume" type="range" min="0" max="1" step=".01" value={volume} onChange={e=>setVolume(Number(e.target.value))}/><span>{Math.round(volume*100)}%</span></label></div>
      <audio ref={audioRef} loop onError={()=>{setPlaying(false);setMessage('This natural audio stream is unavailable. Try a locally generated noise option.');}}/>
      <div className="habit-integrity"><b>Instant local noise</b><span>White, pink, and brown noise are generated in your browser with Web Audio. Rainfall and Ambient Drift use public-domain audio streams and need an internet connection.</span></div>
    </section>
  </div>;
}

type Session = { createdAt: string; medianRt: number; taskType?: string; isSynthetic?: boolean | number };
export function FocusHabitInsights() {
  const [habits, setHabits] = useState<Habit[]>([]), [sessions, setSessions] = useState<Session[]>([]), [loading, setLoading] = useState(true), [unavailable, setUnavailable] = useState(false);
  useEffect(() => { let active = true; Promise.all([fetch('/api/habits'), fetch('/api/sessions')]).then(async ([h, s]) => { if (!h.ok || !s.ok) throw new Error('unavailable'); const [habitRows, sessionRows] = await Promise.all([h.json(), s.json()]); if (active && Array.isArray(habitRows) && Array.isArray(sessionRows)) { setHabits(habitRows as Habit[]); setSessions(sessionRows as Session[]); } }).catch(() => { if (active) setUnavailable(true); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
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
