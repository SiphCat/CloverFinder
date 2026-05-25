"use client";

import { useEffect, useMemo, useRef } from "react";

type Props = {
  visible?: boolean;
  /** Map bearing in degrees — backdrop counter-rotates to match. */
  bearing?: number;
};

const PLANETS: {
  name: string;
  color: string;
  size: number;
  orbit: number;
  duration: number;
  startAngle: number;
}[] = [
  { name: "mercury", color: "#b5a799", size: 3,  orbit: 50,  duration: 8,   startAngle: 30  },
  { name: "venus",   color: "#e8cc82", size: 5,  orbit: 80,  duration: 13,  startAngle: 170 },
  { name: "earth-orbit", color: "#6699dd", size: 0, orbit: 120, duration: 18, startAngle: 0 },
  { name: "mars",    color: "#c86030", size: 4,  orbit: 160, duration: 24,  startAngle: 290 },
  { name: "jupiter", color: "#d4a86c", size: 9,  orbit: 240, duration: 48,  startAngle: 100 },
  { name: "saturn",  color: "#ead08a", size: 8,  orbit: 320, duration: 65,  startAngle: 230 },
  { name: "uranus",  color: "#7cccd4", size: 6,  orbit: 420, duration: 95,  startAngle: 55  },
  { name: "neptune", color: "#4468cc", size: 6,  orbit: 520, duration: 130, startAngle: 160 },
];

function generateStars(count: number, seed: number): string {
  const out: string[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 16807) % 2147483647;
    const x = s % 4000;
    s = (s * 16807) % 2147483647;
    const y = s % 4000;
    s = (s * 16807) % 2147483647;
    const a = 0.2 + (s % 80) / 100;
    s = (s * 16807) % 2147483647;
    const big = s % 100 < 4;
    s = (s * 16807) % 2147483647;
    const blue = s % 100 < 12;
    const sz = big ? 2 : 1;
    const c = blue ? `rgba(180,200,255,${a.toFixed(2)})` : `rgba(255,255,255,${a.toFixed(2)})`;
    out.push(`${x}px ${y}px 0 ${sz}px ${c}`);
  }
  return out.join(",");
}

export function SpaceBackdrop({ visible = true, bearing = 0 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stars1 = useMemo(() => generateStars(1200, 12345), []);
  const stars2 = useMemo(() => generateStars(500, 67890), []);

  useEffect(() => {
    if (!wrapRef.current) return;
    wrapRef.current.style.transform = `rotate(${-bearing}deg)`;
  }, [bearing]);

  if (!visible) return null;

  return (
    <div className="space-backdrop" ref={wrapRef} aria-hidden>
      {/* Dense starfield */}
      <div className="space-stars-layer" style={{ boxShadow: stars1 }} />
      <div className="space-stars-layer space-stars-layer--twinkle" style={{ boxShadow: stars2 }} />

      {/* Sun at center of solar system */}
      <div className="space-sun" />

      {/* Moon — orbits near Earth, not the Sun */}
      <div className="space-moon">
        <img src="/moon.png" alt="" className="space-moon-img" />
      </div>

      {/* Solar system — orbits centered on the Sun */}
      <div className="space-solar-system">
        {PLANETS.map((p) => (
          <div
            key={p.name}
            className="space-orbit-ring"
            style={{ width: p.orbit, height: p.orbit }}
          >
            {p.name !== "earth-orbit" ? (
              <div
                className="space-orbit-mover"
                style={{
                  animationDuration: `${p.duration}s`,
                  animationDelay: `-${(p.startAngle / 360) * p.duration}s`,
                }}
              >
                <div
                  className={`space-planet${p.name === "saturn" ? " space-planet--saturn" : ""}`}
                  style={{
                    width: p.size,
                    height: p.size,
                    background: `radial-gradient(circle at 35% 35%, ${p.color}, ${darken(p.color)})`,
                    boxShadow: `0 0 ${Math.max(p.size, 4)}px 1px ${p.color}40`,
                  }}
                />
              </div>
            ) : (
              <div className="space-orbit-ring--earth-marker" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function darken(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 60);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 60);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 60);
  return `rgb(${r},${g},${b})`;
}
