import { useEffect, useMemo, useRef, useState } from 'react';
import { Apple, Fish, RefreshCw, ShieldCheck, Soup, Sprout } from 'lucide-react';

type Session = { createdAt: string; n?: number | null; taskType?: string; accuracy: number; medianRt: number; isSynthetic?: boolean | number };
type Meal = { category: 'Hostel Budget'|'Fresh Fruit'|'Nutrient-Dense'; title: string; detail: string; price?: string; icon: 'soup'|'apple'|'sprout' };
type RecipeSet = { band: string; items: Meal[] };
const meals: Record<'high'|'moderate'|'low', RecipeSet> = {
  high: { band: 'High Focus', items: [
    { category: 'Hostel Budget', title: 'Roasted Chana & Green Tea', price: '₹20', detail: 'Chana adds plant protein and fiber; green tea naturally contains caffeine and L-theanine. Nutrient content does not guarantee a focus effect.', icon: 'soup' },
    { category: 'Fresh Fruit', title: 'Bananas with Peanut Butter', price: '₹30', detail: 'A convenient mix of fruit carbohydrate with filling fats and protein from peanut butter.', icon: 'apple' },
    { category: 'Nutrient-Dense', title: 'Walnuts & Dark Chocolate (70%)', detail: 'Walnuts provide unsaturated fats; cocoa contains flavanols. These are food nutrients, not a promise of faster cognitive processing.', icon: 'sprout' }
  ] },
  moderate: { band: 'Moderate Focus / Strain', items: [
    { category: 'Hostel Budget', title: 'Sprouted Moong Salad & Lemon', price: '₹25', detail: 'Moong provides plant protein and carbohydrate; add lemon and vegetables if available for a simple, filling snack.', icon: 'soup' },
    { category: 'Fresh Fruit', title: 'Apple Slices with Almonds', price: '₹35', detail: 'Fruit with nuts can make a convenient snack with fiber, fats, and some protein.', icon: 'apple' },
    { category: 'Nutrient-Dense', title: 'Pumpkin Seeds & Curd', detail: 'A practical combination of protein plus minerals such as zinc and magnesium; it is not a treatment for fatigue.', icon: 'sprout' }
  ] },
  low: { band: 'Low Focus / High Fatigue', items: [
    { category: 'Hostel Budget', title: 'Electrolyte Coconut Water', price: '₹40', detail: 'A drink that supplies fluid and some electrolytes, including potassium. Choose it if it suits you and is available.', icon: 'soup' },
    { category: 'Fresh Fruit', title: 'Orange & Mixed Berries', price: '₹45', detail: 'Fruit provides fluid, carbohydrate, and vitamin C; fresh, frozen, or seasonal options can work.', icon: 'apple' },
    { category: 'Nutrient-Dense', title: 'Boiled Eggs / Tofu with Pepper', detail: 'Eggs and tofu provide protein; eggs also contain choline. Food choices do not diagnose or correct cognitive symptoms.', icon: 'sprout' }
  ] }
};
const scoreFor = (session: Session) => session.taskType === 'simple-reaction'
  ? Math.max(0, Math.min(100, Math.round(100 - Math.max(0, session.medianRt - 200) * .08)))
  : Math.max(0, Math.min(100, Math.round(session.accuracy)));

