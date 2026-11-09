import React from "react";
import type { Background, Effect, SceneProp } from "./types";

// Bối cảnh, đạo cụ và hiệu ứng vẽ bằng SVG cho khung 1080×1920. Mặt đất ở GROUND.
export const W = 1080;
export const H = 1920;
export const GROUND = 1480;

const SKY: Record<Background, [string, string, string]> = {
  paris: ["#9ad7ff", "#e6f6ff", "#f3ead8"],
  city: ["#ffcf9e", "#ffe9d2", "#d9d2c7"],
  room: ["#f4efe6", "#f4efe6", "#c9a77c"],
  office: ["#e9eef3", "#e9eef3", "#b9c2cc"],
  gym: ["#2d3142", "#3d4258", "#5c5f73"],
  dojo: ["#f2e3c6", "#f2e3c6", "#b98b5a"],
  space: ["#070b1f", "#1b1f45", "#2a2f5c"],
  night: ["#121a3a", "#2b3566", "#2a2e3d"],
  classroom: ["#e8f0e2", "#e8f0e2", "#b6a58b"],
  street: ["#bfe3ff", "#eaf6ff", "#9da3ab"],
  void: ["#fff7e0", "#ffe8b0", "#ffe8b0"],
  earth: ["#070b1f", "#14183a", "#14183a"],
};

/** Màu nét/chữ hợp nền (nền tối dùng nét trắng). */
export const inkFor = (bg: Background) => (["gym", "space", "night", "earth"].includes(bg) ? "#f5f5f7" : "#1b1b1f");
export const skinFor = (bg: Background) => (["gym", "space", "night", "earth"].includes(bg) ? "#2a2e3d" : "#ffffff");

