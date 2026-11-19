import { useState } from 'react';
import { ArrowLeft, ArrowRight, Brain, Check, Moon, ShieldCheck, Target, Wind } from 'lucide-react';

interface OnboardingScreenProps {
  onBack: () => void;
  onFinish: (preferences: { focusAreas: string[]; peakTime: string }) => void;
}

export default function OnboardingScreen({ onBack, onFinish }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['My memory']);
  const [peakTime, setPeakTime] = useState('Late morning');

  const toggleGoal = (title: string) => {
    setSelectedGoals((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
    );
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onFinish({ focusAreas: selectedGoals, peakTime });
    }
  };

  return (
    <div className="onboarding-shell">
      <div className="onboarding-top">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Brain size={19} />
          </div>
          <span>
            neuro<span>track</span>
          </span>
        </div>
        <button
          className="outline-button"
          onClick={() => (step === 1 ? onBack() : setStep(1))}
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div className="onboarding-content">
        <div className="onboarding-progress">
          <span className="active" />
          <span className={step === 2 ? 'active' : ''} />
        </div>

        {step === 1 ? (
          <>
            <span className="eyebrow burgundy-eyebrow">LET&apos;S MAKE IT PERSONAL</span>
            <h1>
              What would you like
              <br />
              to understand better?
            </h1>
            <p>Select all that feel relevant. There&apos;s no wrong answer.</p>

            <div className="choice-grid">
              <ChoiceCard
                icon={<Target size={19} />}
                title="My focus"
                detail="Attention & flow"
                selected={selectedGoals.includes('My focus')}
                onClick={() => toggleGoal('My focus')}
              />
              <ChoiceCard
                icon={<Brain size={19} />}
                title="My memory"
                detail="Recall & clarity"
                selected={selectedGoals.includes('My memory')}
                onClick={() => toggleGoal('My memory')}
              />
              <ChoiceCard
                icon={<Moon size={19} />}
                title="My sleep"
                detail="Rest & recovery"
                selected={selectedGoals.includes('My sleep')}
                onClick={() => toggleGoal('My sleep')}
              />
              <ChoiceCard
                icon={<Wind size={19} />}
                title="My mood"
                detail="Energy & balance"
                selected={selectedGoals.includes('My mood')}
                onClick={() => toggleGoal('My mood')}
              />
            </div>
          </>
        ) : (
          <>
            <span className="eyebrow burgundy-eyebrow">YOUR DAILY RHYTHM</span>
            <h1>
              When do you feel
              <br />
              most <em>clear?</em>
            </h1>
            <p>We&apos;ll use this to suggest a routine that fits your natural energy.</p>

            <div className="time-choice">
              {[
                { time: 'Morning', range: '6 AM — 9 AM' },
                { time: 'Late morning', range: '9 AM — 12 PM' },
                { time: 'Afternoon', range: '12 PM — 5 PM' },
                { time: 'Evening', range: '5 PM — 10 PM' },
              ].map(({ time, range }) => (
                <button
                  key={time}
                  type="button"
                  className={peakTime === time ? 'selected' : ''}
                  onClick={() => setPeakTime(time)}
                >
                  <span>{time}</span>
                  <small>{range}</small>
                  {peakTime === time && <Check size={16} />}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          className="primary-button onboarding-button"
          onClick={handleContinue}
        >
          {step === 1 ? 'Continue' : 'Finish setup'} <ArrowRight size={16} />
        </button>

        <span className="onboarding-note">
          <ShieldCheck size={14} /> You can change this anytime in settings.
        </span>
      </div>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  detail,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`choice-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="choice-icon">{icon}</div>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      {selected && <Check size={16} className="choice-check" />}
    </button>
  );
}

