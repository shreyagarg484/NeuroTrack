import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Clock3, Filter, RefreshCw } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiRequest } from '../services/api';

type Trial = { trialType?: string; correct?: boolean; responseMs?: number | null };
type Session = {
  id: number; createdAt: string; n: number | null; trials: number; accuracy: number; medianRt: number;
  misses: number; isSynthetic?: boolean | number; taskType?: string;
  metrics?: Record<string, unknown>; metricsJson?: string; details?: Trial[]; detailsJson?: string;
};
type TaskFilter = 'all' | 'n-back' | 'simple-reaction' | 'choice-reaction' | 'stroop' | 'go-no-go' | 'digit-span' | 'corsi-spatial' | 'visual-search' | 'time-perception' | 'trail-making';
type Range = '7' | '30' | 'all';
type Series = { key: string; name: string; color: string };
type ChartPlan = { title: string; description: string; data: Record<string, string | number>[]; series: Series[]; domain?: [number, number] };

const taskLabels: Record<TaskFilter, string> = {
  all: 'All tasks', 'n-back': 'N-back', 'simple-reaction': 'Reaction time', 'choice-reaction': 'Choice reaction',
  stroop: 'Stroop', 'go-no-go': 'Go / No-Go', 'digit-span': 'Digit Span', 'corsi-spatial': 'Corsi Spatial',
  'visual-search': 'Visual Search', 'time-perception': 'Time Perception', 'trail-making': 'Trail Making'
};
const isDev = import.meta.env.DEV;
const mockAllowed = isDev || import.meta.env.VITE_ANALYTICS_MOCK_DATA === 'true';

function taskFor(session: Session): TaskFilter | 'other' {
  if (!session.taskType) return 'n-back';
  return session.taskType in taskLabels ? session.taskType as TaskFilter : 'other';
}
function objectFromJson(value?: string): Record<string, unknown> {
  if (!value) return {};
  try { const parsed: unknown = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}; }
  catch { return {}; }
}
function metrics(session: Session) { return session.metrics ?? objectFromJson(session.metricsJson); }
function trials(session: Session): Trial[] {
  if (Array.isArray(session.details)) return session.details;
  const parsed = session.detailsJson;
  if (!parsed) return [];
  try { const result: unknown = JSON.parse(parsed); return Array.isArray(result) ? result as Trial[] : []; } catch { return []; }
}
function num(value: unknown, fallback = 0) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
function dateText(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }

function makePreviewSessions(): Session[] {
  const tasks: TaskFilter[] = ['n-back', 'simple-reaction', 'choice-reaction', 'stroop', 'go-no-go', 'digit-span', 'corsi-spatial', 'visual-search', 'time-perception', 'trail-making'];
  return tasks.flatMap((task, taskIndex) => Array.from({ length: 6 }, (_, index) => {
    const daysAgo = (5 - index) * 2 + (taskIndex % 2);
    const createdAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
    const accuracy = Math.min(98, 66 + index * 4 + (taskIndex % 3) * 2);
    const medianRt = Math.max(280, 780 - index * 34 + taskIndex * 11);
    const id = taskIndex * 10 + index + 1;
    const base: Session = { id, createdAt, n: task === 'n-back' ? 2 : null, trials: 20, accuracy, medianRt, misses: Math.round((100 - accuracy) / 5), isSynthetic: true, taskType: task === 'n-back' ? undefined : task };
    const details: Trial[] = Array.from({ length: 10 }, (_, trialIndex) => ({
      trialType: task === 'stroop' ? (trialIndex % 2 ? 'incongruent' : 'congruent') : task === 'go-no-go' ? (trialIndex % 4 ? 'go' : 'no-go') : task,
      correct: trialIndex < Math.round(accuracy / 10),
      responseMs: Math.max(230, medianRt + ((trialIndex % 5) - 2) * (task === 'simple-reaction' ? 47 : 26))
    }));
    let metricValues: Record<string, unknown> = {};
    if (task === 'simple-reaction') metricValues = { averageRtMs: medianRt + 12, fastCount: index + 1 };
    if (task === 'go-no-go') metricValues = { commissionErrors: Math.max(0, 5 - index), omissions: Math.max(0, 4 - index), correctResponses: 17 + index };
    if (task === 'digit-span') metricValues = { longestSpan: 4 + Math.min(4, index) };
    if (task === 'corsi-spatial') metricValues = { maxSequenceLength: 3 + Math.min(4, index) };
    if (task === 'visual-search') metricValues = { correctTargets: 5 + Math.min(5, index), errors: Math.max(0, 5 - index) };
    if (task === 'trail-making') metricValues = { completionTimeMs: medianRt * 7, errors: Math.max(0, 4 - index) };
    if (task === 'time-perception') metricValues = { targetIntervalMs: 10_000, estimatedIntervalMs: 8_800 + index * 230, absoluteDeviationMs: Math.abs(10_000 - (8_800 + index * 230)) };
    return { ...base, metrics: metricValues, details };
  }));
}
const previewSessions = makePreviewSessions();