export const Backdrop: React.FC<{ bg: Background; frame: number; boardText?: string }> = ({ bg, frame, boardText }) => {
  const [top, mid, floor] = SKY[bg];
  const ink = inkFor(bg);
  const drift = (frame * 0.6) % W;
  const stars = (n: number) =>
    Array.from({ length: n }).map((_, i) => (
      <circle key={i} cx={(i * 197) % W} cy={(i * 331) % 1300} r={2 + (i % 3)} fill="#fff" opacity={0.4 + 0.6 * Math.abs(Math.sin(frame / 20 + i))} />
    ));
  return (
    <g>
      <defs>
        <linearGradient id={`sky-${bg}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={mid} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={GROUND} fill={`url(#sky-${bg})`} />
      <rect x={0} y={GROUND} width={W} height={H - GROUND} fill={floor} />
      <line x1={0} y1={GROUND} x2={W} y2={GROUND} stroke={ink} strokeWidth={10} />
      {bg === "paris" || bg === "street" ? (
        <g fill="#fff" opacity={0.9}>
          <ellipse cx={(200 + drift) % (W + 300) - 150} cy={520} rx={110} ry={36} />
          <ellipse cx={(700 + drift * 0.7) % (W + 300) - 150} cy={640} rx={90} ry={30} />
        </g>
      ) : null}
      {bg === "city" || bg === "street" ? (
        <g fill={bg === "city" ? "#d58a5c" : "#7d8794"} opacity={0.55}>
          {[0, 140, 260, 420, 560, 700, 850, 960].map((x, i) => (
            <rect key={x} x={x} y={GROUND - 260 - ((i * 97) % 230)} width={120} height={260 + ((i * 97) % 230)} />
          ))}
        </g>
      ) : null}
      {bg === "city" ? <circle cx={820} cy={760} r={110} fill="#ff9a62" opacity={0.85} /> : null}
      {bg === "room" || bg === "office" || bg === "classroom" ? (
        <g>
          <rect x={90} y={560} width={300} height={260} fill="#bfe3ff" stroke={ink} strokeWidth={8} />
          <line x1={240} y1={560} x2={240} y2={820} stroke={ink} strokeWidth={6} />
          <line x1={90} y1={690} x2={390} y2={690} stroke={ink} strokeWidth={6} />
        </g>
      ) : null}
      {bg === "classroom" ? (
        <g>
          <rect x={460} y={520} width={540} height={330} rx={8} fill="#2f4f3a" stroke="#5a3d22" strokeWidth={16} />
          {boardText ? (
            <text x={730} y={705} textAnchor="middle" fontSize={64} fontWeight={800} fill="#f4f4f4" fontFamily="Inter, sans-serif">{boardText}</text>
          ) : null}
        </g>
      ) : null}
      {bg === "gym" ? (
        <g stroke={ink} strokeWidth={8} opacity={0.6}>
          <line x1={80} y1={GROUND - 420} x2={80} y2={GROUND} />
          <line x1={330} y1={GROUND - 420} x2={330} y2={GROUND} />
          <line x1={40} y1={GROUND - 330} x2={370} y2={GROUND - 330} />
          <rect x={44} y={GROUND - 380} width={22} height={100} fill={ink} />
          <rect x={344} y={GROUND - 380} width={22} height={100} fill={ink} />
        </g>
      ) : null}
      {bg === "dojo" ? (
        <g stroke="#5a3d22" strokeWidth={10}>
          {[120, 400, 680, 960].map((x) => (
            <line key={x} x1={x} y1={420} x2={x} y2={GROUND} opacity={0.5} />
          ))}
          <line x1={0} y1={420} x2={W} y2={420} />
          <circle cx={540} cy={650} r={110} fill="#e8715a" stroke="none" opacity={0.85} />
        </g>
      ) : null}
      {bg === "space" || bg === "night" || bg === "earth" ? <g>{stars(60)}</g> : null}
      {bg === "night" ? <circle cx={820} cy={520} r={90} fill="#f4f1d0" /> : null}
      {bg === "space" ? <circle cx={830} cy={560} r={140} fill="#e8715a" opacity={0.9} /> : null}
      {bg === "earth" ? (
        <g>
          <circle cx={540} cy={960} r={420} fill="#2f6fd6" stroke="#9ad7ff" strokeWidth={10} />
          <path d="M300 820 q80 -90 170 -20 q60 70 -30 120 q-110 40 -140 -100z M600 1000 q120 -60 180 40 q-40 140 -170 90 q-60 -60 -10 -130z" fill="#3fa65b" />
        </g>
      ) : null}
      {bg === "void" ? <circle cx={540} cy={900} r={520} fill="#fff" opacity={0.45} /> : null}
    </g>
  );
};

export const PropShape: React.FC<{ prop: SceneProp; ink: string; frame: number }> = ({ prop, ink, frame }) => {
  const x = prop.x * W;
  const s = prop.scale ?? 1;
  const g = (children: React.ReactNode) => (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`} stroke={ink} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" fill="none">
      {children}
    </g>
  );
  switch (prop.kind) {
    case "tower":
      return g(
        <>
          <path d="M-150 0 Q-60 -190 -22 -600 L22 -600 Q60 -190 150 0" />
          <path d="M-80 0 Q0 -120 80 0" />
          <line x1={-112} y1={-150} x2={112} y2={-150} />
          <line x1={-62} y1={-340} x2={62} y2={-340} />
          <line x1={0} y1={-600} x2={0} y2={-690} />
          <path d="M-150 0 L-22 -600 M150 0 L22 -600" strokeWidth={4} opacity={0.5} />
        </>,
      );
    case "desk":
      return g(
        <>
          <rect x={-170} y={-200} width={340} height={22} fill="#c9a77c" />
          <line x1={-150} y1={-178} x2={-150} y2={0} />
          <line x1={150} y1={-178} x2={150} y2={0} />
          <rect x={-60} y={-300} width={130} height={90} rx={6} fill="#2b2b33" />
        </>,
      );
    case "sign":
      return g(
        <>
          <line x1={0} y1={0} x2={0} y2={-330} />
          <rect x={-170} y={-470} width={340} height={150} rx={12} fill="#fff" />
          <text x={0} y={-378} textAnchor="middle" fontSize={50} fontWeight={800} fill={ink} stroke="none" fontFamily="Inter, sans-serif">{prop.label ?? ""}</text>
        </>,
      );
    case "clock": {
      const a = (frame * 6) % 360;
      return g(
        <g transform="translate(0 -760)">
          <circle r={110} fill="#fff" />
          <line x1={0} y1={0} x2={Math.sin((a * Math.PI) / 180) * 80} y2={-Math.cos((a * Math.PI) / 180) * 80} />
          <line x1={0} y1={0} x2={0} y2={-50} />
        </g>,
      );
    }
    case "chart": {
      const grow = Math.min(1, frame / 45);
      const pts = Array.from({ length: 12 }).map((_, i) => `${-200 + i * 36},${-260 - Math.pow(1.35, i) * 9 * grow}`);
      return g(
        <g transform="translate(0 -420)">
          <rect x={-230} y={-560} width={460} height={340} fill="#fff" />
          <polyline points={pts.join(" ")} transform="translate(0 -40)" stroke="#2f9e6b" strokeWidth={12} />
          {prop.label ? <text x={0} y={-510} textAnchor="middle" fontSize={40} fontWeight={800} fill={ink} stroke="none" fontFamily="Inter, sans-serif">{prop.label}</text> : null}
        </g>,
      );
    }
    case "door":
      return g(<rect x={-90} y={-420} width={180} height={420} fill="#c9a77c" />);
    case "bed":
      return g(
        <>
          <rect x={-230} y={-120} width={460} height={60} fill="#fff" />
          <rect x={-230} y={-160} width={110} height={40} rx={14} fill="#bfe3ff" />
          <line x1={-230} y1={-60} x2={-230} y2={0} />
          <line x1={230} y1={-60} x2={230} y2={0} />
        </>,
      );
    case "podium":
      return g(
        <>
          <rect x={-90} y={-160} width={180} height={160} fill="#ffd23f" />
          <text x={0} y={-50} textAnchor="middle" fontSize={90} fontWeight={900} fill={ink} stroke="none" fontFamily="Inter, sans-serif">1</text>
        </>,
      );
    case "calendar":
      return g(
        <g transform="translate(0 -820)">
          <rect x={-150} y={-140} width={300} height={280} rx={16} fill="#fff" />
          <rect x={-150} y={-140} width={300} height={70} rx={16} fill="#e8715a" />
          <text x={0} y={70} textAnchor="middle" fontSize={110} fontWeight={900} fill={ink} stroke="none" fontFamily="Inter, sans-serif">{prop.label ?? ""}</text>
        </g>,
      );
    case "hole":
      return g(<ellipse cx={0} cy={6} rx={200} ry={44} fill="#1b1b1f" />);
    case "trophy":
      return g(<path d="M-70 -330 h140 v40 q0 90 -70 100 q-70 -10 -70 -100z M-16 -190 h32 v120 h50 v40 h-132 v-40 h50z" fill="#ffd23f" />);
    case "box":
      return g(<rect x={-90} y={-180} width={180} height={180} fill="#c9a77c" />);
    case "phoneBig":
      return g(
        <g transform="translate(0 -900)">
          <rect x={-170} y={-300} width={340} height={600} rx={40} fill="#2b2b33" />
          <rect x={-145} y={-260} width={290} height={500} rx={16} fill="#fff" />
          {prop.label ? <text x={0} y={0} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1b1b1f" stroke="none" fontFamily="Inter, sans-serif">{prop.label}</text> : null}
        </g>,
      );
  }
};

export const EffectShape: React.FC<{ effect: Effect; x: number; y: number; t: number; ink: string }> = ({ effect, x, y, t, ink }) => {
  const px = x * W;
  const py = y * H;
  const pop = Math.min(1, t / 6);
  switch (effect) {
    case "pow": {
      const pts = Array.from({ length: 16 }).map((_, i) => {
        const r = i % 2 === 0 ? 150 : 80;
        const a = (i / 16) * Math.PI * 2;
        return `${Math.cos(a) * r},${Math.sin(a) * r}`;
      });
      return (
        <g transform={`translate(${px} ${py}) scale(${pop * (1 + Math.sin(t / 2) * 0.05)}) rotate(${t * 2})`}>
          <polygon points={pts.join(" ")} fill="#ffd23f" stroke={ink} strokeWidth={8} />
          <text x={0} y={22} textAnchor="middle" fontSize={64} fontWeight={900} fill="#e8263a" fontFamily="Inter, sans-serif" transform={`rotate(${-t * 2})`}>POW!</text>
        </g>
      );
    }
    case "speedlines":
      return (
        <g stroke={ink} strokeWidth={6} opacity={0.5} strokeLinecap="round">
          {Array.from({ length: 9 }).map((_, i) => {
            const yy = py - 240 + i * 60;
            const off = ((t * 40 + i * 70) % 400) - 200;
            return <line key={i} x1={px - 300 + off} y1={yy} x2={px - 120 + off} y2={yy} />;
          })}
        </g>
      );
    case "sweat":
      return (
        <g fill="#7cc6ff" stroke={ink} strokeWidth={4} transform={`translate(${px} ${py + Math.min(40, t * 2)})`}>
          <path d="M0 0 q-22 34 0 46 q22 -12 0 -46z" />
        </g>
      );
    case "question":
      return (
        <text x={px} y={py - Math.sin(t / 6) * 12} textAnchor="middle" fontSize={130} fontWeight={900} fill="#e8715a" stroke={ink} strokeWidth={4} fontFamily="Inter, sans-serif" opacity={pop}>?</text>
      );
    case "sparkle":
      return (
        <g fill="#ffd23f" stroke={ink} strokeWidth={3}>
          {[0, 1, 2].map((i) => (
            <path key={i} transform={`translate(${px + (i - 1) * 110} ${py + (i % 2) * 70}) scale(${0.6 + 0.4 * Math.abs(Math.sin(t / 5 + i))})`} d="M0 -40 L10 -10 L40 0 L10 10 L0 40 L-10 10 L-40 0 L-10 -10 Z" />
          ))}
        </g>
      );
    case "moneyRain":
    case "rain":
    case "hearts":
      return (
        <g>
          {Array.from({ length: 14 }).map((_, i) => {
            const xx = (i * 79) % W;
            const yy = ((t * (effect === "rain" ? 26 : 12) + i * 160) % (GROUND + 100)) - 100;
            if (effect === "rain") return <line key={i} x1={xx} y1={yy} x2={xx - 10} y2={yy + 50} stroke="#7cc6ff" strokeWidth={6} />;
            if (effect === "hearts") return <text key={i} x={xx} y={yy} fontSize={60} fill="#e8263a">♥</text>;
            return (
              <g key={i} transform={`translate(${xx} ${yy}) rotate(${(t * 6 + i * 40) % 360})`}>
                <rect x={-34} y={-18} width={68} height={36} fill="#7fd18b" stroke={ink} strokeWidth={4} />
                <text x={0} y={12} textAnchor="middle" fontSize={28} fontWeight={900} fill={ink} fontFamily="sans-serif">$</text>
              </g>
            );
          })}
        </g>
      );
    case "zzz":
      return (
        <g fill={ink} fontFamily="Inter, sans-serif" fontWeight={900}>
          {[0, 1, 2].map((i) => (
            <text key={i} x={px + i * 40} y={py - i * 60 - ((t * 2) % 40)} fontSize={50 + i * 14} opacity={0.4 + i * 0.3}>Z</text>
          ))}
        </g>
      );
    case "fire":
      return (
        <g transform={`translate(${px} ${py}) scale(${1 + Math.sin(t / 3) * 0.08})`}>
          <path d="M0 -150 q90 90 50 150 q-50 40 -100 0 q-40 -60 50 -150z" fill="#ff7a2f" stroke={ink} strokeWidth={6} />
          <path d="M0 -70 q40 40 20 70 q-20 16 -40 0 q-16 -30 20 -70z" fill="#ffd23f" />
        </g>
      );
    case "arrowUp":
      return (
        <g transform={`translate(${px} ${py - Math.min(80, t * 3)})`} fill="#2f9e6b" stroke={ink} strokeWidth={6} opacity={pop}>
          <path d="M0 -120 L80 -20 L30 -20 L30 100 L-30 100 L-30 -20 L-80 -20 Z" />
        </g>
      );
  }
};
