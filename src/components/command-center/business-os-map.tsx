import Link from "next/link";
import { OPERATING_SYSTEMS } from "@/lib/navigation/command-center-nav";

export function BusinessOsMap() {
  const nodes = OPERATING_SYSTEMS.slice(0, 6);
  const cx = 200;
  const cy = 140;
  const radius = 105;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Business OS Overview</h2>
        <Link href="/platform" className="text-sm font-medium text-primary hover:underline">
          View OS Map →
        </Link>
      </div>

      <div className="relative mx-auto h-[280px] max-w-2xl">
        <svg viewBox="0 0 400 280" className="h-full w-full" aria-hidden>
          {nodes.map((_, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="#dbeafe"
                strokeWidth="2"
              />
            );
          })}
          <circle cx={cx} cy={cy} r="36" fill="url(#osGradient)" />
          <defs>
            <linearGradient id="osGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#003399" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill="white"
            fontSize="28"
            fontWeight="700"
          >
            A
          </text>
        </svg>

        {nodes.map((node, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const left = 50 + (Math.cos(angle) * radius) / 4;
          const top = 50 + (Math.sin(angle) * radius) / 2.8;
          return (
            <Link
              key={node.id}
              href={node.href}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary sm:text-xs"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              {node.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
