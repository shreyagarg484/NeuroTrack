import type { ReactNode } from 'react';

/** Accessible component boundary for the N-back task view whose controls live in App state. */
export default function NBackTask({ children }: { children: ReactNode }) {
  return <section id="nback-task" className="nback-task-component" aria-label="N-back task">{children}</section>;
}
