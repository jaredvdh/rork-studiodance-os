import { useMemo } from "react";

import type { RevenuePoint } from "@/data/types";
import { formatCurrency } from "@/lib/format";

/** Lightweight SVG area chart for monthly revenue — no external deps. */
export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const { path, area, points, max } = useMemo(() => {
    const w = 100;
    const h = 100;
    const values = data.map((d) => d.revenueCents).filter((v) => !Number.isNaN(v));

    // No valid data — render a flat line at the bottom
    if (values.length < 2) {
      const flatPath = `M0,${h} L${w},${h}`;
      return { path: flatPath, area: `${flatPath} L${w},${h} L0,${h} Z`, points: [{ x: 0, y: h, d: data[0] }, { x: w, y: h, d: data[data.length - 1] }], max: 0 };
    }

    const maxV = Math.max(...values) * 1.12;
    const minV = Math.min(...values) * 0.88;
    const range = maxV - minV || 1;
    const step = w / (Math.max(data.length, 2) - 1);
    const pts = data.map((d, i) => {
      const x = i * step;
      const raw = Number.isNaN(d.revenueCents) ? 0 : d.revenueCents;
      const y = h - ((raw - minV) / range) * h;
      return { x, y, d };
    });
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaPath = `${line} L${w},${h} L0,${h} Z`;
    return { path: line, area: areaPath, points: pts, max: maxV };
  }, [data]);

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-56 w-full">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--rose))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(var(--rose))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="hsl(var(--border))" strokeWidth="0.3" />
        ))}
        <path d={area} fill="url(#revFill)" />
        <path d={path} fill="none" stroke="hsl(var(--rose))" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.4" fill="hsl(var(--card))" stroke="hsl(var(--rose))" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-3 flex justify-between px-1 text-xs font-medium text-muted-foreground">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
      <span className="pointer-events-none absolute right-1 top-0 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
        peak {formatCurrency(max, true)}
      </span>
    </div>
  );
}