export default function NeuroNutri() {
  const [userScore, setUserScore] = useState(88), [scoreSource, setScoreSource] = useState('Default preview score · no recent qualifying session'), [scoreLoading, setScoreLoading] = useState(true);
  const [scraping, setScraping] = useState(false), [results, setResults] = useState<RecipeSet|null>(null), [error, setError] = useState('');
  const timer = useRef<number|undefined>();
  useEffect(() => {
    let active = true;
    fetch('/api/sessions').then(async (response) => { if (!response.ok) throw new Error('Session scores are unavailable.'); const rows: unknown = await response.json(); if (!Array.isArray(rows)) throw new Error('Session score response was invalid.');
      const eligible = (rows as Session[]).filter((row) => !Boolean(row.isSynthetic) && (typeof row.n === 'number' || ['simple-reaction','go-no-go'].includes(row.taskType || '')) && Number.isFinite(row.accuracy) && Number.isFinite(row.medianRt)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      if (active && eligible[0]) { const latest = eligible[0]; setUserScore(scoreFor(latest)); setScoreSource(`${latest.taskType || `${latest.n}-back`} · ${new Date(latest.createdAt).toLocaleDateString()}`); }
    }).catch(() => { if (active) setError('Could not load recent task results. Showing the default preview score of 88.'); }).finally(() => { if (active) setScoreLoading(false); });
    return () => { active = false; window.clearTimeout(timer.current); };
  }, []);
  const mealSet = useMemo(() => userScore >= 80 ? meals.high : userScore >= 60 ? meals.moderate : meals.low, [userScore]);
  function autoRunNutriScrape() {
    window.clearTimeout(timer.current); setError(''); setResults(null); setScraping(true);
    timer.current = window.setTimeout(() => { setResults(mealSet); setScraping(false); }, 2200);
  }
  const icon = (kind: Meal['icon']) => kind === 'soup' ? <Soup size={17}/> : kind === 'apple' ? <Apple size={17}/> : <Sprout size={17}/>;
  return <section className="panel neuronutri-agent" aria-labelledby="neuro-nutri-title">
    <div className="panel-head"><div><span className="task-chip"><Apple size={14}/> NEURONUTRI · BRAIN FUELING</span><h2 id="neuro-nutri-title">Food ideas shaped by recent task results</h2><p>Hostel-friendly options are grouped by a simple personal score band.</p></div></div>
    <div className="nutri-score-row"><span className="nutri-score-badge">Current Focus Score: {userScore}/100</span><small>{scoreLoading ? 'Loading recent sessions…' : scoreSource}</small></div>
    <div className="nutri-scrape-note"><ShieldCheck size={15}/><span>Score bands are descriptive, not clinical. Food suggestions are general ideas, not treatments or guaranteed performance effects.</span></div>
    <button className="primary nutri-scrape-button" type="button" onClick={autoRunNutriScrape} disabled={scraping||scoreLoading}><Fish size={16}/>{scoreLoading ? 'Loading focus score…' : scraping ? 'Preparing recipe ideas…' : 'Run TinyFish Recipe Scraper'}{!scraping&&!scoreLoading&&<span>→</span>}</button>
    <div id="tinyfish-nutri-output" className="tinyfish-nutri-output" aria-live="polite">
      {scraping ? <div className="nutri-agent-loading"><RefreshCw className="spin" size={17}/><span>🐟 TinyFish Web Agent querying student recipe portals...</span><small>Demo simulation · no live TinyFish request was made</small></div>
        : error && !results ? <div className="nutri-agent-empty" role="status">{error}<small>The recipe ideas can still be generated from the default preview score.</small></div>
        : results ? <><div className="nutri-results-head"><b>{results.band} recipes</b><span>Selected for a score of {userScore}/100 · demo recipe set</span></div><div className="nutri-recipe-grid">{results.items.map((meal)=><article className={`nutri-recipe-card category-${meal.category.toLowerCase().replace(/[^a-z]+/g,'-')}`} key={meal.title}><span className="nutri-category">{meal.category}</span><span className="nutri-recipe-icon">{icon(meal.icon)}</span><h3>{meal.title}</h3><p>{meal.detail}</p>{meal.price&&<b className="nutri-price">{meal.price}</b>}</article>)}</div><small className="nutri-source-note"><Fish size={12}/> Curated demo suggestions shown after the requested 2.2-second simulated scrape delay.</small></>
        : <div className="nutri-agent-empty">Run the recipe demo to see three suggestions matched to your latest eligible session score.<small>Without recent sessions, the preview uses a default score of 88.</small></div>}
    </div>
  </section>;
}
