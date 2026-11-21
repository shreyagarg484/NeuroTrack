import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  FlaskConical,
  Gauge,
  Home,
  Layers3,
  LineChart as LineChartIcon,
  ListTodo,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Play,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  UsersRound,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import Sidebar from './components/Sidebar';
import MetricCard from './components/ui/MetricCard';
import NeuralGraphic from './components/ui/NeuralGraphic';
import ActivityRow from './components/ui/ActivityRow';
import AuthScreen from './components/auth/AuthScreen';
import OnboardingScreen from './components/onboarding/OnboardingScreen';

import Analytics from './components/Analytics';
import LearningHub from './components/LearningHub';
import NeuroNutri from './components/NeuroNutri';
import NeuroNutriCard from './components/NeuroNutriCard';
import TaskScheduler from './components/TaskScheduler';
import ContextJournal from './components/ContextJournal';
import FocusHabitTracker, { FocusHabitInsights } from './components/FocusHabitTracker';
import HydrationTracker from './components/HydrationTracker';
import AIInsights from './components/AIInsights';
import {
  NBackTask,
  ReactionTest,
  ChoiceReactionTask,
  StroopTask,
  GoNoGoTask,
  DigitSpanTask,
  CorsiSpatialTask,
  VisualSearchTask,
  TimePerceptionTask,
  TrailMakingTask,
  TaskPurposeCard,
} from './components/tasks';
import { apiRequest } from './services/api';

type Session = {
  id: number;
  createdAt: string;
  n: number | null;
  trials: number;
  accuracy: number;
  medianRt: number;
  misses: number;
  isSynthetic: boolean | number;
  taskType?: string;
};

const pageLabels: Record<string, string> = {
  Overview: 'Overview Dashboard',
  'Testing lab': 'Cognitive Lab',
  'Focus & Habits': 'Focus & Deep Work Tracker',
  'Context Journal & Check-in': 'Context Journal & Hydration Tracker',
  Analytics: 'Analytics & Trends',
  Insights: 'Personal Insights Engine',
  NeuroNutri: 'NeuroNutri Fueling',
  Learn: 'Learning & Science Hub',
  'Privacy & settings': 'Data & Privacy Center',
  Settings: 'Profile & Settings',
  'Reaction Test': 'Reaction Time',
  'Stroop Task': 'Stroop Task',
  'Choice Reaction': 'Choice Reaction',
  'Go / No-Go': 'Go / No-Go Task',
  'Digit Span': 'Digit Span Task',
  'Corsi Spatial': 'Corsi Spatial Task',
  'Visual Search': 'Visual Search Task',
  'Time Perception': 'Time Perception Task',
  'Trail Making': 'Trail Making Task',
};

type Research = {
  topic: string;
  explanation: string;
  processes: string[];
  evidence: string;
  sources: { title: string; url: string }[];
  limitations: string;
};

const fallback: Research = {
  topic: 'Working memory and the N-back task',
  explanation:
    'Working memory is the ability to briefly hold information in mind and use it. In an N-back task, you compare each new item with one seen a set number of steps earlier.',
  processes: [
    'Maintaining recent information',
    'Updating what is currently relevant',
    'Selective attention and response control',
  ],
  evidence:
    'N-back tasks are commonly used in cognitive science to study working-memory demands. Performance reflects several interacting skills and task conditions.',
  sources: [
    {
      title: 'Working memory: Theories, models, and controversies — Annual Review of Psychology',
      url: 'https://doi.org/10.1146/annurev-psych-010814-015031',
    },
    {
      title: 'Working memory — Nature Reviews Neuroscience',
      url: 'https://doi.org/10.1038/nrn1201',
    },
  ],
  limitations:
    'A short browser task is affected by practice, sleep, device latency, motivation, and task settings. It is not a diagnosis or a standalone clinical assessment.',
};

const testLibrary = [
  { id: 'n-back', name: 'N-back', description: 'Working memory and continuous updating.', duration: '2 min', page: 'Testing lab', tag: 'Memory' },
  { id: 'simple-reaction', name: 'Simple Reaction Time', description: 'Respond when the visual cue appears.', duration: '1 min', page: 'Reaction Test', tag: 'Speed' },
  { id: 'choice-reaction', name: 'Choice Reaction', description: 'Choose the matching response among four targets.', duration: '2 min', page: 'Choice Reaction', tag: 'Executive' },
  { id: 'stroop', name: 'Stroop Task', description: 'Name the ink color while ignoring the word.', duration: '2 min', page: 'Stroop Task', tag: 'Attention' },
  { id: 'go-no-go', name: 'Go / No-Go', description: 'Respond to Go cues and inhibit No-Go responses.', duration: '2 min', page: 'Go / No-Go', tag: 'Inhibition' },
  { id: 'digit-span', name: 'Digit Span', description: 'Recall number sequences forward and backward.', duration: '3 min', page: 'Digit Span', tag: 'Memory' },
  { id: 'corsi-spatial', name: 'Corsi Spatial', description: 'Repeat a sequence of highlighted locations.', duration: '3 min', page: 'Corsi Spatial', tag: 'Spatial' },
  { id: 'visual-search', name: 'Visual Search', description: 'Locate a target in a grid of distractors.', duration: '2 min', page: 'Visual Search', tag: 'Attention' },
  { id: 'time-perception', name: 'Time Perception', description: 'Estimate a 10-second interval without a clock.', duration: '1 min', page: 'Time Perception', tag: 'Perception' },
  { id: 'trail-making', name: 'Trail Making', description: 'Connect numbered targets in ascending order.', duration: '1 min', page: 'Trail Making', tag: 'Speed' },
] as const;

