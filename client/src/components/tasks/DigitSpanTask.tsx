import LabSuiteTask from './LabSuiteTask';

export default function DigitSpanTask({ onBack }: { onBack: () => void }) {
  return <LabSuiteTask task="digit-span" onBack={onBack} />;
}
