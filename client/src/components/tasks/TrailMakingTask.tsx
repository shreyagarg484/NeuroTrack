import LabSuiteTask from './LabSuiteTask';

export default function TrailMakingTask({ onBack }: { onBack: () => void }) {
  return <LabSuiteTask task="trail-making" onBack={onBack} />;
}