function getChartPlans(rows: Session[], task: TaskFilter): ChartPlan[] {
  const generic = rows.map((row) => ({ day: dateText(row.createdAt), accuracy: row.accuracy, medianRt: row.medianRt }));
  const line = (key: string, name: string, color: string): Series => ({ key, name, color });
  const plan = (title: string, description: string, data: Record<string, string | number>[], series: Series[], domain?: [number, number]): ChartPlan => ({ title, description, data, series, domain });
  if (task === 'stroop') {
    const data = rows.map((row) => {
      const ts = trials(row);
      const group = (condition: string) => ts.filter((trial) => trial.trialType === condition);
      const congruent = group('congruent'), conflict = group('incongruent');
      const med = (set: Trial[]) => { const values = set.map((trial) => trial.responseMs).filter((value): value is number => typeof value === 'number').sort((a, b) => a - b); return values.length ? values[Math.floor(values.length / 2)] : 0; };
      return { day: dateText(row.createdAt), congruentAccuracy: congruent.length ? Math.round(congruent.filter((item) => item.correct).length / congruent.length * 100) : 0, conflictingAccuracy: conflict.length ? Math.round(conflict.filter((item) => item.correct).length / conflict.length * 100) : 0, congruentRt: med(congruent), conflictingRt: med(conflict) };
    });
    return [plan('Stroop accuracy by condition', 'Accuracy when word and ink match versus conflict.', data, [line('congruentAccuracy', 'Congruent accuracy (%)', '#06B6D4'), line('conflictingAccuracy', 'Conflicting accuracy (%)', '#8B5CF6')], [0, 100]), plan('Stroop response time by condition', 'Median trial response time in milliseconds.', data, [line('congruentRt', 'Congruent (ms)', '#10B981'), line('conflictingRt', 'Conflicting (ms)', '#8B5CF6')])];
  }
  if (task === 'simple-reaction') {
    const data = rows.map((row) => { const values = trials(row).map((trial) => trial.responseMs).filter((value): value is number => typeof value === 'number'); const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : row.medianRt; const variability = values.length ? Math.round(Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length)) : 0; return { day: dateText(row.createdAt), medianRt: row.medianRt, variability }; });
    return [plan('Reaction time and variability', 'Median response time and within-session standard deviation (ms).', data, [line('medianRt', 'Median (ms)', '#06B6D4'), line('variability', 'Variability (SD ms)', '#8B5CF6')])];
  }
  if (task === 'go-no-go') {
    const data = rows.map((row) => { const m = metrics(row); return { day: dateText(row.createdAt), commissionErrors: num(m.commissionErrors), omissions: num(m.omissions), medianRt: row.medianRt }; });
    return [plan('Inhibition errors', 'Commission errors and missed Go targets per session.', data, [line('commissionErrors', 'Commission errors', '#8B5CF6'), line('omissions', 'Omissions', '#06B6D4')]), plan('Go response time', 'Median correct/recorded response time (ms).', data, [line('medianRt', 'Median response (ms)', '#10B981')])];
  }
  if (task === 'digit-span' || task === 'corsi-spatial') {
    const key = task === 'digit-span' ? 'longestSpan' : 'maxSequenceLength'; const name = task === 'digit-span' ? 'Longest correct span' : 'Maximum spatial sequence';
    const data = rows.map((row) => ({ day: dateText(row.createdAt), span: num(metrics(row)[key]), accuracy: row.accuracy }));
    return [plan(name, 'Maximum sequence length recorded per session.', data, [line('span', 'Span length', '#8B5CF6')]), plan('Session accuracy', 'Correct responses as a percentage.', data, [line('accuracy', 'Accuracy (%)', '#06B6D4')], [0, 100])];
  }
  if (task === 'visual-search') {
    const data = rows.map((row) => { const m = metrics(row); return { day: dateText(row.createdAt), correctTargets: num(m.correctTargets), errors: num(m.errors), medianRt: row.medianRt }; });
    return [plan('Visual search outcomes', 'Correct targets and recorded search errors.', data, [line('correctTargets', 'Correct targets', '#06B6D4'), line('errors', 'Errors', '#8B5CF6')]), plan('Search response time', 'Median response time (ms).', data, [line('medianRt', 'Median (ms)', '#10B981')])];
  }
  if (task === 'trail-making') {
    const data = rows.map((row) => { const m = metrics(row); return { day: dateText(row.createdAt), completionTime: num(m.completionTimeMs, row.medianRt), errors: num(m.errors) }; });
    return [plan('Trail Making completion time', 'Total completion duration per session (ms).', data, [line('completionTime', 'Completion time (ms)', '#06B6D4')]), plan('Trail Making errors', 'Incorrect sequence selections.', data, [line('errors', 'Errors', '#8B5CF6')])];
  }
  if (task === 'time-perception') {
    const data = rows.map((row) => { const m = metrics(row); return { day: dateText(row.createdAt), estimated: num(m.estimatedIntervalMs), target: num(m.targetIntervalMs, 10_000), deviation: num(m.absoluteDeviationMs) }; });
    return [plan('Time estimate versus target', 'Estimated duration compared with the 10-second target (ms).', data, [line('estimated', 'Estimated (ms)', '#8B5CF6'), line('target', 'Target (ms)', '#06B6D4')]), plan('Absolute timing deviation', 'Distance from target interval (ms).', data, [line('deviation', 'Deviation (ms)', '#10B981')])];
  }
  if (task === 'n-back' || task === 'choice-reaction') return [plan('Accuracy over time', 'Correct responses per session.', generic, [line('accuracy', 'Accuracy (%)', '#8B5CF6')], [0, 100]), plan('Response time over time', 'Median response time per session (ms).', generic, [line('medianRt', 'Median response (ms)', '#06B6D4')])];
  return [plan('Accuracy over time', 'Correct responses per session.', generic, [line('accuracy', 'Accuracy (%)', '#8B5CF6')], [0, 100]), plan('Response time over time', 'Median response time per session (ms).', generic, [line('medianRt', 'Median response (ms)', '#06B6D4')])];
}

