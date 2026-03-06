import { useEffect, useState } from "react";

interface CountdownProps {
  endsAt: string | null;
  onEnd?: () => void;
  className?: string;
}

function parseEndsAt(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const t = new Date(endsAt).getTime();
  return Number.isNaN(t) ? null : t;
}

export default function Countdown({ endsAt, onEnd, className = "" }: CountdownProps) {
  const end = parseEndsAt(endsAt);
  const [diff, setDiff] = useState<number | null>(end ? Math.max(0, end - Date.now()) : null);

  useEffect(() => {
    if (end == null) return;
    const tick = () => {
      const d = Math.max(0, end - Date.now());
      setDiff(d);
      if (d <= 0 && onEnd) onEnd();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end, onEnd]);

  if (diff == null) return <span className={className}>—</span>;
  if (diff <= 0) return <span className={`font-semibold text-slate-600 ${className}`}>Finalizado</span>;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <span className={`font-mono font-semibold tabular-nums text-[#0746ad] ${className}`}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
