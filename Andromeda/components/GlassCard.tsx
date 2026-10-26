'use client';
// Szklana karta ze ściętymi, zaokrąglonymi rogami (lewy górny i prawy dolny)
// oraz osobnymi szklanymi trójkątami w wycięciach — jak w „Glassy Login Form”.
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Pt = [number, number];

/** Ścieżka SVG wielokąta z zaokrąglonymi wierzchołkami (promień r przycinany do połowy krawędzi). */
function roundedPath(pts: Pt[], r: number): string {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const v1: Pt = [prev[0] - p[0], prev[1] - p[1]];
    const v2: Pt = [next[0] - p[0], next[1] - p[1]];
    const l1 = Math.hypot(...v1);
    const l2 = Math.hypot(...v2);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a: Pt = [p[0] + (v1[0] / l1) * rr, p[1] + (v1[1] / l1) * rr];
    const b: Pt = [p[0] + (v2[0] / l2) * rr, p[1] + (v2[1] / l2) * rr];
    d += `${i === 0 ? 'M' : 'L'}${a[0].toFixed(2)} ${a[1].toFixed(2)} Q${p[0]} ${p[1]} ${b[0].toFixed(2)} ${b[1].toFixed(2)} `;
  }
  return d + 'Z';
}

const CUT = 74; // wielkość wycięcia
const GAP = 12; // szczelina między kartą a trójkątem
const R = 22; // zaokrąglenie rogów karty
const TR = 12; // zaokrąglenie rogów trójkątów

export default function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cut = size ? Math.min(CUT, size.w / 4, size.h / 4) : CUT;
  const card = size
    ? roundedPath([[cut, 0], [size.w, 0], [size.w, size.h - cut], [size.w - cut, size.h], [0, size.h], [0, cut]], R)
    : null;
  const leg = cut - GAP * Math.SQRT2;
  const triTL = roundedPath([[0, 0], [leg, 0], [0, leg]], TR);
  const triBR = roundedPath([[leg, 0], [leg, leg], [0, leg]], TR);

  return (
    <div className={`gcard-wrap ${className}`}>
      <div ref={ref} className="gcard" style={card ? { clipPath: `path('${card}')` } : { borderRadius: R }}>
        {size && card && (
          <svg className="gcard-edge" width={size.w} height={size.h} aria-hidden="true">
            <defs>
              <linearGradient id="gc-edge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
                <stop offset="0.35" stopColor="#fff" stopOpacity="0.08" />
                <stop offset="0.7" stopColor="#8EC5FF" stopOpacity="0.12" />
                <stop offset="1" stopColor="#8EC5FF" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path d={card} fill="none" stroke="url(#gc-edge)" strokeWidth="2" />
          </svg>
        )}
        <div className="gcard-body">{children}</div>
      </div>
      {size && (
        <>
          <span className="gcard-tri" style={{ left: 0, top: 0, width: leg, height: leg, clipPath: `path('${triTL}')` }} aria-hidden="true">
            <svg width={leg} height={leg}><path d={triTL} fill="none" stroke="url(#gc-edge)" strokeWidth="2" /></svg>
          </span>
          <span className="gcard-tri" style={{ right: 0, bottom: 0, width: leg, height: leg, clipPath: `path('${triBR}')` }} aria-hidden="true">
            <svg width={leg} height={leg}><path d={triBR} fill="none" stroke="url(#gc-edge)" strokeWidth="2" /></svg>
          </span>
        </>
      )}
    </div>
  );
}
