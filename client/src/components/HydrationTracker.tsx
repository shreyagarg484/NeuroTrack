import { useEffect, useRef, useState } from 'react';
import { Bell, Check, Droplets } from 'lucide-react';
import { apiRequest } from '../services/api';

type Props = { value?: number; onChange?: (liters: number) => void };
const localDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; };
const REMINDER_INTERVAL_MS = 2 * 60 * 60 * 1000; // nudge again roughly 2 hours after the last recorded intake

export default function HydrationTracker({ value, onChange }: Props) {
  const [internalWater, setInternalWater] = useState(1.5), [waterGoal] = useState(3.0), [saving, setSaving] = useState(false), [toast, setToast] = useState(false), [message, setMessage] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);
  const reminderTimer = useRef<number | undefined>(undefined);
  const remindButtonRef = useRef<HTMLButtonElement>(null);
  const waterCurrent = value ?? internalWater;

  useEffect(() => {
    let active = true;
    apiRequest<unknown>(`/api/hydration?date=${localDate()}`).then((data) => {
      if (active && data && typeof data === 'object' && 'waterIntakeLiters' in data && typeof data.waterIntakeLiters === 'number') {
        setInternalWater(data.waterIntakeLiters);
        onChange?.(data.waterIntakeLiters);
      }
    }).catch(() => { /* Keep the usable 1.5 L starting value if the API is unavailable. */ });
    return () => { active = false; window.clearTimeout(toastTimer.current); window.clearTimeout(reminderTimer.current); };
  }, []);

  useEffect(() => {
    const button = remindButtonRef.current;
    if (!button) return;
    const handler = () => {
      setToast(true);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(false), 6000);
      window.clearTimeout(reminderTimer.current);
      reminderTimer.current = window.setTimeout(() => {
        setToast(true);
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(false), 6000);
      }, REMINDER_INTERVAL_MS);
    };
    button.addEventListener('click', handler);
    return () => button.removeEventListener('click', handler);
  }, []);

  function scheduleHydrationReminder() {
    // Interval-based: the next nudge follows the most recent intake rather than a fixed clock time.
    window.clearTimeout(reminderTimer.current);
    reminderTimer.current = window.setTimeout(() => {
      setToast(true);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(false), 6000);
    }, REMINDER_INTERVAL_MS);
  }

  async function addWater(amount: number) {
    const next = Math.min(waterGoal, Math.round((waterCurrent + amount) * 100) / 100);
    setInternalWater(next); onChange?.(next); setSaving(true); setMessage('');
    try {
      await apiRequest('/api/hydration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: localDate(), waterIntakeLiters: next }) });
      setMessage('Saved to your daily context.');
      scheduleHydrationReminder();
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message} The amount is shown here but may not be saved.` : 'Could not save water intake.');
    } finally { setSaving(false); }
  }

  const progress = Math.max(0, Math.min(100, waterGoal > 0 ? waterCurrent / waterGoal * 100 : 0));
  return <section className="panel hydration-tracker" aria-labelledby="hydration-title">
    <div className="hydration-heading"><div><span className="hydration-eyebrow"><Droplets size={14}/> DAILY WELLBEING</span><h2 id="hydration-title">💧 Hydration Tracker</h2></div><strong className="hydration-total">{waterCurrent.toFixed(2)} L / {waterGoal.toFixed(2)} L</strong></div>
    <div className="hydration-progress" role="progressbar" aria-label="Water intake progress" aria-valuemin={0} aria-valuemax={waterGoal} aria-valuenow={waterCurrent}><div className="hydration-progress-fill" style={{ width: `${progress}%` }}/></div>
    <div className="hydration-actions"><button className="hydration-add highlighted" type="button" onClick={() => void addWater(0.25)} disabled={saving || waterCurrent >= waterGoal}><span>＋250ml Glass</span></button><button className="hydration-add" type="button" onClick={() => void addWater(0.5)} disabled={saving || waterCurrent >= waterGoal}><span>＋500ml</span></button><button className="hydration-add" type="button" onClick={() => void addWater(1)} disabled={saving || waterCurrent >= waterGoal}><span>＋1 Liter</span></button><button ref={remindButtonRef} className="hydration-remind" type="button"><Bell size={14}/> Remind me</button></div>
    <div className="hydration-footer"><span>{saving ? 'Saving intake…' : message || 'Water intake is recorded with your daily context.'}</span>{!saving && message.startsWith('Saved') && <Check size={13}/>}</div>
    {toast && <div id="toast-notification" role="status">💧 Hydration Reminder: Drink 250ml of water to maintain peak focus!</div>}
  </section>;
}