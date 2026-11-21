import { useEffect, useState } from 'react';
import { Activity, AlertCircle, BookOpen, CalendarDays, Check, Coffee, Mic, Moon, Pencil, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react';
import HydrationTracker from './HydrationTracker';
import VoiceInputButton from './VoiceInputButton';
import { apiRequest } from '../services/api';

type ContextEntry = {
  id: number;
  date: string;
  sleepDuration: number | null;
  sleepQuality: number;
  caffeine: number | null;
  exercise: number | null;
  mood: number;
  stress: number;
  energy: number;
  waterIntakeLiters?: number | null;
  notes: string;
  createdAt: string;
};

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateLabel(date: string) {
  const value = new Date(`${date}T00:00:00`);
  return Number.isNaN(value.getTime()) ? date : value.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// Best-effort extraction of check-in fields from a free-text transcript.
function parseTranscript(text: string): Partial<{ sleepDuration: number; sleepQuality: number; caffeine: number; exercise: number; mood: number; stress: number; energy: number; waterIntakeLiters: number; notes: string }> {
  const result: any = {};
  const lower = text.toLowerCase();
  const num = (re: RegExp) => { const m = lower.match(re); return m ? Number(m[1]) : undefined; };
  const sleep = num(/sleep(?:ed| duration)?[^0-9]*(\d+(?:\.\d+)?)/);
  if (sleep !== undefined && sleep >= 0 && sleep <= 24) result.sleepDuration = sleep;
  const sq = num(/sleep quality[^0-9]*(\d)/);
  if (sq !== undefined && sq >= 1 && sq <= 5) result.sleepQuality = sq;
  const caf = num(/caffeine[^0-9]*(\d+(?:\.\d+)?)/);
  if (caf !== undefined && caf >= 0 && caf <= 30) result.caffeine = caf;
  const ex = num(/exercise[^0-9]*(\d+)/);
  if (ex !== undefined && ex >= 0 && ex <= 1440) result.exercise = ex;
  const mood = num(/mood[^0-9]*(\d)/);
  if (mood !== undefined && mood >= 1 && mood <= 5) result.mood = mood;
  const stress = num(/stress[^0-9]*(\d)/);
  if (stress !== undefined && stress >= 1 && stress <= 5) result.stress = stress;
  const energy = num(/energy[^0-9]*(\d)/);
  if (energy !== undefined && energy >= 1 && energy <= 5) result.energy = energy;
  const water = num(/water[^0-9]*(\d+(?:\.\d+)?)/);
  if (water !== undefined && water >= 0 && water <= 20) result.waterIntakeLiters = water;
  result.notes = text.trim();
  return result;
}

export default function ContextJournal() {
  const [entries, setEntries] = useState<ContextEntry[]>([]);
  const [date, setDate] = useState(localDate());
  const [sleepDuration, setSleepDuration] = useState('');
  const [sleepQuality, setSleepQuality] = useState(3);
  const [caffeine, setCaffeine] = useState('');
  const [exercise, setExercise] = useState('');
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [waterIntakeLiters, setWaterIntakeLiters] = useState(1.5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'choose' | 'manual' | 'speech'>('choose');
  const [transcript, setTranscript] = useState('');
  const [parsedSummary, setParsedSummary] = useState<string[]>([]);

  async function loadEntries() {
    setLoading(true);
    setError(null);
    try {
      const payload: unknown = await apiRequest('/api/context');
      if (!Array.isArray(payload)) throw new Error('The journal response was not a list.');
      setEntries(payload as ContextEntry[]);
    } catch (cause) {
      setEntries([]);
      setError(cause instanceof Error ? cause.message : 'Could not load your context journal.');
    } finally {
      setLoading(false);
    }
  }

  async function saveEntry(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload = {
      date,
      sleepDuration: sleepDuration === '' ? null : Number(sleepDuration),
      sleepQuality,
      caffeine: caffeine === '' ? null : Number(caffeine),
      exercise: exercise === '' ? null : Number(exercise),
      mood,
      stress,
      energy,
      waterIntakeLiters,
      notes: notes.trim()
    };
    try {
      const result: unknown = await apiRequest(editingId === null ? '/api/context' : `/api/context/${editingId}`, { method: editingId === null ? 'POST' : 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!result || typeof result !== 'object' || !('id' in result) || typeof result.id !== 'number') throw new Error('Could not verify that this entry was saved.');
      setEntries((current) => (editingId === null ? [result as ContextEntry, ...current] : current.map((entry) => entry.id === editingId ? result as ContextEntry : entry)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)));
      setMessage(editingId === null ? 'Context entry saved.' : 'Context entry updated.');
      resetForm();
      setMode('choose');
      setTranscript('');
      setParsedSummary([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this entry. Check the API connection and retry.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setDate(localDate());
    setSleepDuration(''); setSleepQuality(3); setCaffeine(''); setExercise(''); setMood(3); setStress(3); setEnergy(3); setNotes('');
    setWaterIntakeLiters(1.5);
  }

  function editEntry(entry: ContextEntry) {
    setEditingId(entry.id); setDate(entry.date); setSleepDuration(entry.sleepDuration === null ? '' : String(entry.sleepDuration));
    setSleepQuality(entry.sleepQuality); setCaffeine(entry.caffeine === null ? '' : String(entry.caffeine)); setExercise(entry.exercise === null ? '' : String(entry.exercise));
    setMood(entry.mood); setStress(entry.stress); setEnergy(entry.energy); setNotes(entry.notes); setError(null); setMessage(null);
    if (typeof entry.waterIntakeLiters === 'number') setWaterIntakeLiters(entry.waterIntakeLiters);
    setMode('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteEntry(id: number) {
    setDeletingId(id);
    setError(null);
    setMessage(null);
    try {
      const result: unknown = await apiRequest(`/api/context/${id}`, { method: 'DELETE' });
      if (!result || typeof result !== 'object' || !('deleted' in result) || result.deleted !== true) throw new Error('Could not verify that this entry was deleted.');
      setEntries((current) => current.filter((entry) => entry.id !== id));
      if (editingId === id) resetForm();
      setMessage('Entry deleted.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete this entry.');
    } finally {
      setDeletingId(null);
    }
  }

  // Auto-fill form fields from the transcript whenever it changes (speech mode).
  useEffect(() => {
    if (mode !== 'speech' || !transcript.trim()) return;
    const parsed = parseTranscript(transcript);
    const filled: string[] = [];
    if (parsed.sleepDuration !== undefined) { setSleepDuration(String(parsed.sleepDuration)); filled.push(`Sleep duration: ${parsed.sleepDuration}h`); }
    if (parsed.sleepQuality !== undefined) { setSleepQuality(parsed.sleepQuality); filled.push(`Sleep quality: ${parsed.sleepQuality}/5`); }
    if (parsed.caffeine !== undefined) { setCaffeine(String(parsed.caffeine)); filled.push(`Caffeine: ${parsed.caffeine} cups`); }
    if (parsed.exercise !== undefined) { setExercise(String(parsed.exercise)); filled.push(`Exercise: ${parsed.exercise} min`); }
    if (parsed.mood !== undefined) { setMood(parsed.mood); filled.push(`Mood: ${parsed.mood}/5`); }
    if (parsed.stress !== undefined) { setStress(parsed.stress); filled.push(`Stress: ${parsed.stress}/5`); }
    if (parsed.energy !== undefined) { setEnergy(parsed.energy); filled.push(`Energy: ${parsed.energy}/5`); }
    if (parsed.waterIntakeLiters !== undefined) { setWaterIntakeLiters(parsed.waterIntakeLiters); filled.push(`Water: ${parsed.waterIntakeLiters} L`); }
    if (parsed.notes) setNotes(parsed.notes);
    setParsedSummary(filled);
  }, [transcript, mode]);

  useEffect(() => { void loadEntries(); }, []);

  const form = (
    <form className="panel context-form" onSubmit={saveEntry}>
      <div className="panel-head"><div><span className="task-chip"><BookOpen size={14} /> CONTEXT JOURNAL & CHECK-IN</span><h2 id="context-journal-title">{editingId === null ? 'Record your daily context' : 'Update this daily entry'}</h2><p>Log lifestyle factors and revisit how they change over time.</p></div></div>
      {mode === 'speech' && parsedSummary.length > 0 && <div className="context-message success" role="status"><Check size={15} /> Auto-filled from your recording: {parsedSummary.join(' · ')}</div>}
      <div className="context-grid">
        <label className="context-date-label"><span><CalendarDays size={14} /> Entry date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label className="context-number-label"><span><Moon size={14} /> Sleep duration <small>0–24 hours</small></span><div className="input-unit"><input type="number" min="0" max="24" step="0.5" placeholder="Optional" value={sleepDuration} onChange={(event) => setSleepDuration(event.target.value)} /><b>hours</b></div></label>
        <label className="context-number-label"><span><Coffee size={14} /> Caffeine <small>0–30 cups</small></span><div className="input-unit"><input type="number" min="0" max="30" step="0.5" placeholder="Optional" value={caffeine} onChange={(event) => setCaffeine(event.target.value)} /><b>cups</b></div></label>
        <label className="context-number-label"><span><Activity size={14} /> Exercise <small>0–1,440 minutes</small></span><div className="input-unit"><input type="number" min="0" max="1440" step="5" placeholder="Optional" value={exercise} onChange={(event) => setExercise(event.target.value)} /><b>minutes</b></div></label>
        <div className="context-scale"><label htmlFor="context-sleep-quality">Sleep quality <b>{sleepQuality} / 5</b></label><input id="context-sleep-quality" type="range" min="1" max="5" step="1" value={sleepQuality} onChange={(event) => setSleepQuality(Number(event.target.value))} /><div className="range-labels"><span>Poor</span><span>Restful</span></div></div>
        <div className="context-scale"><label htmlFor="context-mood">Mood <b>{mood} / 5</b></label><input id="context-mood" type="range" min="1" max="5" step="1" value={mood} onChange={(event) => setMood(Number(event.target.value))} /><div className="range-labels"><span>Low</span><span>Good</span></div></div>
        <div className="context-scale"><label htmlFor="context-stress">Stress <b>{stress} / 5</b></label><input id="context-stress" type="range" min="1" max="5" step="1" value={stress} onChange={(event) => setStress(Number(event.target.value))} /><div className="range-labels"><span>Low</span><span>High</span></div></div>
        <div className="context-scale"><label htmlFor="context-energy">Energy <b>{energy} / 5</b></label><input id="context-energy" type="range" min="1" max="5" step="1" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} /><div className="range-labels"><span>Low</span><span>High</span></div></div>
        <label className="context-notes"><span>Notes <small>Optional · 500 characters</small></span><div className="voice-input-row"><textarea rows={3} maxLength={500} placeholder="Anything about your day you’d like to remember" value={notes} onChange={(event) => setNotes(event.target.value)} />{mode === 'manual' ? null : <VoiceInputButton label="Dictate notes" onTranscript={(text) => setTranscript((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))} />}</div></label>
      </div>
      <HydrationTracker value={waterIntakeLiters} onChange={setWaterIntakeLiters}/>
      {error && <div className="context-message error" role="alert"><AlertCircle size={15} />{error}</div>}
      {message && <div className="context-message success" role="status"><Check size={15} />{message}</div>}
      <div className="context-form-foot"><small><ShieldCheck size={13} /> Personal context stays in your local NeuroTrack database.</small><div className="context-form-actions">{editingId !== null && <button className="secondary" type="button" disabled={saving} onClick={resetForm}><X size={14}/> Cancel</button>}<button className="primary" type="submit" disabled={saving}>{saving ? <><RefreshCw className="spin" size={14} /> Saving…</> : editingId === null ? 'Save entry' : 'Update entry'}</button></div></div>
    </form>
  );

  if (mode === 'choose') {
    return <section className="context-journal" aria-labelledby="context-journal-title">
      <div className="panel context-form">
        <div className="panel-head"><div><span className="task-chip"><BookOpen size={14} /> CONTEXT JOURNAL & CHECK-IN</span><h2 id="context-journal-title">Record your daily context</h2><p>Log lifestyle factors and revisit how they change over time.</p></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <button type="button" className="primary" style={{ minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => setMode('speech')}>
            <Mic size={28} />
            <strong>Text input</strong>
            <small>Record your day by voice; we auto-fill the fields</small>
          </button>
          <button type="button" className="secondary" style={{ minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => setMode('manual')}>
            <Pencil size={28} />
            <strong>Manual input</strong>
            <small>Enter each field by hand</small>
          </button>
        </div>
      </div>
      <section className="panel context-timeline" aria-labelledby="context-timeline-title">
        <div className="panel-head"><div><h2 id="context-timeline-title">Your context timeline</h2><p>Recent entries, newest first.</p></div><button className="neuronutri-refresh" type="button" onClick={() => void loadEntries()} disabled={loading} aria-label="Refresh context timeline"><RefreshCw size={15} /></button></div>
        {loading ? <div className="context-loading"><i/><i/><i/></div> : entries.length ? <div className="context-entry-list">{entries.map((entry) => <article className="context-entry" key={entry.id}>
          <div className="context-entry-date"><span className="context-entry-dot"/><time dateTime={entry.date}>{dateLabel(entry.date)}</time><button className="context-edit" type="button" disabled={saving || deletingId === entry.id} aria-label={`Edit entry from ${dateLabel(entry.date)}`} onClick={() => editEntry(entry)}><Pencil size={14}/></button><button className="context-delete" type="button" disabled={deletingId === entry.id} aria-label={`Delete entry from ${dateLabel(entry.date)}`} onClick={() => void deleteEntry(entry.id)}>{deletingId === entry.id ? <RefreshCw className="spin" size={14} /> : <Trash2 size={14} />}</button></div>
          <div className="context-entry-metrics"><span>Sleep <b>{entry.sleepDuration === null ? '—' : `${entry.sleepDuration}h`}</b></span><span>Quality <b>{entry.sleepQuality}/5</b></span><span>Caffeine <b>{entry.caffeine === null ? '—' : `${entry.caffeine} cups`}</b></span><span>Exercise <b>{entry.exercise === null ? '—' : `${entry.exercise} min`}</b></span><span>Mood <b>{entry.mood}/5</b></span><span>Stress <b>{entry.stress}/5</b></span><span>Energy <b>{entry.energy}/5</b></span>{typeof entry.waterIntakeLiters === 'number' && <span>Water <b>{entry.waterIntakeLiters.toFixed(2)} L</b></span>}</div>
          {entry.notes && <p className="context-entry-notes">{entry.notes}</p>}
        </article>)}</div> : <div className="context-empty"><span><BookOpen size={20} /></span><b>No context entries yet</b><small>Your saved notes and daily ratings will appear here.</small></div>}
        <small className="context-disclaimer">These self-reported notes are for personal reflection and are not a medical record or diagnosis.</small>
      </section>
    </section>;
  }

  if (mode === 'speech') {
    return <section className="context-journal" aria-labelledby="context-journal-title">
      <div className="panel context-form">
        <div className="panel-head"><div><span className="task-chip"><BookOpen size={14} /> CONTEXT JOURNAL & CHECK-IN</span><h2 id="context-journal-title">Record by voice</h2><p>Tap dictate, speak your day, and we'll auto-fill the fields.</p></div><button className="secondary" type="button" onClick={() => { setMode('choose'); setTranscript(''); setParsedSummary([]); resetForm(); }}><X size={14}/> Back</button></div>
        <div style={{ margin: '12px 0' }}>
          <VoiceInputButton label="Dictate" onTranscript={(text) => setTranscript((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))} />
        </div>
        <label className="context-notes"><span>Transcription <small>Review & edit</small></span><textarea rows={4} maxLength={2000} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Your recording will appear here…" /></label>
        {parsedSummary.length > 0 && <div className="context-message success" role="status"><Check size={15} /> Auto-filled: {parsedSummary.join(' · ')}</div>}
        {form}
      </div>
      <section className="panel context-timeline" aria-labelledby="context-timeline-title">
        <div className="panel-head"><div><h2 id="context-timeline-title">Your context timeline</h2><p>Recent entries, newest first.</p></div></div>
        {loading ? <div className="context-loading"><i/><i/><i/></div> : entries.length ? <div className="context-entry-list">{entries.map((entry) => <article className="context-entry" key={entry.id}><div className="context-entry-date"><span className="context-entry-dot"/><time dateTime={entry.date}>{dateLabel(entry.date)}</time></div><div className="context-entry-metrics"><span>Sleep <b>{entry.sleepDuration === null ? '—' : `${entry.sleepDuration}h`}</b></span><span>Mood <b>{entry.mood}/5</b></span></div>{entry.notes && <p className="context-entry-notes">{entry.notes}</p>}</article>)}</div> : <div className="context-empty"><span><BookOpen size={20} /></span><b>No context entries yet</b></div>}
      </section>
    </section>;
  }

  // manual mode
  return <section className="context-journal" aria-labelledby="context-journal-title">
    <div style={{ marginBottom: 12 }}><button className="secondary" type="button" onClick={() => setMode('choose')}><X size={14}/> Back</button></div>
    {form}
    <section className="panel context-timeline" aria-labelledby="context-timeline-title">
      <div className="panel-head"><div><h2 id="context-timeline-title">Your context timeline</h2><p>Recent entries, newest first.</p></div><button className="neuronutri-refresh" type="button" onClick={() => void loadEntries()} disabled={loading} aria-label="Refresh context timeline"><RefreshCw size={15} /></button></div>
      {loading ? <div className="context-loading"><i/><i/><i/></div> : entries.length ? <div className="context-entry-list">{entries.map((entry) => <article className="context-entry" key={entry.id}>
        <div className="context-entry-date"><span className="context-entry-dot"/><time dateTime={entry.date}>{dateLabel(entry.date)}</time><button className="context-edit" type="button" disabled={saving || deletingId === entry.id} aria-label={`Edit entry from ${dateLabel(entry.date)}`} onClick={() => editEntry(entry)}><Pencil size={14}/></button><button className="context-delete" type="button" disabled={deletingId === entry.id} aria-label={`Delete entry from ${dateLabel(entry.date)}`} onClick={() => void deleteEntry(entry.id)}>{deletingId === entry.id ? <RefreshCw className="spin" size={14} /> : <Trash2 size={14} />}</button></div>
        <div className="context-entry-metrics"><span>Sleep <b>{entry.sleepDuration === null ? '—' : `${entry.sleepDuration}h`}</b></span><span>Quality <b>{entry.sleepQuality}/5</b></span><span>Caffeine <b>{entry.caffeine === null ? '—' : `${entry.caffeine} cups`}</b></span><span>Exercise <b>{entry.exercise === null ? '—' : `${entry.exercise} min`}</b></span><span>Mood <b>{entry.mood}/5</b></span><span>Stress <b>{entry.stress}/5</b></span><span>Energy <b>{entry.energy}/5</b></span>{typeof waterIntakeLiters === 'number' && <span>Water <b>{waterIntakeLiters.toFixed(2)} L</b></span>}</div>
        {entry.notes && <p className="context-entry-notes">{entry.notes}</p>}
      </article>)}</div> : <div className="context-empty"><span><BookOpen size={20} /></span><b>No context entries yet</b><small>Your saved notes and daily ratings will appear here.</small></div>}
      <small className="context-disclaimer">These self-reported notes are for personal reflection and are not a medical record or diagnosis.</small>
    </section>
  </section>;
}