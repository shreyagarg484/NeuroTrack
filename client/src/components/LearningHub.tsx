import { useState } from 'react';
import { AlertCircle, BookOpen, FlaskConical, Network, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { apiRequest, apiRequestSafe } from '../services/api';
import LineSidebar from './react-bits/LineSidebar';
import { SpecularCta } from './ui/reactBitsAdapters';

type LearningContent = {
  title: string;
  explanation: string;
  processes: string[];
  evidence: string;
  limitations: string;
};

const explainerTopics = [
  { id: 'n-back', label: 'Working memory and the N-back task' },
  { id: 'stroop', label: 'Selective attention and response inhibition' },
  { id: 'simple-reaction', label: 'Processing speed and reaction time' },
  { id: 'corsi-spatial', label: 'Spatial memory and visual scanning' },
  { id: 'time-perception', label: 'Time perception and effort' },
  { id: 'trail-making', label: 'Sequencing and task switching' }
];

function SynapseNetwork(){return <svg className="synapse-art" viewBox="0 0 220 150" role="img" aria-label="Illustration of connected neural network nodes"><defs><linearGradient id="synapseStroke" x1="0" x2="1"><stop stopColor="#9894ff"/><stop offset="1" stopColor="#45e2ca"/></linearGradient><filter id="synapseGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g stroke="url(#synapseStroke)" strokeWidth="2" opacity=".78"><path d="M27 75 72 32l48 25 43-37 28 49-39 46-51-12-44 29z"/><path d="m72 32 29 71 19-46 32 58-80-83 80-12-32 37-51 12"/></g><g fill="#080d14" stroke="#45e2ca" strokeWidth="2" filter="url(#synapseGlow)"><circle cx="27" cy="75" r="6"/><circle cx="72" cy="32" r="7"/><circle cx="120" cy="57" r="8"/><circle cx="163" cy="20" r="6"/><circle cx="191" cy="69" r="7"/><circle cx="152" cy="115" r="6"/><circle cx="101" cy="103" r="7"/><circle cx="57" cy="132" r="6"/></g><circle cx="120" cy="57" r="2.5" fill="#eff7f7"/><circle cx="72" cy="32" r="2" fill="#eff7f7"/></svg>;}

const concepts=[
  {title:'Working memory and updating',body:'Working memory keeps a small amount of information available while you use it. N-back and Digit Span tasks explore different aspects of short-term maintenance and updating.',tag:'N-BACK · DIGIT SPAN'},
  {title:'Selective attention and response inhibition',body:'Stroop and Go/No-Go tasks explore how people respond when cues compete or when an action should be withheld. Results depend on task design, practice, and context.',tag:'STROOP · GO/NO-GO'},
  {title:'Processing speed and task switching',body:'Reaction-time and trail-making tasks record response timing under specific conditions. They are useful for personal comparison, not standalone measures of a diagnosis.',tag:'REACTION · TRAIL MAKING'}
];

export default function LearningHub(){
  const [topic,setTopic]=useState('n-back');
  const [learning,setLearning]=useState<LearningContent|null>(null);
  const [mode,setMode]=useState<'gemini'|'fallback'|null>(null);
  const [geminiConfigured,setGeminiConfigured]=useState<boolean|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  async function generate(selected:string=topic){
    setLoading(true); setError('');
    try{
      const [config,data]=await Promise.all([
        apiRequestSafe<{geminiConfigured?:boolean}>('/api/config',{}),
        apiRequest<{mode?:string;learning?:LearningContent}>('/api/learning',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({task:selected})})
      ]);
      setGeminiConfigured(Boolean(config?.geminiConfigured));
      if(!data?.learning||!Array.isArray(data.learning.processes)) throw new Error('The learning response was invalid.');
      setLearning(data.learning);
      setMode(data.mode==='gemini'?'gemini':'fallback');
    }catch(cause){
      setLearning(null);
      setError(cause instanceof Error?cause.message:'Could not generate this explainer.');
    }finally{ setLoading(false); }
  }

  return <section className="learning-hub">
    <div className="panel learning-hero"><div><span className="eyebrow"><Network size={14}/> LEARNING & SCIENCE HUB</span><h2>Cognitive Mechanisms &amp; Executive Function</h2><p>Explore the processes involved in the tasks you complete. Short self-tracking tasks offer observations, not clinical conclusions.</p></div><SynapseNetwork/></div>

    <div className="panel learning-ai-panel">
      <div className="panel-head">
        <div>
          <span className="task-chip"><Sparkles size={14}/> AI EXPLAINER · {mode===null?'READY':mode==='gemini'?'GEMINI':'BUILT-IN'}</span>
          <h2>Generate a plain-language explainer</h2>
          <p>Pick a Cognitive Lab topic and Gemini writes a short educational explainer. {geminiConfigured===false?'Add GEMINI_API_KEY to server/.env to enable Gemini.':''}</p>
        </div>
        <button className="neuronutri-refresh" type="button" onClick={()=>void generate()} disabled={loading} aria-label="Regenerate explainer"><RefreshCw size={15}/></button>
      </div>
      <div className="learning-ai-controls">
        <div className="learning-topic-select">
          <span className="nt-field-label">Topic</span>
          <LineSidebar
            items={explainerTopics.map((item) => item.label)}
            accentColor="#64172F"
            textColor="#2d3035"
            markerColor="#B77B55"
            showIndex={false}
            showMarker
            fontSize={0.82}
            itemGap={8}
            defaultActive={explainerTopics.findIndex((item) => item.id === topic)}
            onItemClick={(index) => setTopic(explainerTopics[index].id)}
            className="nt-line-topics"
          />
        </div>
        <SpecularCta type="button" onClick={() => void generate()} loading={loading} loadingText="Generating…" ariaLabel="Generate explainer">Generate explainer</SpecularCta>
      </div>
      {error&&<div className="habit-empty learning-ai-error"><AlertCircle size={15}/>{error}</div>}
      {learning&&!error&&<div className="learning-ai-result">
        <h3>{learning.title}</h3>
        <p>{learning.explanation}</p>
        <div className="processes">{learning.processes.map((item)=><span key={item}>{item}</span>)}</div>
        <b>Evidence summary</b>
        <p>{learning.evidence}</p>
        <p className="learning-ai-limitations"><ShieldCheck size={13}/>{learning.limitations}</p>
      </div>}
    </div>

    <div className="learning-mechanism-grid">{concepts.map(item=><article className="panel learning-mechanism" key={item.title}><span className="learning-mechanism-icon"><Network size={19}/></span><small>{item.tag}</small><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
    <div className="panel learning-integrity"><ShieldCheck size={17}/><span>NeuroTrack is an educational self-tracking tool. These tasks do not diagnose ADHD, anxiety, or cognitive disorders.</span></div>
    <div className="panel learning-reading"><BookOpen size={18}/><div><b>How to use these observations</b><p>Compare your own sessions over time, note changes in sleep or environment, and treat patterns as questions for further reflection.</p></div><FlaskConical size={19}/></div>
  </section>;
}
