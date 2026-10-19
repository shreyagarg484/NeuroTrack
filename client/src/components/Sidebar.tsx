import { Apple, BarChart3, BookOpen, Brain, ChevronDown, FlaskConical, Home, Lightbulb, ListTodo, Network, Settings2, ShieldCheck, Smartphone, Timer, X } from 'lucide-react';

const items=[
  {page:'Overview',label:'Overview Dashboard',icon:Home},
  {page:'Testing lab',label:'Cognitive Lab',icon:FlaskConical},
  {page:'Task Scheduler',label:'Task Scheduler',icon:ListTodo},
  {page:'Focus & Habits',label:'Focus & Deep Work Tracker',icon:Timer},
  {page:'Context Journal & Check-in',label:'Context Journal & Hydration Tracker',icon:BookOpen},
  {page:'Analytics',label:'Analytics & Trends',icon:BarChart3},
  {page:'Insights',label:'Personal Insights Engine',icon:Lightbulb},
  {page:'NeuroNutri',label:'NeuroNutri Fueling',icon:Apple},
  {page:'Learn',label:'Learning & Science Hub',icon:Network},
  {page:'Privacy & settings',label:'Data & Privacy Center',icon:ShieldCheck},
  {page:'Settings',label:'Settings',icon:Settings2}
];
export default function Sidebar({active,onSelect,open,onClose}:{active:string;onSelect:(page:string)=>void;open:boolean;onClose:()=>void}){
  return <aside className={open?'sidebar open':'sidebar'}><div className="brand"><span className="brand-icon"><Network size={21}/></span><span>NeuroTrack<small>COGNITIVE SELF-TRACKING</small></span><button className="close-nav" onClick={onClose} aria-label="Close navigation"><X size={18}/></button></div><div className="side-label">WORKSPACE</div><nav aria-label="Main navigation">{items.map(({page,label,icon:Icon})=><button key={page} className={active===page?'nav-item active':'nav-item'} onClick={()=>{onSelect(page);onClose();}}><Icon size={17}/><span>{label}</span>{page==='Analytics'&&<span className="nav-dot"/>}</button>)}</nav><div className="side-bottom"><div className="privacy-mini"><ShieldCheck size={17}/><span><b>Your data stays local</b><small>Stored in your browser demo database</small></span></div><div className="user-row"><div className="avatar">NT</div><span><b>Personal workspace</b><small>Local demo</small></span><ChevronDown size={15}/></div></div></aside>;
}
