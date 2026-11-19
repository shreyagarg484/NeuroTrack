import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { apiRequest, apiRequestSafe } from '../services/api';

type Insight = {
  headline: string;
  summary: string;
  observations: string[];
  suggestions: string[];
  caution: string;
};

type InsightResponse = { mode?: string; cached?: boolean; insight?: Insight };

export default function AIInsights() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [mode, setMode] = useState<'gemini' | 'fallback' | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [config, data] = await Promise.all([
        apiRequestSafe<{ geminiConfigured?: boolean }>('/api/config', {}),
        apiRequest<InsightResponse>('/api/insights', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({})
        })
      ]);
      setGeminiConfigured(Boolean(config?.geminiConfigured));
      if (!data?.insight || !Array.isArray(data.insight.observations) || !Array.isArray(data.insight.suggestions)) {
        throw new Error('The AI insight response was invalid.');
      }
      setInsight(data.insight);
      setMode(data.mode === 'gemini' ? 'gemini' : 'fallback');
    } catch (cause) {
      setInsight(null);
      setError(cause instanceof Error ? cause.message : 'Could not generate AI insights right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="panel ai-insight-panel" aria-labelledby="ai-insights-title">
      <div className="panel-head">
        <div>
          <span className="task-chip">
            <Sparkles size={14} /> AI INSIGHTS ·{' '}
            {mode === null ? 'CHECKING' : mode === 'gemini' ? 'GEMINI' : 'BUILT-IN'}
          </span>
          <h2 id="ai-insights-title">Personal insights engine</h2>
          <p>
            Patterns from your saved sessions, context journal and focus logs.{' '}
            {geminiConfigured === false ? 'Add GEMINI_API_KEY to server/.env for AI-generated insights.' : ''}
          </p>
        </div>
        <button
          className="neuronutri-refresh"
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Regenerate AI insights"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="habit-empty">Generating personal insights…</div>
      ) : error ? (
        <div className="habit-empty">
          <AlertCircle size={16} /> {error}
        </div>
      ) : insight ? (
        <>
          <h3 className="ai-insight-headline">{insight.headline}</h3>
          <p className="ai-insight-summary">{insight.summary}</p>
          <b className="ai-insight-label">Observations</b>
          <ul className="focus-observation-list">
            {insight.observations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <b className="ai-insight-label">Things to try</b>
          <ul className="focus-observation-list">
            {insight.suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="habit-integrity-note">
            <ShieldCheck size={13} /> {insight.caution}
          </p>
        </>
      ) : (
        <div className="habit-empty">No insight is available yet.</div>
      )}
    </section>
  );
}
