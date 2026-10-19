import { useId } from 'react';

export type CognitiveTaskId = 'n-back' | 'simple-reaction' | 'choice-reaction' | 'stroop' | 'go-no-go' | 'digit-span' | 'corsi-spatial' | 'visual-search' | 'time-perception' | 'trail-making';

const copy: Record<CognitiveTaskId, { target: string; purpose: string; opportunity: string; art: 'signal' | 'battery' | 'network' | 'search' | 'path' }> = {
  'n-back': { target: 'Forgetfulness & retaining information', purpose: 'N-back asks you to keep recent items in mind and update them as new ones arrive. It explores working-memory performance, not long-term memory.', opportunity: 'Compare sessions with sleep, stress, energy, and interruptions to notice when holding information feels easier or harder for you.', art: 'network' },
  'digit-span': { target: 'Forgetfulness & retaining information', purpose: 'Repeating digits forward or backward explores how much information you can briefly hold and reorder in working memory.', opportunity: 'Log sleep, stress, energy, and interruptions alongside each session to see which days make short sequences easier to retain.', art: 'network' },
  'simple-reaction': { target: 'Poor sleep & mental fatigue', purpose: 'Responding to a single cue gives a simple view of processing speed and alertness, which can vary with sleep and caffeine.', opportunity: 'Compare response times with sleep duration, caffeine, and energy to spot personal day-to-day variation.', art: 'battery' },
  'choice-reaction': { target: 'Poor sleep & mental fatigue', purpose: 'Choosing among several responses adds a decision step, exploring how quickly you identify a cue and select an action.', opportunity: 'Log sleep, caffeine, stress, and interruptions to see when choosing between competing responses takes more effort.', art: 'signal' },
  'stroop': { target: 'Cognitive overload & selective focus', purpose: 'Choosing the ink color while ignoring the word explores selective attention and response inhibition when information conflicts.', opportunity: 'Compare congruent and conflicting trials across days with different sleep, stress, and interruption levels.', art: 'signal' },
  'go-no-go': { target: 'Attention fragmentation & impulse control', purpose: 'Responding to Go cues and withholding for No-Go cues explores sustained attention and response inhibition in a changing stream.', opportunity: 'Note sleep, stress, energy, and interruptions to see when staying on task or holding back feels more demanding.', art: 'signal' },
  'corsi-spatial': { target: 'Spatial memory & visual scanning', purpose: 'Repeating highlighted locations explores short-term spatial memory and the ability to track a changing visual sequence.', opportunity: 'Compare sequence length with sleep, stress, and energy to find your own context-linked patterns.', art: 'search' },
  'visual-search': { target: 'Spatial memory & visual scanning', purpose: 'Finding a target among distractors explores visual scanning and selective attention in a cluttered field.', opportunity: 'Log interruptions, sleep, and energy to see when locating important details feels easier for you.', art: 'search' },
  'time-perception': { target: 'Procrastination & decision fatigue', purpose: 'Estimating an interval without a clock explores subjective time estimation and how effort can shape your sense of duration.', opportunity: 'Compare estimates with sleep, stress, and energy to notice when time feels different across your own days.', art: 'path' },
  'trail-making': { target: 'Procrastination & decision fatigue', purpose: 'Connecting items in order explores sequencing, visual search, and the mental effort involved in maintaining a goal.', opportunity: 'Log sleep, stress, energy, and interruptions to see when starting and sustaining a multi-step task feels easier.', art: 'path' }
};

function Artwork({ art, gradientId }: { art: typeof copy[CognitiveTaskId]['art']; gradientId: string }) {
  return <svg className={`purpose-art art-${art}`} viewBox="0 0 120 88" fill="none" aria-hidden="true">
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#42E6C4"/><stop offset="1" stopColor="#8B8CFF"/></linearGradient></defs>
    {art === 'signal' && <><path d="M8 48h17l8-22 13 43 12-33 9 20 10-8h35" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 18h20M91 18h21M8 74h26M83 74h29" stroke="#536482" strokeDasharray="3 5"/></>}
    {art === 'battery' && <><rect x="24" y="20" width="68" height="48" rx="9" stroke="#61728D" strokeWidth="2"/><path d="M92 34h7v20h-7" stroke="#61728D" strokeWidth="2"/><path d="M33 29h19v30H33z" rx="4" fill="#42E6C4" fillOpacity=".75"/><path d="M61 44h20" stroke="#8B8CFF" strokeWidth="3" strokeLinecap="round"/><circle cx="61" cy="44" r="18" stroke="#8B8CFF" strokeOpacity=".32"/></>}
    {art === 'network' && <><path d="m25 48 25-25 25 14 20-20M25 48l22 24 28-20 20 20M50 23l22 39M75 37l20 20" stroke="#536482" strokeWidth="2"/><circle cx="25" cy="48" r="6" fill="#42E6C4"/><circle cx="50" cy="23" r="6" fill="#8B8CFF"/><circle cx="75" cy="37" r="6" fill="#42E6C4"/><circle cx="95" cy="17" r="6" fill="#8B8CFF"/><circle cx="47" cy="72" r="6" fill="#8B8CFF"/><circle cx="75" cy="52" r="6" fill="#42E6C4"/><circle cx="95" cy="76" r="6" fill="#8B8CFF"/></>}
    {art === 'search' && <><rect x="19" y="14" width="82" height="60" rx="10" stroke="#536482"/><path d="M37 31h10v10H37zM61 31h10v10H61zM84 31h10v10H84zM37 53h10v10H37zM84 53h10v10H84z" stroke="#7183A0"/><circle cx="66" cy="58" r="9" stroke="#42E6C4" strokeWidth="3"/><circle cx="66" cy="58" r="18" stroke="#8B8CFF" strokeOpacity=".55"/></>}
    {art === 'path' && <><path d="M20 67c16 0 14-45 32-45 13 0 5 42 20 42 12 0 7-34 27-34" stroke="#536482" strokeWidth="2" strokeDasharray="4 5"/><circle cx="20" cy="67" r="7" fill="#42E6C4"/><circle cx="52" cy="22" r="7" fill="#8B8CFF"/><circle cx="72" cy="64" r="7" fill="#42E6C4"/><circle cx="99" cy="30" r="7" fill="#8B8CFF"/><path d="M94 23l8 7-8 7" stroke="#8B8CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>}
  </svg>;
}

export default function TaskPurposeCard({ task, compact = false }: { task: CognitiveTaskId; compact?: boolean }) {
  const item = copy[task];
  const gradientId = `purpose-glow-${useId().replace(/:/g, '')}`;
  return <section className={`task-purpose-card${compact ? ' compact' : ''}`} aria-label={`${item.target} purpose`}>
    <div className="purpose-art-wrap"><Artwork art={item.art} gradientId={gradientId}/></div>
    <div className="purpose-copy"><span className="purpose-kicker">PURPOSE &amp; PROBLEM TARGET</span><h3>{item.target}</h3><p>{item.purpose}</p><p className="purpose-opportunity"><b>NeuroTrack opportunity</b>{item.opportunity}</p><small className="purpose-disclaimer">Personal observations only. This task does not diagnose ADHD, anxiety, or cognitive disorders.</small></div>
  </section>;
}
