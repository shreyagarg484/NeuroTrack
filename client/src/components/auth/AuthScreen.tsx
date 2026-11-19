import { FormEvent, useState } from 'react';
import { ArrowRight, Brain, ShieldCheck } from 'lucide-react';
import NeuralGraphic from '../ui/NeuralGraphic';

interface AuthScreenProps {
  onSignIn: (name?: string) => void;
  onStartSetup: () => void;
}

export default function AuthScreen({ onSignIn, onStartSetup }: AuthScreenProps) {
  const [email, setEmail] = useState('alex.morgan@example.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    onSignIn(name || 'Alex Morgan');
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-mark">
            <Brain size={19} />
          </div>
          <span>
            neuro<span>track</span>
          </span>
        </div>
        <div className="auth-visual-copy">
          <span className="eyebrow burgundy-eyebrow">
            <span className="live-dot" /> A CLEARER WAY IN
          </span>
          <h1>
            Understand your
            <br />
            <em>mind in motion.</em>
          </h1>
          <p>Track the small signals that shape how you think, feel and focus.</p>
        </div>
        <NeuralGraphic />
        <div className="auth-quote">
          <p>&ldquo;The first step to changing your patterns is seeing them clearly.&rdquo;</p>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your space</h2>
          <p className="auth-subtitle">Your personal cognitive landscape is waiting.</p>

          <form onSubmit={handleSubmit}>
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <div className="form-meta">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />{' '}
                Remember me
              </label>
              <button type="button" className="text-button">
                Forgot password?
              </button>
            </div>

            <button className="primary-button auth-submit" type="submit">
              Continue <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            className="google-button"
            type="button"
            onClick={() => onSignIn('Alex Morgan')}
          >
            Continue with Demo Space <ArrowRight size={15} />
          </button>

          <p className="auth-switch">
            New to NeuroTrack?{' '}
            <button type="button" onClick={onStartSetup}>
              Create your space
            </button>
          </p>

          <div className="auth-trust">
            <ShieldCheck size={14} /> Your data is private, local and always yours.
          </div>
        </div>
      </div>
    </div>
  );
}

