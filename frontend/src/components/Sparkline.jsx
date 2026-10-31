import { LEVEL_META } from '../utils/format.js';

const WIDTH = 120;
const HEIGHT = 32;
const HIGH_THRESHOLD = 0.7;

/** Density score (0..1) over time with the HIGH threshold drawn as a dashed line. */
export default function Sparkline({ points }) {
  if (!points || points.length < 2) {
    return <span className="text-xs text-slate-400">məlumat toplanır</span>;
  }
  const times = points.map((p) => new Date(p.t).getTime());
  const min = Math.min(...times);
  const span = Math.max(...times) - min || 1;
  const x = (t) => ((t - min) / span) * WIDTH;
  const y = (score) => HEIGHT - Math.min(Math.max(score, 0), 1) * HEIGHT;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(times[i]).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Son 30 dəqiqədə sıxlıq">
      <line
        x1="0"
        x2={WIDTH}
        y1={y(HIGH_THRESHOLD)}
        y2={y(HIGH_THRESHOLD)}
        stroke="#dc2626"
        strokeDasharray="3 3"
        strokeOpacity="0.5"
      />
      <path d={d} fill="none" stroke="#334155" strokeWidth="1.5" />
      <circle cx={x(times[times.length - 1])} cy={y(last.score)} r="3" fill={LEVEL_META[last.level].color} />
    </svg>
  );
}
