/**
 * NeuroTrack adapters around free React Bits components.
 * Every adapter applies the NeuroTrack warm palette, guards expensive effects on
 * touch / reduced-motion devices, and keeps the app's existing value/onChange contracts.
 */
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import SpotlightCard from '../react-bits/SpotlightCard';
import BorderGlow from '../react-bits/BorderGlow';
import SpecularButton from '../react-bits/SpecularButton';
import GlideSelect from '../react-bits/GlideSelect';
import ElasticSlider from '../react-bits/ElasticSlider';
import WakeSlider from '../react-bits/WakeSlider';
import AnimatedContent from '../react-bits/AnimatedContent/AnimatedContent';
import Magnet from '../react-bits/Magnet/Magnet';
import ClickSpark from '../react-bits/ClickSpark/ClickSpark';
import GlowCursor from '../react-bits/GlowCursor';

/* ------------------------------------------------------------------ hooks */

export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setFine(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return fine;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

/* -------------------------------------------------------------- glow cards */

type GlowCardProps = {
  children: ReactNode;
  className?: string;
  variant?: 'spotlight' | 'border';
  glowColor?: string;
  onClick?: () => void;
  role?: string;
};

/** Restrained, cursor-following spotlight or illuminated border for data cards. */
export function GlowCard({
  children,
  className = '',
  variant = 'spotlight',
  glowColor = 'rgba(100, 23, 47, 0.18)',
  ...rest
}: GlowCardProps) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const active = fine && !reduced;

  if (variant === 'border') {
    return (
      <BorderGlow
        className={`nt-glow-card ${className}`}
        glowColor={glowColor}
        backgroundColor="var(--cream)"
        borderRadius={12}
        glowRadius={110}
        glowIntensity={active ? 0.4 : 0}
        coneSpread={32}
        animated={false}
        {...rest}
      >
        {children}
      </BorderGlow>
    );
  }

  return (
    <SpotlightCard
      className={`nt-glow-card ${className}`}
      theme="light"
      spotlightColor={glowColor}
      intensity={active ? 0.12 : 0}
      spotlightSize={230}
      softness={0.85}
      borderGlow={active ? 0.3 : 0}
      proximity={0.75}
      ambient={false}
      flare={false}
      grain={0}
      style={
        {
          '--spotlight-card-surface': 'var(--cream)',
          '--spotlight-card-border': 'var(--line)',
          '--spotlight-card-shadow': 'var(--shadow)',
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </SpotlightCard>
  );
}

/* ----------------------------------------------------------------- buttons */

type SpecularCtaProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  ariaLabel?: string;
  tone?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
};

/** Primary CTA with a subtle reflective highlight. The action is never delayed. */
export function SpecularCta({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  loading = false,
  loadingText = 'Working…',
  ariaLabel,
  tone = 'primary',
  size = 'md',
}: SpecularCtaProps) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const inactive = disabled || loading;
  const primary = tone === 'primary';

  return (
    <SpecularButton
      type={type}
      onClick={onClick}
      disabled={inactive}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={`nt-specular ${primary ? 'nt-specular--primary' : 'nt-specular--secondary'} ${className}`}
      size={size}
      radius={9}
      tint={primary ? '#64172F' : '#EFE4D5'}
      tintOpacity={primary ? 1 : 1}
      baseColor={primary ? '#64172F' : '#EFE4D5'}
      lineColor={primary ? '#8a2b48' : '#ccb9a8'}
      textColor={primary ? '#FFFAF5' : '#501225'}
      intensity={fine && !reduced ? 0.45 : 0.18}
      idleIntensity={fine && !reduced ? 0.16 : 0.12}
      glow={0}
      thickness={1}
      followMouse={fine && !reduced}
      autoAnimate={false}
    >
      <span className="nt-specular-label">
        {loading ? (
          <>
            <span className="nt-spinner" aria-hidden="true" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </span>
    </SpecularButton>
  );
}

/* ------------------------------------------------------------ form controls */

type Option = { value: string; label: string };

type GlideFieldProps = {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

/** Dropdown with the same controlled contract as the native select it replaces. */
export function GlideField({
  label,
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  className = '',
}: GlideFieldProps) {
  const handleChange = useCallback((next: string) => onChange(next), [onChange]);
  return (
    <div className={`nt-glide-field ${className}`}>
      {label && <span className="nt-field-label">{label}</span>}
      <GlideSelect
        options={options.map((option) => ({ value: option.value, label: option.label }))}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        ariaLabel={ariaLabel || label}
        accentColor="#64172F"
        surfaceColor="#FBF7F1"
        highlightColor="#F3E5E5"
        textColor="#2d3035"
        size="sm"
        radius={9}
        menuWidth={220}
        showTags={false}
      />
    </div>
  );
}

type ElasticRangeProps = {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

/** Elastic range control for settings and journal scales. */
export function ElasticRange({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  disabled = false,
  ariaLabel,
  className = '',
}: ElasticRangeProps) {
  return (
    <div className={`nt-range-field ${className}`}>
      {label && <span className="nt-field-label">{label}</span>}
      <ElasticSlider
        value={value}
        startingValue={min}
        maxValue={max}
        isStepped
        stepSize={step}
        onChange={onChange}
        formatValue={formatValue}
        disabled={disabled}
        ariaLabel={ariaLabel || label}
        trackColor="#EFE4D5"
        rangeColor="#64172F"
        thumbColor="#64172F"
        iconColor="#805348"
        contentColor="#2d3035"
        valuePosition="bubble"
        thumb
        growOnHover={false}
        maxStretch={4}
        bounce={0.35}
        wheel={false}
      />
    </div>
  );
}

type WakeRangeProps = {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

/** Wave-style range control, used for live audio volume where it adds meaning. */
export function WakeRange({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  formatValue,
  disabled = false,
  ariaLabel,
  className = '',
}: WakeRangeProps) {
  return (
    <div className={`nt-wake-field ${className}`}>
      {label && <span className="nt-field-label">{label}</span>}
      <WakeSlider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        formatValue={formatValue ?? ((v) => `${Math.round(v * 100)}%`)}
        disabled={disabled}
        ariaLabel={ariaLabel || label}
        fillColor="#64172F"
        trackColor="#EFE4D5"
        crestColor="#B77B55"
        showValue={false}
        bars={26}
        height={34}
      />
    </div>
  );
}

/* ------------------------------------------------------------- motion utils */

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function SectionReveal({ children, className = '', delay = 0 }: SectionRevealProps) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <AnimatedContent
      className={className}
      distance={16}
      direction="vertical"
      duration={0.45}
      delay={delay}
      ease="power2.out"
      threshold={0.12}
      animateOpacity
      initialOpacity={0}
      scale={1}
      blur={0}
    >
      {children}
    </AnimatedContent>
  );
}

type MagneticProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
};

export function Magnetic({ children, className, strength = 0.12 }: MagneticProps) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  return (
    <Magnet
      wrapperClassName={className}
      disabled={!fine || reduced}
      magnetStrength={strength}
      maxOffset={8}
      padding={4}
    >
      {children}
    </Magnet>
  );
}

type ClickSparkleProps = {
  children: ReactNode;
  className?: string;
};

export function ClickSparkle({ children, className }: ClickSparkleProps) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  return (
    <ClickSpark
      className={className}
      disabled={!fine || reduced}
      sparkColor="#B77B55"
      sparkCount={5}
      sparkSize={7}
      sparkRadius={14}
      duration={320}
      glow={0}
    >
      {children}
    </ClickSpark>
  );
}

/** Restrained desktop-only cursor halo. The native cursor stays visible. */
export function CursorGlow() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  if (!fine || reduced) return null;
  return (
    <GlowCursor
      color="rgba(100, 23, 47, 0.10)"
      secondaryColor="rgba(183, 123, 85, 0.08)"
      intensity={0.25}
      glow={0.35}
      hotspot={0}
      trailWidth={14}
      quality="low"
      maxDevicePixelRatio={1.5}
      blendMode="source-over"
      clickBurst={false}
      grain={0}
      enabled
      aria-hidden="true"
    />
  );
}
