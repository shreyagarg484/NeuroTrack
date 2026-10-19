import LabSuiteTask from './LabSuiteTask';

export default function CorsiSpatialTask({ onBack }: { onBack: () => void }) {
  return <LabSuiteTask task="corsi-spatial" onBack={onBack} />;
}