function ChartCard({ chart }: { chart: ChartPlan }) {
  return <div className="panel analytics-chart-card"><div className="panel-head"><div><h2>{chart.title}</h2><p>{chart.description} · N = {chart.data.length}</p></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart.data}><CartesianGrid stroke="#2e2744" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }}/><YAxis domain={chart.domain} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }}/><Tooltip contentStyle={{ background: '#161224', border: '1px solid #2E2744', borderRadius: 8, color: '#F9FAFB' }}/>{chart.series.map((series) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.name} stroke={series.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls/>)}</LineChart></ResponsiveContainer></div></div>;
}

export default function Analytics() {
  const envMock = import.meta.env.VITE_ANALYTICS_MOCK_DATA === 'true';
  const [sessions, setSessions] = useState<Session[]>([]);
  const [task, setTask] = useState<TaskFilter>('all');
  const [range, setRange] = useState<Range>('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(envMock);
  const [usingMock, setUsingMock] = useState(false);

  async function load() {
    setLoading(true); setError('');
    if (previewMode) { setSessions(previewSessions); setUsingMock(true); setLoading(false); return; }
    try {
      const rows = await apiRequest<unknown>('/api/sessions');
      if (!Array.isArray(rows)) throw new Error('The API returned an invalid session list.');
      setSessions(rows as Session[]); setUsingMock(false);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : 'Could not load analytics sessions.';
      if (mockAllowed) { setSessions(previewSessions); setUsingMock(true); setError(`${reason} Showing clearly labeled preview samples.`); }
      else { setSessions([]); setUsingMock(false); setError(reason); }
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [previewMode]);

  const filtered = useMemo(() => {
    const cutoff = range === 'all' ? 0 : Date.now() - Number(range) * 86_400_000;
    return sessions.filter((row) => {
      const type = taskFor(row);
      return (task === 'all' || type === task) && Date.parse(row.createdAt) >= cutoff && (usingMock || !Boolean(row.isSynthetic));
    }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [sessions, task, range, usingMock]);
  const accuracy = filtered.length ? Math.round(filtered.reduce((sum, row) => sum + row.accuracy, 0) / filtered.length) : 0;
  const rtValues = filtered.map((row) => row.medianRt).filter(Number.isFinite).sort((a, b) => a - b);
  const medianRt = rtValues.length ? Math.round(rtValues[Math.floor((rtValues.length - 1) / 2)]) : 0;
  const plans = useMemo(() => getChartPlans(filtered, task), [filtered, task]);

  return <section className="analytics-violet" aria-label="Interactive cognitive performance analytics">
    <div className="analytics-toolbar panel"><div><span className="eyebrow"><Filter size={13}/> INTERACTIVE FILTERS</span><h2>Explore your personal session trends</h2><p>{usingMock ? 'Preview samples are synthetic and are not personal records.' : 'Only non-synthetic sessions are shown; trends are descriptive, not diagnostic.'}</p></div><button className="neuronutri-refresh" type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh analytics"><RefreshCw size={15}/></button><div className="analytics-filters"><label>Task<select value={task} onChange={(event) => setTask(event.target.value as TaskFilter)}>{(Object.keys(taskLabels) as TaskFilter[]).map((id) => <option key={id} value={id}>{taskLabels[id]}</option>)}</select></label><label>Date range<select value={range} onChange={(event) => setRange(event.target.value as Range)}><option value="7">7 Days</option><option value="30">30 Days</option><option value="all">All Time</option></select></label>{mockAllowed && <button className={`analytics-preview-toggle ${previewMode ? 'active' : ''}`} type="button" aria-pressed={previewMode} onClick={() => setPreviewMode((value) => !value)}>{previewMode ? 'Preview data: on' : 'Preview data: off'}</button>}</div></div>
    <div className="analytics-violet-stats"><div className="panel"><span><Activity size={15}/> {usingMock ? 'PREVIEW SESSIONS' : 'PERSONAL SESSIONS'}</span><b>N = {filtered.length}</b><small>{taskLabels[task]} · {range === 'all' ? 'all recorded dates' : `last ${range} days`}</small></div><div className="panel"><span><BarChart3 size={15}/> MEAN ACCURACY</span><b>{filtered.length ? `${accuracy}%` : '—'}</b><small>Across filtered sessions</small></div><div className="panel"><span><Clock3 size={15}/> MEDIAN RESPONSE</span><b>{filtered.length ? `${medianRt} ms` : '—'}</b><small>Across filtered sessions</small></div></div>
    {error && <div className={usingMock ? 'analytics-preview-note' : 'scheduler-error'} role={usingMock ? 'status' : 'alert'}>{error}</div>}
    {loading ? <div className="panel analytics-empty">Loading session records…</div> : filtered.length ? <>
      {usingMock && <div className="analytics-preview-banner">Synthetic preview data · generated only for chart layout and interaction testing.</div>}
      <div className="analytics-chart-grid">{plans.map((chart) => <ChartCard key={chart.title} chart={chart}/>)}</div>
      <div className="panel analytics-table"><div className="panel-head"><div><h2>{usingMock ? 'Preview sample details' : 'Filtered session details'}</h2><p>{usingMock ? 'These records are synthetic examples.' : 'Personal session samples are listed by date.'}</p></div></div>{filtered.slice().reverse().map((row) => <div className="analytics-session-row" key={`${row.taskType || row.n}-${row.id}-${row.createdAt}`}><time>{new Date(row.createdAt).toLocaleString()}</time><b>{taskLabels[taskFor(row) as TaskFilter] || 'Other'}</b><span>{row.accuracy}% accuracy</span><span>{row.medianRt} ms median</span></div>)}</div>
    </> : <div className="panel analytics-empty"><span className="empty-icon"><BarChart3 size={23}/></span><b>No matching {usingMock ? 'preview' : 'personal'} sessions</b><small>Try a wider date range, select another task, or complete {task === 'all' ? 'a cognitive task' : taskLabels[task]}.{!usingMock && !mockAllowed ? ' Enable VITE_ANALYTICS_MOCK_DATA=true to preview synthetic chart data.' : ''}</small></div>}
  </section>;
}
