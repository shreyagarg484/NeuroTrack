import LabSuiteTask from './LabSuiteTask';

export default function TimePerceptionTask({ onBack }: { onBack: () => void }) {
  return <LabSuiteTask task="time-perception" onBack={onBack} />;
}
