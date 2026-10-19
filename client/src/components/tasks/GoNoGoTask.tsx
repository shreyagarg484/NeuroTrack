import LabSuiteTask from './LabSuiteTask';

export default function GoNoGoTask({ onBack }: { onBack: () => void }) {
  return <LabSuiteTask task="go-no-go" onBack={onBack} />;
}
