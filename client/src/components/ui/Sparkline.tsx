export default function Sparkline({ variant }: { variant: 'up' | 'steady' }) {
  return (
    <svg className="sparkline" viewBox="0 0 88 34" aria-hidden="true">
      <path
        d={
          variant === 'up'
            ? 'M2 29 C 12 24, 16 13, 26 20 S 42 28, 49 14 S 63 25, 73 12 S 82 10, 86 3'
            : 'M2 25 C 12 21, 16 16, 24 18 S 37 14, 43 8 S 53 25, 63 24 S 75 13, 86 9'
        }
      />
    </svg>
  );
}

