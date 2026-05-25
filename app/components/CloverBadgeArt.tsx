import type { ReactNode } from "react";
import { useId } from "react";
import { themeForLeaves } from "@/lib/badgeArtThemes";

type Props = {
  leaves: number;
  size?: number;
  className?: string;
};

function petalPath(cx: number, cy: number, angleDeg: number, scale: number): string {
  const rad = (angleDeg * Math.PI) / 180;
  const px = cx + Math.cos(rad) * 24 * scale;
  const py = cy + Math.sin(rad) * 24 * scale;
  const tipX = cx + Math.cos(rad) * 42 * scale;
  const tipY = cy + Math.sin(rad) * 42 * scale;
  const leftRad = rad - Math.PI / 2;
  const rightRad = rad + Math.PI / 2;
  const w = 14 * scale;
  const lx = px + Math.cos(leftRad) * w;
  const ly = py + Math.sin(leftRad) * w;
  const rx = px + Math.cos(rightRad) * w;
  const ry = py + Math.sin(rightRad) * w;
  return `M ${lx} ${ly} Q ${px} ${py} ${tipX} ${tipY} Q ${px} ${py} ${rx} ${ry} Z`;
}

/** Multi-leaf clover badge — distinct look per leaf count (4–10). */
export function CloverBadgeArt({ leaves, size = 112, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const gid = (s: string) => `${s}-${uid}`;
  const n = Math.min(10, Math.max(4, Math.round(leaves)));
  const theme = themeForLeaves(n);
  const cx = 60;
  const cy = 56;
  const petals: ReactNode[] = [];

  for (let i = 0; i < n; i++) {
    const angle = (360 / n) * i - 90;
    petals.push(
      <path
        key={i}
        d={petalPath(cx, cy, angle, 1)}
        fill={`url(#${gid("leafFill")})`}
        stroke={`url(#${gid("leafStroke")})`}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    );
    const rad = (angle * Math.PI) / 180;
    const vx = cx + Math.cos(rad) * 30;
    const vy = cy + Math.sin(rad) * 30;
    const tx = cx + Math.cos(rad) * 38;
    const ty = cy + Math.sin(rad) * 38;
    petals.push(
      <line
        key={`v-${i}`}
        x1={vx}
        y1={vy}
        x2={tx}
        y2={ty}
        stroke={theme.stem}
        strokeWidth="0.7"
        opacity="0.35"
      />
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${n}-leaf clover badge`}
    >
      <defs>
        <radialGradient id={gid("bgGlow")} cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor={theme.glow[0]} />
          <stop offset="50%" stopColor={theme.glow[1]} />
          <stop offset="100%" stopColor={theme.glow[2]} />
        </radialGradient>
        <linearGradient id={gid("leafFill")} x1="20%" y1="10%" x2="80%" y2="95%">
          <stop offset="0%" stopColor={theme.leaf[0]} />
          <stop offset="50%" stopColor={theme.leaf[1]} />
          <stop offset="100%" stopColor={theme.leaf[2]} />
        </linearGradient>
        <linearGradient id={gid("leafStroke")} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.stroke[0]} />
          <stop offset="100%" stopColor={theme.stroke[1]} />
        </linearGradient>
        <filter id={gid("softGlow")} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={gid("badgeShine")}>
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={theme.ring} floodOpacity="0.45" />
        </filter>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r="54"
        fill={`url(#${gid("bgGlow")})`}
        filter={`url(#${gid("softGlow")})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r="50"
        fill="none"
        stroke={theme.ring}
        strokeWidth="2"
        opacity="0.55"
      />
      {theme.accent ? (
        <circle cx={cx} cy={cy - 38} r="4" fill={theme.accent} opacity="0.9" />
      ) : null}
      <g filter={`url(#${gid("badgeShine")})`}>{petals}</g>
      <circle cx={cx} cy={cy} r="5" fill={theme.stem} />
      <rect x="57" y="58" width="6" height="32" rx="2.5" fill={theme.stem} />
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        letterSpacing="0.06em"
        fill={theme.label}
        stroke={theme.stem}
        strokeWidth="0.4"
      >
        {n} LEAVES
      </text>
    </svg>
  );
}
