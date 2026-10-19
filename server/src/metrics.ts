export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function scoreNback(trials: Array<{ match: boolean; response: boolean | null; rt: number | null }>) {
  const correct = trials.filter((trial) => trial.response !== null && trial.response === trial.match).length;
  const validRt = trials.flatMap((trial) => trial.rt === null ? [] : [trial.rt]);
  return { accuracy: trials.length ? Math.round(correct / trials.length * 100) : 0, medianRt: Math.round(median(validRt)), misses: trials.filter((trial) => trial.response === null).length };
}
