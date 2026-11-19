import {
  Apple,
  BarChart3,
  BookOpen,
  Brain,
  CircleHelp,
  Home,
  Layers3,
  ListTodo,
  LogOut,
  MoreHorizontal,
  Network,
  Settings2,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';

export interface SidebarProps {
  active: string;
  onSelect: (page: string) => void;
  open: boolean;
  onClose: () => void;
  userName?: string;
  sessionCount?: number;
  onSignOut?: () => void;
}

export default function Sidebar({
  active,
  onSelect,
  open,
  onClose,
  userName = 'Alex Morgan',
  sessionCount = 4,
  onSignOut,
}: SidebarProps) {
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleNav = (page: string) => {
    onSelect(page);
    onClose();
  };

  return (
    <aside className={`sidebar ${open ? 'sidebar-open open' : ''}`}>
      <div className="flex items-center justify-between">
        <button
          className="brand-lockup cursor-pointer"
          onClick={() => handleNav('Overview')}
        >
          <div className="brand-mark">
            <Brain size={19} strokeWidth={2.3} />
          </div>
          <span>
            neuro<span>track</span>
          </span>
        </button>
        {open && (
          <button
            className="icon-button lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="workspace-label">MY SPACE</div>
      <nav className="main-nav" aria-label="My Space navigation">
        <button
          className={`nav-item ${active === 'Overview' ? 'active' : ''}`}
          onClick={() => handleNav('Overview')}
        >
          <Home size={17} />
          <span>Overview</span>
        </button>
        <button
          className={`nav-item ${['Testing lab', 'Reaction Test', 'Stroop Task', 'Choice Reaction', 'Go / No-Go', 'Digit Span', 'Corsi Spatial', 'Visual Search', 'Time Perception', 'Trail Making'].includes(active) ? 'active' : ''}`}
          onClick={() => handleNav('Testing lab')}
        >
          <Layers3 size={17} />
          <span>Cognitive Lab</span>
          <span className="nav-count">10</span>
        </button>
        <button
          className={`nav-item ${active === 'Focus & Habits' ? 'active' : ''}`}
          onClick={() => handleNav('Focus & Habits')}
        >
          <Timer size={17} />
          <span>Focus & Habits</span>
        </button>
        <button
          className={`nav-item ${active === 'Context Journal & Check-in' ? 'active' : ''}`}
          onClick={() => handleNav('Context Journal & Check-in')}
        >
          <BookOpen size={17} />
          <span>Context & Hydration</span>
        </button>
        <button
          className={`nav-item ${active === 'Task Scheduler' ? 'active' : ''}`}
          onClick={() => handleNav('Task Scheduler')}
        >
          <ListTodo size={17} />
          <span>Task Scheduler</span>
        </button>
      </nav>

      <div className="workspace-label second-label">ANALYTICS & SCIENCE</div>
      <nav className="main-nav" aria-label="Analytics and science navigation">
        <button
          className={`nav-item ${active === 'Analytics' ? 'active' : ''}`}
          onClick={() => handleNav('Analytics')}
        >
          <BarChart3 size={17} />
          <span>Analytics & Trends</span>
          <span className="nav-dot" />
        </button>
        <button
          className={`nav-item ${active === 'Insights' ? 'active' : ''}`}
          onClick={() => handleNav('Insights')}
        >
          <Sparkles size={17} />
          <span>Insights Engine</span>
        </button>
        <button
          className={`nav-item ${active === 'NeuroNutri' ? 'active' : ''}`}
          onClick={() => handleNav('NeuroNutri')}
        >
          <Apple size={17} />
          <span>NeuroNutri Fueling</span>
        </button>
        <button
          className={`nav-item ${active === 'Learn' ? 'active' : ''}`}
          onClick={() => handleNav('Learn')}
        >
          <Network size={17} />
          <span>Learning Hub</span>
        </button>
      </nav>

      <div className="workspace-label second-label">ACCOUNT & DATA</div>
      <nav className="main-nav" aria-label="Account navigation">
        <button
          className={`nav-item ${active === 'Settings' ? 'active' : ''}`}
          onClick={() => handleNav('Settings')}
        >
          <Settings2 size={17} />
          <span>Profile & Settings</span>
        </button>
        <button
          className={`nav-item ${active === 'Privacy & settings' ? 'active' : ''}`}
          onClick={() => handleNav('Privacy & settings')}
        >
          <ShieldCheck size={17} />
          <span>Data & Privacy</span>
        </button>
        {onSignOut && (
          <button className="nav-item" onClick={onSignOut}>
            <LogOut size={17} />
            <span>Switch / Welcome</span>
          </button>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="mini-progress">
          <div className="mini-progress-top">
            <span>Weekly rhythm</span>
            <span>{Math.min(sessionCount, 5)}/5</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${Math.min(100, (sessionCount / 5) * 100)}%` }} />
          </div>
          <p>
            {sessionCount >= 5
              ? 'Goal reached for this week!'
              : `${5 - Math.min(sessionCount, 4)} more check-in${5 - Math.min(sessionCount, 4) > 1 ? 's' : ''} to keep your rhythm.`}
          </p>
        </div>

        <button
          className="help-link"
          onClick={() => handleNav('Privacy & settings')}
        >
          <CircleHelp size={15} /> Local Demo & Privacy
        </button>

        <div
          className="profile-chip"
          onClick={() => handleNav('Settings')}
          title="Open settings"
        >
          <div className="avatar">{initials}</div>
          <div>
            <strong>{userName}</strong>
            <span>Personal space</span>
          </div>
          <MoreHorizontal size={16} className="muted-icon" />
        </div>
      </div>
    </aside>
  );
}
