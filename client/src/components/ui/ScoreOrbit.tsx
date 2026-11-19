interface ScoreOrbitProps {
  score: number | string;
  label?: string;
}

export default function ScoreOrbit({ score, label = 'FOCUS SCORE' }: ScoreOrbitProps) {
  return (
    <div className="result-orbit">
      <span>{score}</span>
      <small>{label}</small>
    </div>
  );
}

