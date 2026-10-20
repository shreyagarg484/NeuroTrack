import { useEffect, useState } from 'react';
import { AlertCircle, Apple, Coffee, RefreshCw, ShieldCheck, Soup } from 'lucide-react';
import { apiRequest } from '../services/api';

type Checkin = {
  createdAt: string;
  sleepHours: number | null;
  sleepQuality: number | null;
  energy: number | null;
  stress: number | null;
};

type Recommendation = { title: string; detail: string; icon: 'apple' | 'soup' | 'coffee' };

function recommendationsFor(checkin: Checkin): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const shortSleep = checkin.sleepQuality !== null && checkin.sleepQuality <= 2
    || checkin.sleepHours !== null && checkin.sleepHours < 6;

  if (checkin.energy !== null && checkin.energy <= 2) {
    recommendations.push({ title: 'Choose a steady snack', detail: 'Try a banana with peanuts, or curd/yogurt with fruit from the hostel canteen. Pairing fruit with a filling food can make a more substantial snack than sweets alone.', icon: 'apple' });
  }
  if (checkin.stress !== null && checkin.stress >= 4) {
    recommendations.push({ title: 'Keep the next meal simple', detail: 'A familiar plate such as dal with rice, roti and eggs, or beans with bread is an easy option. Have water nearby and take a few minutes to eat without rushing if you can.', icon: 'soup' });
  }
  if (shortSleep) {
    recommendations.push({ title: 'Make breakfast easy', detail: 'Consider oats with milk, eggs with toast, or curd with fruit and nuts. Food cannot replace sleep; if possible, make rest the priority today.', icon: 'coffee' });
  }
  if (!recommendations.length) {
    recommendations.push({ title: 'Build a balanced hostel plate', detail: 'When available, combine a staple such as rice, roti or bread with dal, beans, eggs or curd, plus fruit or vegetables. Choose an option you enjoy and can access.', icon: 'soup' });
  }
  recommendations.push({ title: 'A small hydration cue', detail: 'Keep a refillable bottle where you study and drink to thirst. There is no need to force extra water.', icon: 'apple' });
  return recommendations;
}

function Icon({ name }: { name: Recommendation['icon'] }) {
  if (name === 'soup') return <Soup size={18} />;
  if (name === 'coffee') return <Coffee size={18} />;
  return <Apple size={18} />;
}

export default function NeuroNutriCard() {
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLatest() {
    setLoading(true);
    setError(null);
    try {
      const payload: unknown = await apiRequest('/api/checkins/latest');
      if (!payload || typeof payload !== 'object' || !('checkin' in payload)) throw new Error('The check-in response was not in the expected format.');
      const latest = (payload as { checkin: unknown }).checkin;
      if (latest === null) {
        setCheckin(null);
      } else if (latest && typeof latest === 'object') {
        const value = latest as Record<string, unknown>;
        const score = (key: string) => typeof value[key] === 'number' && Number.isFinite(value[key]) ? value[key] as number : null;
        setCheckin({ createdAt: typeof value.createdAt === 'string' ? value.createdAt : '', sleepHours: score('sleepHours'), sleepQuality: score('sleepQuality'), energy: score('energy'), stress: score('stress') });
      } else {
        throw new Error('The latest check-in had an unexpected format.');
      }
    } catch (cause) {
      setCheckin(null);
      setError(cause instanceof Error ? cause.message : 'Could not load recommendations right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadLatest(); }, []);

  return <section className="panel neuronutri-card" aria-labelledby="neuronutri-title">
    <div className="panel-head">
      <div>
        <span className="task-chip"><Apple size={14} /> NEURONUTRI</span>
        <h2 id="neuronutri-title">Brain-fueling ideas for today</h2>
        <p>Practical, hostel-friendly suggestions shaped by your latest check-in.</p>
      </div>
      <button className="neuronutri-refresh" type="button" onClick={() => void loadLatest()} disabled={loading} aria-label="Refresh latest check-in">
        <RefreshCw size={15} />
      </button>
    </div>
    {loading ? <div className="neuronutri-state">Loading your latest check-in…</div>
      : error ? <div className="neuronutri-state error" role="alert"><AlertCircle size={16} />{error}</div>
      : !checkin ? <div className="neuronutri-empty"><p>Save a daily check-in to get suggestions tailored to your energy, stress and sleep ratings.</p><small>Your food choices are yours; these are general ideas, not medical advice.</small></div>
      : <>
        <div className="neuronutri-scores">
          <span>Energy <b>{checkin.energy === null ? 'Not rated' : `${checkin.energy}/5`}</b></span>
          <span>Stress <b>{checkin.stress === null ? 'Not rated' : `${checkin.stress}/5`}</b></span>
          <span>Sleep <b>{checkin.sleepQuality === null ? 'Not rated' : `${checkin.sleepQuality}/5`}</b></span>
        </div>
        <div className="neuronutri-list">
          {recommendationsFor(checkin).map((item) => <article className="neuronutri-item" key={item.title}>
            <span className="neuronutri-icon"><Icon name={item.icon} /></span>
            <div><b>{item.title}</b><p>{item.detail}</p></div>
          </article>)}
        </div>
        <small className="neuronutri-note"><ShieldCheck size={13} /> General food ideas only; ratings are not a nutrition or medical assessment.</small>
      </>}
  </section>;
}