function median(nums: number[]) {
  if (!nums.length) return 0;
  const a = [...nums].sort((x, y) => x - y),
    m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

const focusBars = [52, 68, 57, 74, 69, 82, 76, 88, 72, 91, 84, 96];
const weekBars = [61, 74, 58, 82, 76, 90, 86];

export default function App() {
  const [stage, setStage] = useState<'app' | 'auth' | 'onboarding'>('app');
  const [page, setPage] = useState('Overview');
  const [userName, setUserName] = useState(() => localStorage.getItem('neurotrack_user') || 'Alex Morgan');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [, setSessionsError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [n, setN] = useState(2);
  const [total, setTotal] = useState(20);
  const [trial, setTrial] = useState(0);
  const [stim, setStim] = useState('');
  const [results, setResults] = useState<{ correct: boolean; rt: number | null; match: boolean }[]>([]);
  const [ready, setReady] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState<Research | null>(null);
  const [researchMode, setResearchMode] = useState<'tinyfish' | 'fallback'>('fallback');
  const [tinyFishConfigured, setTinyFishConfigured] = useState<boolean | null>(null);
  const [tinyFishConfigChecked, setTinyFishConfigChecked] = useState(false);
  const [message, setMessage] = useState('');
  const [mobile, setMobile] = useState(false);
  const [labFilter, setLabFilter] = useState<'all' | 'recommended' | 'completed'>('all');
  const [insightNoteVisible, setInsightNoteVisible] = useState(true);

  // Settings State
  const [notifications, setNotifications] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const startRef = useRef(0);
  const seq = useRef<string[]>([]);
  const practiceSeq = useRef<string[]>([]);
  const answers = useRef<typeof results>([]);
  const nextTimer = useRef<number | undefined>(undefined);
  const timerRemaining = useRef(2600);
  const deadline = useRef(0);

  async function refresh() {
    try {
      const data = await apiRequest<unknown>('/api/sessions');
      if (!Array.isArray(data)) throw new Error('The API returned an invalid session list.');
      setSessions(data as Session[]);
      setSessionsError(null);
      return data as Session[];
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not load saved sessions. Check the API server and frontend proxy.';
      setSessions([]);
      setSessionsError(message);
      return [];
    }
  }

  useEffect(() => {
    void refresh();
    void apiRequest<{ tinyfishConfigured?: boolean }>('/api/config')
      .then((data) => {
        if (typeof data?.tinyfishConfigured === 'boolean') setTinyFishConfigured(data.tinyfishConfigured);
      })
      .catch(() => {})
      .finally(() => setTinyFishConfigChecked(true));
    return () => window.clearTimeout(nextTimer.current);
  }, []);

  useEffect(() => {
    if (page === 'Analytics') void refresh().catch(() => {});
  }, [page]);

  const actualSessions = useMemo(() => sessions.filter((session) => !Boolean(session.isSynthetic)), [sessions]);
  const nbackSessions = useMemo(() => sessions.filter((session) => !session.taskType), [sessions]);
  const latest = nbackSessions[0] || sessions[0];
  const trend = useMemo(
    () =>
      nbackSessions
        .slice(0, 8)
        .reverse()
        .map((s) => ({
          day: new Date(s.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
          accuracy: s.accuracy,
          rt: s.medianRt,
        })),
    [nbackSessions]
  );

  const percent = results.length ? Math.round((results.filter((x) => x.correct).length / results.length) * 100) : 0;
  const progressPct = practiceMode
    ? Math.round((trial / practiceSeq.current.length) * 100)
    : Math.round((Math.min(trial, total) / total) * 100);

  function present(index: number) {
    if (index >= total) {
      finish();
      return;
    }
    setTrial(index + 1);
    setStim(seq.current[index]);
    startRef.current = performance.now();
    setReady(true);
    timerRemaining.current = 2600;
    deadline.current = performance.now() + 2600;
    nextTimer.current = window.setTimeout(() => {
      if (answers.current.length === index) {
        answers.current = [
          ...answers.current,
          { correct: false, rt: null, match: index >= n && seq.current[index] === seq.current[index - n] },
        ];
        setResults(answers.current);
        present(index + 1);
      }
    }, 2600);
  }

  function presentPractice(index: number) {
    if (index >= practiceSeq.current.length) {
      setPracticeMode(false);
      setTrial(0);
      present(0);
      return;
    }
    setTrial(index + 1);
    setStim(practiceSeq.current[index]);
    startRef.current = performance.now();
    setReady(true);
    timerRemaining.current = 2600;
    deadline.current = performance.now() + 2600;
    nextTimer.current = window.setTimeout(() => presentPractice(index + 1), 2600);
  }

  function startCountdown(value: number) {
    setCountdown(value);
    if (value <= 0) {
      setCountdown(0);
      setPracticeMode(true);
      presentPractice(0);
      return;
    }
    nextTimer.current = window.setTimeout(() => startCountdown(value - 1), 700);
  }

  function begin() {
    const symbols = ['A', 'B', 'C', 'D', 'E', 'F'];
    seq.current = Array.from({ length: total }, () => symbols[Math.floor(Math.random() * symbols.length)]);
    practiceSeq.current = n === 1 ? ['A', 'A', 'B', 'C'] : n === 2 ? ['A', 'B', 'C', 'A'] : ['A', 'B', 'C', 'D', 'A'];
    answers.current = [];
    setResults([]);
    setTrial(0);
    setReady(false);
    setPaused(false);
    setRunning(true);
    startCountdown(3);
  }

  function pauseTask() {
    if (!running || paused) return;
    window.clearTimeout(nextTimer.current);
    if (ready) timerRemaining.current = Math.max(0, deadline.current - performance.now());
    setPaused(true);
  }

  function resumeTask() {
    if (!paused) return;
    setPaused(false);
    if (countdown > 0) {
      startCountdown(countdown);
      return;
    }
    if (ready) {
      deadline.current = performance.now() + timerRemaining.current;
      nextTimer.current = window.setTimeout(() => {
        if (practiceMode) presentPractice(trial);
        else {
          const index = trial - 1;
          if (answers.current.length === index) {
            answers.current = [
              ...answers.current,
              { correct: false, rt: null, match: index >= n && seq.current[index] === seq.current[index - n] },
            ];
            setResults(answers.current);
            present(index + 1);
          }
        }
      }, timerRemaining.current);
    }
  }

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) pauseTask();
    };
    const onBlur = () => pauseTask();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
    };
  }, [running, paused, ready, countdown, practiceMode, trial]);

  function answer(choice: boolean) {
    if (!running || paused || !ready) return;
    window.clearTimeout(nextTimer.current);
    setReady(false);
    if (practiceMode) {
      window.setTimeout(() => presentPractice(trial), 450);
      return;
    }
    const rt = Math.round(performance.now() - startRef.current),
      match = trial - 1 >= n && seq.current[trial - 1] === seq.current[trial - 1 - n];
    answers.current = [...answers.current, { correct: choice === match, rt, match }];
    setResults(answers.current);
    window.setTimeout(() => present(trial), 450);
  }

  async function finish() {
    setRunning(false);
    setPaused(false);
    setReady(false);
    const r = answers.current;
    const valid = r.filter((x) => x.rt !== null).map((x) => x.rt as number);
    const body = {
      n,
      trials: total,
      accuracy: r.length ? Math.round((r.filter((x) => x.correct).length / r.length) * 100) : 0,
      medianRt: Math.round(median(valid)),
      misses: r.filter((x) => x.rt === null).length,
      trialResults: r.map((x) => ({
        trialType: x.match ? 'match' : 'no-match',
        correct: x.correct,
        responseMs: x.rt,
      })),
    };
    try {
      await apiRequest<{ saved?: boolean }>('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      await refresh();
      setMessage('Session saved to this device.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save session. Check that the API server is running.');
    }
  }

  function exitTask() {
    window.clearTimeout(nextTimer.current);
    setRunning(false);
    setPaused(false);
    setReady(false);
    setCountdown(0);
    setPracticeMode(false);
  }

  async function explore() {
    setLoading(true);
    setMessage('');
    try {
      const data = await apiRequest<{ research?: Research; mode?: string }>('/api/research', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(150_000),
        body: JSON.stringify({ task: 'nback', topic: 'working memory' }),
      });
      if (!data.research || !Array.isArray(data.research.sources) || data.research.sources.length === 0)
        throw new Error('Research returned no usable sources. Showing the built-in educational overview.');
      setResearch(data.research);
      setResearchMode(data.mode === 'tinyfish' ? 'tinyfish' : 'fallback');
      setMessage(
        data.mode === 'fallback'
          ? 'Showing built-in educational overview. Add TINYFISH_API_KEY to server/.env for live research.'
          : 'Research completed with TinyFish.'
      );
    } catch (error) {
      setResearch(fallback);
      setResearchMode('fallback');
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
      setMessage(
        `${timedOut ? 'Research request timed out.' : error instanceof Error ? error.message : 'Research service unavailable.'} Showing the built-in educational overview.`
      );
    } finally {
      setLoading(false);
    }
  }

  async function exportData() {
    try {
      const data = await apiRequest<Record<string, unknown>>('/api/export');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = 'neurotrack-export.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not export data.');
    }
  }

  async function clearData() {
    if (
      !confirm(
        'Delete all locally stored sessions, check-ins, context entries, focus habit logs, scheduled tasks, and other tasks? This cannot be undone.'
      )
    )
      return;
    try {
      await apiRequest('/api/data', { method: 'DELETE' });
      setSessions([]);
      setMessage('All local data deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not clear data.');
    }
  }

  async function resetDemo() {
    if (!confirm('Replace local records with four clearly labeled synthetic demo sessions?')) return;
    try {
      await apiRequest('/api/demo/reset', { method: 'POST' });
      await refresh();
      setMessage('Synthetic demo data restored.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not restore demo data.');
    }
  }

  const rt = useMemo(() => latest?.medianRt || 0, [latest]);
  const averageFocusScore = useMemo(() => {
    if (!sessions.length) return 82;
    const scores = sessions.map((s) => s.accuracy).filter((acc) => typeof acc === 'number');
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 82;
  }, [sessions]);

  // Stage: Auth Screen
  if (stage === 'auth') {
    return (
      <AuthScreen
        onSignIn={(name) => {
          if (name) {
            setUserName(name);
            localStorage.setItem('neurotrack_user', name);
          }
          setStage('app');
        }}
        onStartSetup={() => setStage('onboarding')}
      />
    );
  }

  // Stage: Onboarding Screen
  if (stage === 'onboarding') {
    return (
      <OnboardingScreen
        onBack={() => setStage('auth')}
        onFinish={(prefs) => {
          localStorage.setItem('neurotrack_prefs', JSON.stringify(prefs));
          setStage('app');
        }}
      />
    );
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();

  const filteredTests = testLibrary.filter((item) => {
    if (labFilter === 'recommended') return ['n-back', 'stroop', 'choice-reaction'].includes(item.id);
    if (labFilter === 'completed') {
      const completedTypes = new Set(sessions.map((s) => s.taskType || 'n-back'));
      return completedTypes.has(item.id);
    }
    return true;
  });

  return (
    <div className={`app-shell ${reducedMotion ? 'reduced-motion' : ''}`}>
      <Sidebar
        active={page}
        onSelect={setPage}
        open={mobile}
        onClose={() => setMobile(false)}
        userName={userName}
        sessionCount={sessions.length}
        onSignOut={() => setStage('auth')}
      />

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobile(!mobile)}
            aria-label="Toggle navigation"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>My space</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{pageLabels[page] || page}</strong>
          </div>

          <div className="topbar-actions">
            <span className="local-pill">
              <span /> LOCAL DEMO
            </span>
            <button
              className="icon-button"
              title="Help & Privacy"
              onClick={() => setPage('Privacy & settings')}
              aria-label="Help"
            >
              <CircleHelp size={17} />
            </button>
            <button
              className="top-avatar"
              onClick={() => setPage('Settings')}
              aria-label="Open profile"
              title={userName}
            >
              {userName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </button>
          </div>
        </header>

        <div className="page-wrap">
          {message && (
            <div className="toast">
              <Check size={16} />
              {message}
              <button onClick={() => setMessage('')}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* ==========================================================
              OVERVIEW DASHBOARD
             ========================================================== */}
          {page === 'Overview' && (
            <>
              <div className="page-heading heading-with-date">
                <div>
                  <span className="eyebrow">{formattedDate}</span>
                  <h1>Good morning, {userName.split(' ')[0]}.</h1>
                  <p>Your cognitive landscape, at a glance.</p>
                </div>
                <button
                  className="outline-button"
                  onClick={() => setPage('Analytics')}
                >
                  <CalendarDays size={16} /> Last 30 days <ChevronDown size={15} />
                </button>
              </div>

              <section className="hero-panel">
                <div className="hero-copy">
                  <span className="eyebrow burgundy-eyebrow">
                    <span className="live-dot" /> DAILY SNAPSHOT
                  </span>
                  <h2>
                    Measure focus,
                    <br />
                    <em>memory</em> and mood.
                  </h2>
                  <p>
                    Small signals become meaningful patterns. Take a few minutes to see how your mind is moving today.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setPage('Testing lab')}
                  >
                    Start today&apos;s check-in <ArrowRight size={16} />
                  </button>
                </div>
                <NeuralGraphic />
                <div className="hero-note">
                  <Activity size={15} />
                  <span>
                    Last assessment{' '}
                    <strong>
                      {latest
                        ? new Date(latest.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Yesterday, 9:42 AM'}
                    </strong>
                  </span>
                </div>
              </section>

              <section className="metric-grid" aria-label="Key metrics">
                <MetricCard
                  label="Focus score"
                  value={latest ? String(latest.accuracy) : String(averageFocusScore)}
                  suffix="/ 100"
                  change="+3.2%"
                  context="vs. your baseline"
                  icon={<Target size={16} />}
                  chart="up"
                  onClick={() => setPage('Analytics')}
                />
                <MetricCard
                  label="Response latency"
                  value={rt ? `${rt}` : '584'}
                  suffix="ms"
                  change="Steady"
                  context="median response"
                  icon={<Clock3 size={16} />}
                  chart="steady"
                  onClick={() => setPage('Testing lab')}
                />
                <MetricCard
                  label="Current streak"
                  value={String(sessions.length ? Math.min(sessions.length, 14) : 14)}
                  suffix="days"
                  change="Personal best"
                  context="Keep it going"
                  icon={<Zap size={16} />}
                  chart="up"
                  accent
                  onClick={() => setPage('Focus & Habits')}
                />
              </section>

              <div className="content-grid">
                <section className="surface-panel trend-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">PERFORMANCE</span>
                      <h3>Focus over time</h3>
                    </div>
                    <button
                      className="quiet-button"
                      onClick={() => setPage('Analytics')}
                    >
                      Weekly <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="legend-dot burgundy-dot" /> Your score
                    </span>
                    <span>
                      <i className="legend-dot cream-dot" /> Personal average
                    </span>
                  </div>

                  {trend.length > 0 ? (
                    <div style={{ width: '100%', height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trend}>
                          <CartesianGrid stroke="#e0d2c3" strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#887b70', fontSize: 11 }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#887b70', fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#fbf7f1',
                              border: '1px solid #d4c1af',
                              borderRadius: 6,
                              fontSize: 12,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="#64182f"
                            strokeWidth={2.8}
                            dot={{ r: 4, fill: '#64182f' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="focus-chart">
                      <div className="chart-y-axis">
                        <span>100</span>
                        <span>75</span>
                        <span>50</span>
                        <span>25</span>
                      </div>
                      <div className="chart-area">
                        <div className="chart-grid-lines">
                          <i />
                          <i />
                          <i />
                          <i />
                        </div>
                        <div className="bar-group">
                          {focusBars.map((height, index) => (
                            <div className="bar-column" key={index}>
                              <span className="chart-bar" style={{ height: `${height}%` }} />
                              {index === 9 && <b className="chart-tooltip">91</b>}
                            </div>
                          ))}
                        </div>
                        <div className="chart-days">
                          <span>Nov 08</span>
                          <span>Nov 10</span>
                          <span>Nov 12</span>
                          <span>Nov 14</span>
                          <span>Nov 16</span>
                          <span>Nov 18</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="trend-footer">
                    <span>
                      <strong>+8.4%</strong> improvement this month
                    </span>
                    <button
                      className="text-button"
                      onClick={() => setPage('Analytics')}
                    >
                      See all insights <ArrowRight size={14} />
                    </button>
                  </div>
                </section>

                <section className="surface-panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">YOUR RHYTHM</span>
                      <h3>Quick test &amp; habits</h3>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => setPage('Testing lab')}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  <div className="activity-list">
                    <ActivityRow
                      icon={<Brain size={16} />}
                      title="Working memory"
                      detail="2-Back Task · 2 min"
                      score={`${latest?.accuracy ?? 86}%`}
                      tone="burgundy"
                      onClick={() => setPage('Testing lab')}
                    />
                    <ActivityRow
                      icon={<Zap size={16} />}
                      title="Simple reaction"
                      detail="8 response trials · 1 min"
                      score={`${rt || 260}ms`}
                      tone="green"
                      onClick={() => setPage('Reaction Test')}
                    />
                    <ActivityRow
                      icon={<Wind size={16} />}
                      title="Selective attention"
                      detail="Stroop Task · 2 min"
                      score="Ready"
                      tone="sand"
                      onClick={() => setPage('Stroop Task')}
                    />
                    <ActivityRow
                      icon={<Smartphone size={16} />}
                      title="Focus & deep work"
                      detail="Phone environment & timer"
                      score="Daily"
                      tone="burgundy"
                      onClick={() => setPage('Focus & Habits')}
                    />
                  </div>
                  <button
                    className="full-width-button"
                    onClick={() => setPage('Testing lab')}
                  >
                    <Play size={14} fill="currentColor" /> Continue your routine
                  </button>
                </section>
              </div>

              {insightNoteVisible && (
                <section className="insight-strip">
                  <div className="insight-icon">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <span className="panel-kicker">A NOTE FOR YOU</span>
                    <p>
                      Your focus is strongest in the morning.{' '}
                      <strong>Try scheduling deep work before noon</strong> to work with your natural rhythm.
                    </p>
                  </div>
                  <button
                    className="close-note"
                    onClick={() => setInsightNoteVisible(false)}
                    aria-label="Dismiss insight"
                  >
                    <X size={16} />
                  </button>
                </section>
              )}

              <div className="overview-hydration">
                <HydrationTracker />
              </div>

              <div className="disclaimer">
                <ShieldCheck size={15} />
                <span>
                  NeuroTrack is a self-tracking and educational tool, not a medical device, diagnosis, or clinically
                  validated assessment.
                </span>
                <button onClick={() => setPage('Privacy & settings')}>
                  Learn about your data →
                </button>
              </div>
            </>
          )}

          {/* ==========================================================
              COGNITIVE LAB (ASSESSMENTS HUB)
             ========================================================== */}
          {page === 'Testing lab' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">YOUR ROUTINE · 10 INTERACTIVE TASKS</span>
                <h1>Cognitive Lab</h1>
                <p>
                  Short, science-informed check-ins that make your patterns clearer. Select any test to begin.
                </p>
              </div>

              <div className="assessment-tabs">
                <button
                  className={labFilter === 'all' ? 'active' : ''}
                  onClick={() => setLabFilter('all')}
                >
                  All assessments <span>{testLibrary.length}</span>
                </button>
                <button
                  className={labFilter === 'recommended' ? 'active' : ''}
                  onClick={() => setLabFilter('recommended')}
                >
                  Recommended <span>3</span>
                </button>
                <button
                  className={labFilter === 'completed' ? 'active' : ''}
                  onClick={() => setLabFilter('completed')}
                >
                  Completed <span>{sessions.length}</span>
                </button>
              </div>

              <section className="featured-assessment">
                <div className="featured-icon">
                  <Gauge size={26} />
                </div>
                <div>
                  <span className="panel-kicker">RECOMMENDED FOR TODAY</span>
                  <h2>Working memory · N-Back</h2>
                  <p>A short N-back task. Decide whether the current letter matches the one shown {n} steps earlier.</p>
                  <div className="assessment-meta">
                    <span>
                      <Clock3 size={14} /> 2 minutes
                    </span>
                    <span>
                      <Activity size={14} /> {total} trials
                    </span>
                    <span className="ready-label">
                      <span /> Ready when you are
                    </span>
                  </div>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    document.getElementById('nback-task')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Go to task <ArrowRight size={16} />
                </button>
              </section>

              <div className="section-heading-row">
                <div>
                  <span className="panel-kicker">EXPLORE YOUR SIGNALS</span>
                  <h3>Complete Cognitive Library</h3>
                </div>
                <span className="text-xs text-muted font-body">{filteredTests.length} available</span>
              </div>

              <section className="test-library">
                {filteredTests.map((item) => (
                  <button
                    className="test-library-card"
                    key={item.page}
                    onClick={() =>
                      item.page === 'Testing lab'
                        ? document.getElementById('nback-task')?.scrollIntoView({ behavior: 'smooth' })
                        : setPage(item.page)
                    }
                  >
                    <span className="test-library-top">
                      <span className="task-chip">{item.tag.toUpperCase()}</span>
                      <small>{item.duration}</small>
                    </span>
                    <b>{item.name}</b>
                    <span>{item.description}</span>
                    <TaskPurposeCard task={item.id as any} compact />
                    <i>
                      Start Task <ArrowRight size={13} />
                    </i>
                  </button>
                ))}
              </section>

              {/* N-BACK INTERACTIVE TEST RUNNER */}
              <div className="page-heading compact-heading" id="nback-task">
                <div>
                  <span className="eyebrow">FEATURED TASK RUNNER</span>
                  <h1>Working memory · N-back</h1>
                  <p>Decide whether the current letter matches the one shown {n} steps earlier.</p>
                </div>
              </div>

              <NBackTask>
                <div className="task-layout">
                  <div className="panel task-panel">
                    <div className="task-top">
                      <span className="task-chip">
                        <Brain size={15} /> N-BACK
                      </span>
                      <span className="setting">
                        <label>Difficulty</label>
                        <select
                          value={n}
                          onChange={(e) => setN(Number(e.target.value))}
                          disabled={running}
                        >
                          <option value={1}>1-back</option>
                          <option value={2}>2-back</option>
                          <option value={3}>3-back</option>
                        </select>
                      </span>
                      <span className="setting">
                        <label>Trials</label>
                        <select
                          value={total}
                          onChange={(e) => setTotal(Number(e.target.value))}
                          disabled={running}
                        >
                          <option value={12}>12</option>
                          <option value={20}>20</option>
                          <option value={30}>30</option>
                        </select>
                      </span>
                    </div>

                    {running ? (
                      <>
                        <div className="progress-wrap">
                          <div className="progress-label">
                            <span>
                              {paused
                                ? 'PAUSED'
                                : countdown > 0
                                  ? 'GET READY'
                                  : practiceMode
                                    ? `PRACTICE ${trial} OF ${practiceSeq.current.length}`
                                    : `TRIAL ${Math.min(trial, total)} OF ${total}`}
                            </span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="progress">
                            <i style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>

                        <div className="stimulus-area">
                          {countdown > 0 ? (
                            <div className="pause-message">
                              <span>{countdown}</span>
                              <b>Get ready</b>
                              <small>Practice starts after countdown.</small>
                            </div>
                          ) : paused ? (
                            <div className="pause-message">
                              <span>Ⅱ</span>
                              <b>Session paused</b>
                              <small>Return to task when you’re ready.</small>
                            </div>
                          ) : (
                            <div className={ready ? 'stimulus shown' : 'stimulus'}>{stim || '·'}</div>
                          )}
                        </div>

                        <div className="answer-row">
                          <button
                            className="answer-btn"
                            disabled={paused || !ready}
                            onClick={() => answer(false)}
                          >
                            <X size={17} /> No match
                          </button>
                          <button
                            className="answer-btn match"
                            disabled={paused || !ready}
                            onClick={() => answer(true)}
                          >
                            <Check size={17} /> Match
                          </button>
                        </div>

                        <div className="task-controls">
                          {paused ? (
                            <button onClick={resumeTask}>
                              <Play size={14} /> Resume
                            </button>
                          ) : (
                            <button onClick={pauseTask}>Ⅱ Pause</button>
                          )}
                          <button onClick={exitTask}>Exit task</button>
                        </div>
                      </>
                    ) : (
                      <div className="task-intro">
                        <div className="task-illustration">
                          <div className="letter-card">A</div>
                          <div className="letter-card active">C</div>
                          <div className="letter-card">C</div>
                          <div className="match-tag">MATCH</div>
                        </div>
                        <h2>Keep a few steps in mind.</h2>
                        <p>
                          Letters appear one at a time. Press <b>Match</b> if the current letter is the same as the one
                          from {n} steps back. Otherwise, press <b>No match</b>.
                        </p>
                        <TaskPurposeCard task="n-back" compact />
                        <div className="instruction-row">
                          <span>
                            <b>01</b> Brief practice round included
                          </span>
                          <span>
                            <b>02</b> Pause or exit anytime
                          </span>
                          <span>
                            <b>03</b> Results save to this local demo
                          </span>
                        </div>
                        <button className="primary-button start-btn" onClick={begin}>
                          <Play size={16} fill="currentColor" /> Begin task <span>· about 2 min</span>
                        </button>
                      </div>
                    )}

                    {!running && results.length > 0 && (
                      <div className="result-banner">
                        <div>
                          <b>Last session · {percent}% accuracy</b>
                          <span>
                            {results.length} trials ·{' '}
                            {Math.round(median(results.flatMap((x) => (x.rt ? [x.rt] : []))))} ms median response
                          </span>
                        </div>
                        <button className="outline-button" onClick={() => setResults([])}>
                          <RotateCcw size={14} /> New session
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="task-aside">
                    <div className="panel">
                      <div className="panel-head">
                        <div>
                          <h2>About this task</h2>
                          <p>What does it explore?</p>
                        </div>
                      </div>
                      <div className="about-icon">
                        <Brain size={21} />
                      </div>
                      <b>Working memory</b>
                      <p className="aside-copy">
                        The ability to hold and update information over short periods. The N-back task is a simplified
                        research paradigm.
                      </p>
                      <div className="aside-rule" />
                      <div className="aside-fact">
                        <span>RESPONSE WINDOW</span>
                        <b>2.6 seconds</b>
                      </div>
                      <div className="aside-fact">
                        <span>TIMING METHOD</span>
                        <b>performance.now()</b>
                      </div>
                      <div className="aside-warning">
                        <ShieldCheck size={15} />
                        <span>Task performance is influenced by device latency and context. Not a clinical diagnosis.</span>
                      </div>
                    </div>

                    <button
                      className="explore-card"
                      onClick={explore}
                      disabled={loading}
                    >
                      <span className="explore-icon">
                        <Sparkles size={18} />
                      </span>
                      <span>
                        <b>Explore the science behind this task</b>
                        <small>
                          {loading
                            ? 'Researching credible sources…'
                            : tinyFishConfigured === null
                              ? tinyFishConfigChecked
                                ? 'Setup status unavailable'
                                : 'Checking TinyFish setup…'
                              : tinyFishConfigured
                                ? 'Live research enabled · TinyFish'
                                : 'Built-in overview · API key not configured'}
                        </small>
                      </span>
                      <span>{loading ? '…' : '→'}</span>
                    </button>
                  </div>
                </div>
              </NBackTask>

              {research && (
                <div className="panel research-panel">
                  <div className="panel-head">
                    <div>
                      <span className="task-chip">
                        <Sparkles size={14} /> NEUROSCIENCE EXPLORER ·{' '}
                        {researchMode === 'tinyfish' ? 'LIVE TINYFISH' : 'BUILT-IN OVERVIEW'}
                      </span>
                      <h2>{research.topic}</h2>
                    </div>
                    <button className="icon-button" onClick={() => setResearch(null)}>
                      <X size={17} />
                    </button>
                  </div>
                  <p>{research.explanation}</p>
                  <h3>Processes involved</h3>
                  <div className="processes">
                    {research.processes.map((p) => (
                      <span key={p}>{p}</span>
                    ))}
                  </div>
                  <h3>Evidence summary</h3>
                  <p>{research.evidence}</p>
                  <h3>Sources</h3>
                  <div className="source-list">
                    {research.sources.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                        {s.title} ↗
                      </a>
                    ))}
                  </div>
                  <div className="aside-warning">
                    <ShieldCheck size={15} />
                    {research.limitations}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================================
              INDIVIDUAL COGNITIVE TESTS
             ========================================================== */}
          {page === 'Stroop Task' && (
            <>
              <button className="outline-button mb-4" onClick={() => setPage('Testing lab')}>
                ← Back to Cognitive Lab
              </button>
              <div className="page-heading">
                <span className="eyebrow">COGNITIVE LAB · SELECTIVE ATTENTION</span>
                <h1>Stroop task</h1>
                <p>Practice choosing the ink color while ignoring the written word.</p>
              </div>
              <StroopTask />
            </>
          )}

          {page === 'Choice Reaction' && (
            <>
              <button className="outline-button mb-4" onClick={() => setPage('Testing lab')}>
                ← Back to Cognitive Lab
              </button>
              <div className="page-heading">
                <span className="eyebrow">COGNITIVE LAB · RESPONSE SELECTION</span>
                <h1>Choice reaction</h1>
                <p>Respond to one of four visual targets by clicking or pressing its matching key.</p>
              </div>
              <ChoiceReactionTask />
            </>
          )}

          {page === 'Go / No-Go' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">COGNITIVE LAB · RESPONSE INHIBITION</span>
                <h1>Go / No-Go</h1>
                <p>Respond to Go cues and withhold responses to No-Go cues.</p>
              </div>
              <GoNoGoTask onBack={() => setPage('Testing lab')} />
            </>
          )}

          {page === 'Digit Span' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">COGNITIVE LAB · WORKING MEMORY</span>
                <h1>Digit span</h1>
                <p>Recall increasing number sequences, forward and backward.</p>
              </div>
              <DigitSpanTask onBack={() => setPage('Testing lab')} />
            </>
          )}

          {page === 'Corsi Spatial' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">COGNITIVE LAB · SPATIAL MEMORY</span>
                <h1>Corsi spatial</h1>
                <p>Watch and reproduce a growing sequence of locations.</p>
              </div>
              <CorsiSpatialTask onBack={() => setPage('Testing lab')} />
            </>
          )}

          {page === 'Visual Search' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">COGNITIVE LAB · VISUAL ATTENTION</span>
                <h1>Visual search</h1>
                <p>Find a target symbol among visual distractors.</p>
              </div>
              <VisualSearchTask onBack={() => setPage('Testing lab')} />
            </>
          )}

          {page === 'Time Perception' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">COGNITIVE LAB · TIME ESTIMATION</span>
                <h1>Time perception</h1>
                <p>Estimate ten seconds without a clock or countdown.</p>
              </div>
              <TimePerceptionTask onBack={() => setPage('Testing lab')} />
            </>
          )}

          {page === 'Trail Making' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">COGNITIVE LAB · SEQUENCING</span>
                <h1>Trail making</h1>
                <p>Connect numbered targets in order while minimizing errors.</p>
              </div>
              <TrailMakingTask onBack={() => setPage('Testing lab')} />
            </>
          )}

          {page === 'Reaction Test' && (
            <>
              <button className="outline-button mb-4" onClick={() => setPage('Testing lab')}>
                ← Back to Cognitive Lab
              </button>
              <div className="page-heading">
                <span className="eyebrow">QUICK PERFORMANCE CHECK</span>
                <h1>Reaction time</h1>
                <p>A short response-time task for a simple personal observation.</p>
              </div>
              <ReactionTest />
            </>
          )}

          {/* ==========================================================
              LIFESTYLE, HABITS & PLANNING
             ========================================================== */}
          {page === 'Context Journal & Check-in' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">DAILY CONTEXT · JOURNAL &amp; HYDRATION</span>
                <h1>Notice your day, over time.</h1>
                <p>Record sleep, caffeine, exercise, mood, stress, energy, and notes, then revisit your timeline.</p>
              </div>
              <ContextJournal />
            </>
          )}

          {page === 'Focus & Habits' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">PERSONAL FOCUS CONTEXT</span>
                <h1>Build a clearer picture of your habits.</h1>
                <p>Track focus sessions, screen use, interruptions, and where your phone was during the day.</p>
              </div>
              <FocusHabitTracker />
            </>
          )}

          {page === 'Task Scheduler' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">PERSONAL FOCUS PLANNING</span>
                <h1>Plan around your energy.</h1>
                <p>Organize complex and lighter tasks using recent personal check-in or N-back context.</p>
              </div>
              <TaskScheduler />
            </>
          )}

          {page === 'NeuroNutri' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">PERSONAL WELLBEING · NEURONUTRI</span>
                <h1>Fuel your day, gently.</h1>
                <p>
                  Simple food ideas based on your latest check-in, using familiar options you may find in a hostel or
                  campus canteen.
                </p>
              </div>
              <NeuroNutri />
              <NeuroNutriCard />
            </>
          )}

          {page === 'Analytics' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">PERSONAL ANALYTICS</span>
                <h1>Analytics &amp; trends</h1>
                <p>Filter your non-synthetic sessions and compare your own recorded performance over time.</p>
              </div>
              <Analytics />
            </>
          )}

          {page === 'Learn' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">NEUROSCIENCE LEARNING HUB</span>
                <h1>Learning &amp; science</h1>
                <p>Plain-language explainers connected to the tasks in your Cognitive Lab.</p>
              </div>
              <LearningHub />
            </>
          )}

          {/* ==========================================================
              INSIGHTS ENGINE (BOLT STYLE)
             ========================================================== */}
          {page === 'Insights' && (
            <>
              <div className="page-heading heading-with-date">
                <div>
                  <span className="eyebrow">THE BIGGER PICTURE</span>
                  <h1>Your insights</h1>
                  <p>Patterns become clearer when you give them room to unfold.</p>
                </div>
                <button className="outline-button">
                  <CalendarDays size={16} /> Last 30 days <ChevronDown size={15} />
                </button>
              </div>

              <section className="insight-overview">
                <div className="insight-overview-copy">
                  <span className="eyebrow burgundy-eyebrow">
                    <Sparkles size={13} /> THIS MONTH
                  </span>
                  <h2>
                    Your focus is finding its <em>flow.</em>
                  </h2>
                  <p>
                    {actualSessions.length >= 3
                      ? `Across ${actualSessions.length} personal sessions, your average focus accuracy is ${averageFocusScore}%, with steady performance recorded.`
                      : "You're averaging 8% higher focus scores than last month, with your strongest window between 9:00 and 11:30 AM."}
                  </p>
                  <button className="text-button" onClick={() => setPage('Analytics')}>
                    Explore detailed charts <ArrowRight size={14} />
                  </button>
                </div>
                <div className="big-stat">
                  <span>{averageFocusScore}</span>
                  <small>AVG. FOCUS SCORE</small>
                  <div>
                    <ArrowRight size={14} /> +8.4% this month
                  </div>
                </div>
              </section>

              <div className="insight-metric-grid">
                <div className="insight-metric">
                  <span className="panel-kicker">Morning focus</span>
                  <strong>91</strong>
                  <div>
                    <span>your strongest window</span>
                    <b>+12%</b>
                  </div>
                </div>
                <div className="insight-metric">
                  <span className="panel-kicker">Recall precision</span>
                  <strong>{latest ? `${latest.accuracy}%` : '78%'}</strong>
                  <div>
                    <span>steady over 30 days</span>
                    <b>+4%</b>
                  </div>
                </div>
                <div className="insight-metric">
                  <span className="panel-kicker">Response latency</span>
                  <strong>{rt ? `${rt}ms` : '580ms'}</strong>
                  <div>
                    <span>median reaction time</span>
                    <b>-18ms</b>
                  </div>
                </div>
              </div>

              <div className="insights-lower">
                <section className="surface-panel weekly-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">WEEKLY RHYTHM</span>
                      <h3>How your week felt</h3>
                    </div>
                    <button className="quiet-button">
                      This week <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="weekly-bars">
                    {weekBars.map((height, index) => (
                      <div className="weekly-day" key={index}>
                        <span className="weekly-bar-wrap">
                          <i style={{ height: `${height}%` }} />
                        </span>
                        <b>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</b>
                      </div>
                    ))}
                  </div>
                  <div className="weekly-caption">
                    <span>
                      <i className="legend-dot burgundy-dot" /> Focus score
                    </span>
                    <strong>Best day: Saturday</strong>
                  </div>
                </section>

                <section className="surface-panel observation-panel">
                  <div>
                    <span className="panel-kicker">OBSERVATION 01</span>
                    <h3>Consistency is your superpower.</h3>
                    <p>
                      Your check-ins are becoming a reliable ritual. People who track consistently spot helpful changes
                      2.4× sooner.
                    </p>
                  </div>
                  <div className="observation-foot">
                    <UsersRound size={15} />
                    <span>Based on your activity</span>
                  </div>
                </section>
              </div>

              <AIInsights />

              <FocusHabitInsights />

              <div className="panel experiment-note mt-6 flex items-start gap-3 bg-surface-light border border-line p-4 rounded-lg">
                <FlaskConical size={18} className="text-burgundy mt-1 flex-shrink-0" />
                <div>
                  <b className="text-sm text-burgundy-deep">Personal experiments</b>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Choose one small change (e.g. placing your phone in another room or drinking water before testing)
                    and compare periods with similar task settings.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ==========================================================
              PROFILE & SETTINGS (BOLT STYLE)
             ========================================================== */}
          {page === 'Settings' && (
            <div className="profile-page">
              <div className="page-heading">
                <span className="eyebrow">YOUR SPACE</span>
                <h1>Profile &amp; settings</h1>
                <p>Make NeuroTrack feel more like yours.</p>
              </div>

              <div className="profile-layout">
                <section className="surface-panel profile-card">
                  <div className="profile-cover">
                    <div className="profile-large-avatar">
                      {userName
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <strong className="block text-base font-bold text-burgundy-deep">{userName}</strong>
                      <span className="text-xs text-muted">Personal space · Local storage</span>
                    </div>
                  </div>

                  <div className="profile-fields">
                    <div className="field-row">
                      <label>
                        Full name
                        <input
                          value={userName}
                          onChange={(e) => {
                            setUserName(e.target.value);
                            localStorage.setItem('neurotrack_user', e.target.value);
                          }}
                        />
                      </label>
                      <label>
                        Timezone
                        <select defaultValue="Local Timezone">
                          <option>Local Timezone</option>
                          <option>Pacific Time (PT)</option>
                          <option>Eastern Time (ET)</option>
                          <option>UTC / GMT</option>
                          <option>India Standard Time (IST)</option>
                        </select>
                      </label>
                    </div>

                    <div className="profile-save">
                      <span>
                        <Check size={14} /> Changes save automatically
                      </span>
                      <button
                        className="primary-button"
                        onClick={() => setMessage('Profile updated.')}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                </section>

                <div className="settings-stack">
                  <section className="surface-panel settings-card">
                    <div className="settings-heading">
                      <div className="settings-icon burgundy">
                        <Clock3 size={17} />
                      </div>
                      <div>
                        <h3>Notifications</h3>
                        <p>Stay in the loop with your rhythm.</p>
                      </div>
                    </div>
                    <div className="toggle-row">
                      <div>
                        <strong>Daily check-in reminder</strong>
                        <span>Interval-based · nudges after each recorded drink (every 2 hours)</span>
                      </div>
                      <button
                        className={`toggle ${notifications ? 'checked' : ''}`}
                        onClick={() => setNotifications(!notifications)}
                        aria-label="Toggle notifications"
                      >
                        <i />
                      </button>
                    </div>
                    <div className="toggle-row">
                      <div>
                        <strong>Weekly reflection</strong>
                        <span>A summary every Sunday</span>
                      </div>
                      <button
                        className={`toggle ${weeklySummary ? 'checked' : ''}`}
                        onClick={() => setWeeklySummary(!weeklySummary)}
                        aria-label="Toggle weekly summary"
                      >
                        <i />
                      </button>
                    </div>
                  </section>

                  <section className="surface-panel settings-card">
                    <div className="settings-heading">
                      <div className="settings-icon sand">
                        <Settings2 size={17} />
                      </div>
                      <div>
                        <h3>Preferences</h3>
                        <p>Adjust how NeuroTrack works for you.</p>
                      </div>
                    </div>
                    <div className="toggle-row">
                      <div>
                        <strong>Reduced motion</strong>
                        <span>Keep animations gentle</span>
                      </div>
                      <button
                        className={`toggle ${reducedMotion ? 'checked' : ''}`}
                        onClick={() => setReducedMotion(!reducedMotion)}
                        aria-label="Toggle reduced motion"
                      >
                        <i />
                      </button>
                    </div>
                    <button
                      className="settings-link"
                      onClick={() => setPage('Privacy & settings')}
                    >
                      <LockKeyhole size={15} /> Privacy &amp; Data Center <ArrowRight size={14} />
                    </button>
                  </section>

                  <button
                    className="sign-out-button"
                    onClick={() => setStage('auth')}
                  >
                    <LogOut size={15} /> Switch User / Welcome Screen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              DATA & PRIVACY CENTER
             ========================================================== */}
          {page === 'Privacy & settings' && (
            <>
              <div className="page-heading">
                <span className="eyebrow">PRIVACY &amp; SETTINGS</span>
                <h1>Your data, your choice.</h1>
                <p>NeuroTrack stores session and check-in data in a local SQLite database on this device.</p>
              </div>

              <div className="panel privacy-panel">
                <div className="privacy-row">
                  <span className="privacy-icon">
                    <ShieldCheck />
                  </span>
                  <div>
                    <h2>Local data storage</h2>
                    <p>
                      Session results and optional check-ins stay in the local SQLite demo database. No account or cloud sync
                      is required.
                    </p>
                  </div>
                  <span className="status-tag">LOCAL</span>
                </div>

                <div className="privacy-row">
                  <span className="privacy-icon">
                    <Sparkles />
                  </span>
                  <div>
                    <h2>TinyFish AI research</h2>
                    <p>
                      Only a fixed task topic is sent for educational research. Personal results and check-in details are
                      never included.
                    </p>
                  </div>
                  <span className="status-tag">OPT-IN</span>
                </div>

                <div className="privacy-row">
                  <span className="privacy-icon">
                    <Sparkles />
                  </span>
                  <div>
                    <h2>Gemini AI insights &amp; explainers</h2>
                    <p>
                      When you generate insights or a learning explainer, your local session, journal and habit
                      summaries are sent to Google Gemini. Nothing is sent automatically. Add GEMINI_API_KEY to
                      server/.env to enable it.
                    </p>
                  </div>
                  <span className="status-tag">OPT-IN</span>
                </div>

                <div className="privacy-row">
                  <span className="privacy-icon">
                    <LockKeyhole />
                  </span>
                  <div>
                    <h2>Health-related context</h2>
                    <p>
                      Medication and sensitive health information are not collected in this demo. Sleep, mood, and stress
                      are optional.
                    </p>
                  </div>
                  <span className="status-tag">OPTIONAL</span>
                </div>

                <div className="privacy-actions">
                  <button className="outline-button" onClick={exportData}>
                    <Download size={15} /> Export my data (JSON)
                  </button>
                  <button className="outline-button" onClick={resetDemo}>
                    <RotateCcw size={15} /> Restore synthetic demo data
                  </button>
                  <button className="danger-button" onClick={clearData}>
                    <X size={15} /> Delete all local data
                  </button>
                </div>
              </div>

              <div className="disclaimer">
                <ShieldCheck size={15} />
                <span>Educational self-tracking only. Not a medical device, diagnostic system, or clinically validated assessment.</span>
              </div>
            </>
          )}
        </div>

        <footer className="mt-auto py-6 px-10 border-t border-line flex items-center justify-between text-xs text-muted">
          <span>NEUROTRACK · PERSONAL COGNITIVE JOURNAL</span>
          <span>Self-tracking is not diagnosis.</span>
        </footer>
      </main>
    </div>
  );
}
