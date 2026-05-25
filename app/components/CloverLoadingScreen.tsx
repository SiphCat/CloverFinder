type Props = {
  /** Optional caption under the clover. */
  label?: string;
  className?: string;
  /** Full viewport overlay vs inline in a panel/map. */
  variant?: "inline" | "fullscreen";
};

/** Heart leaf pointing up — subtle top cleft, tip toward center. */
const HEART_LEAF_PATH =
  "M 50 17 C 46.5 17 42.5 19 40.5 24 C 38.5 29 39.5 36 50 43 C 60.5 36 61.5 29 59.5 24 C 57.5 19 53.5 17 50 17 Z";

/** White vein pattern — visible only while a leaf is lit. */
const LEAF_PATTERN_PATHS = [
  "M 50 41 L 50 20",
  "M 50 33 L 43 26",
  "M 50 33 L 57 26",
  "M 47 22 Q 50 18.5 53 22",
  "M 44 28 Q 50 23.5 56 28"
] as const;

/** Plus hub linking leaves without letting them touch. */
const CROSS_PATH =
  "M 47 36 L 53 36 L 53 47 L 64 47 L 64 53 L 53 53 L 53 64 L 47 64 L 47 53 L 36 53 L 36 47 L 47 47 Z";

/** Stem in screen-down coords (2.5× length): straight 3/4, curve left in last quarter. */
const STEM_PATH = "M 0 0 L 0 28.125 C 0 31.25 -5 35 -10 37.5";

const LEAF_ROTATIONS = [0, 90, 180, 270] as const;
const CLOVER_ROTATE = 45;
const CLOVER_CENTER = { x: 50, y: 52 };
const STEM_ATTACH = { x: 50, y: 50 };

/**
 * Four heart-shaped clover loader — one leaf fills green at a time (0.5s each, 2s loop).
 */
export function CloverLoadingScreen({
  label,
  className,
  variant = "inline"
}: Props) {
  const rootClass = [
    "clover-loading",
    variant === "fullscreen" ? "clover-loading--fullscreen" : "",
    className ?? ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-label={label ?? "Loading"}>
      <svg
        className="clover-loading-svg"
        viewBox="0 0 100 108"
        width={88}
        height={95}
        aria-hidden
      >
        <g
          transform={`rotate(${CLOVER_ROTATE} ${CLOVER_CENTER.x} ${CLOVER_CENTER.y})`}
          className="clover-loading-shape"
        >
          <path className="clover-loading-cross" d={CROSS_PATH} />
          <g
            transform={`translate(${STEM_ATTACH.x} ${STEM_ATTACH.y}) rotate(${-CLOVER_ROTATE})`}
          >
            <path className="clover-loading-stem" d={STEM_PATH} />
          </g>
          {LEAF_ROTATIONS.map((angle, index) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              <g className={`clover-loading-leaf-wrap clover-loading-leaf-wrap--${index + 1}`}>
                <path className="clover-loading-leaf" d={HEART_LEAF_PATH} />
                <g className={`clover-loading-leaf-pattern clover-loading-leaf-pattern--${index + 1}`}>
                  {LEAF_PATTERN_PATHS.map((d, i) => (
                    <path key={i} className="clover-loading-leaf-pattern-line" d={d} />
                  ))}
                </g>
              </g>
            </g>
          ))}
        </g>
      </svg>
      {label ? <p className="clover-loading-label">{label}</p> : null}
    </div>
  );
}
