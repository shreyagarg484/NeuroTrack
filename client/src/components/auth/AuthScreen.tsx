import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, Brain, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import NeuralGraphic from '../ui/NeuralGraphic';
import { SectionReveal, SpecularCta } from '../ui/reactBitsAdapters';

interface AuthScreenProps {
  onSignIn: (name?: string) => void;
  onStartSetup: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Local-demo password feedback only. No backend password policy exists. */
function passwordStrength(value: string) {
  const checks = [
    value.length >= 8,
    /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
  return { score: checks.filter(Boolean).length, checks };
}

export default function AuthScreen({ onSignIn, onStartSetup }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('alex.morgan@example.com');
  const [password, setPassword] = useState('password');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  function validate() {
    const next: typeof errors = {};
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.';
    if (mode === 'signup') {
      if (strength.score < 2) next.password = 'Use at least 8 characters with a number or symbol.';
      if (confirmPassword !== password) next.confirm = 'Passwords do not match.';
    } else if (!password) {
      next.password = 'Enter your password.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    // Preserve the existing local-demo flow: sign in goes straight to the app,
    // create-account continues to the existing onboarding screen. No fake backend.
    requestAnimationFrame(() => {
      if (mode === 'signup') onStartSetup();
      else onSignIn(name || 'Alex Morgan');
    });
  };

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setErrors({});
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
        <SectionReveal delay={0.04}>
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
        </SectionReveal>
        <NeuralGraphic />
        <div className="auth-quote">
          <p>&ldquo;The first step to changing your patterns is seeing them clearly.&rdquo;</p>
        </div>
      </div>

      <div className="auth-form-wrap">
        <SectionReveal delay={0.08}>
          <div className="auth-form">
            <div className="auth-mode-tabs" role="tablist" aria-label="Account access">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                className={mode === 'signin' ? 'active' : ''}
                onClick={() => switchMode('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={mode === 'signup' ? 'active' : ''}
                onClick={() => switchMode('signup')}
              >
                Create account
              </button>
            </div>

            <span className="eyebrow">{mode === 'signin' ? 'WELCOME BACK' : 'BEGIN YOUR SPACE'}</span>
            <h2>{mode === 'signin' ? 'Sign in to your space' : 'Create your space'}</h2>
            <p className="auth-subtitle">
              {mode === 'signin'
                ? 'Your personal cognitive landscape is waiting.'
                : 'Set up a private, local profile in a few seconds.'}
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <label className={`auth-field ${errors.email ? 'has-error' : ''}`}>
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((current) => ({ ...current, email: undefined })); }}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'auth-email-error' : undefined}
                  required
                />
                {errors.email && <small id="auth-email-error" className="auth-field-error" role="alert">{errors.email}</small>}
              </label>

              <label className={`auth-field ${errors.password ? 'has-error' : ''}`}>
                <span>Password</span>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((current) => ({ ...current, password: undefined })); }}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'auth-password-error' : undefined}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {mode === 'signup' && password && (
                  <div className="password-strength" aria-label={`Password strength: ${strength.score} of 4`}>
                    {[0, 1, 2, 3].map((index) => (
                      <i key={index} className={index < strength.score ? `level-${strength.score}` : ''} />
                    ))}
                    <small>{['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength.score]}</small>
                  </div>
                )}
                {errors.password && <small id="auth-password-error" className="auth-field-error" role="alert">{errors.password}</small>}
              </label>

              {mode === 'signup' && (
                <label className={`auth-field ${errors.confirm ? 'has-error' : ''}`}>
                  <span>Confirm password</span>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors((current) => ({ ...current, confirm: undefined })); }}
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirm)}
                      aria-describedby={errors.confirm ? 'auth-confirm-error' : undefined}
                      required
                    />
                    {confirmPassword && confirmPassword === password && <Check size={15} className="auth-match" aria-hidden="true" />}
                  </div>
                  {errors.confirm && <small id="auth-confirm-error" className="auth-field-error" role="alert">{errors.confirm}</small>}
                </label>
              )}

              {mode === 'signin' && (
                <div className="form-meta">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />{' '}
                    Remember me
                  </label>
                  <button type="button" className="text-button" onClick={() => setErrors({ email: 'Password reset is not available in this local demo.' })}>
                    Forgot password?
                  </button>
                </div>
              )}

              <SpecularCta
                type="submit"
                className="auth-submit"
                loading={loading}
                loadingText={mode === 'signup' ? 'Preparing…' : 'Signing in…'}
                ariaLabel={mode === 'signin' ? 'Continue' : 'Create account'}
              >
                {mode === 'signin' ? 'Continue' : 'Create account'} <ArrowRight size={16} />
              </SpecularCta>
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
              {mode === 'signin' ? 'New to NeuroTrack?' : 'Already have a space?'}{' '}
              <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Create your space' : 'Sign in instead'}
              </button>
            </p>

            <div className="auth-trust">
              <ShieldCheck size={14} /> Your data is private, local and always yours.
            </div>
          </div>
        </SectionReveal>
      </div>
    </div>
  );
}
