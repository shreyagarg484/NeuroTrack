import LabSuiteTask from './LabSuiteTask';

export default function VisualSearchTask({ onBack }: { onBack: () => void }) {
  return <LabSuiteTask task="visual-search" onBack={onBack} />;
}
