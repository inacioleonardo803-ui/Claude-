import React from "react";
import type { Expression, Hat, HandProp, Pose } from "./types";

// Người que vẽ bằng SVG. Gốc toạ độ = điểm giữa hai bàn chân trên mặt đất; đơn vị = px ở scale 1.
// Góc khớp tính bằng độ: 0 = thẳng xuống, dương = hướng về phía nhân vật đang nhìn.

const HIP = -175;
const SHOULDER = -315;
const NECK = -335;
const HEAD = -392;
const HEAD_R = 50;
const UPPER = 92;
const LOWER = 92;
const ARM_U = 72;
const ARM_L = 72;

type Limb = [number, number]; // [góc đoạn trên, góc gập đoạn dưới so với đoạn trên]
export type Angles = {
  armF: Limb; armB: Limb; legF: Limb; legB: Limb;
  lean: number; lift: number; rotate: number; head: number;
};

const rad = (d: number) => (d * Math.PI) / 180;
const seg = (a: number, len: number) => [Math.sin(rad(a)) * len, Math.cos(rad(a)) * len] as const;

/** Góc khớp theo tư thế và frame (các tư thế động: đi, chạy, đấm, chống đẩy...). */
export function poseAngles(pose: Pose, f: number): Angles {
  const base: Angles = { armF: [12, -8], armB: [-12, 8], legF: [8, -4], legB: [-8, 4], lean: 0, lift: 0, rotate: 0, head: 0 };
  const breathe = Math.sin(f / 14) * 2;
  switch (pose) {
    case "stand":
      return { ...base, armF: [10 + breathe, -6], armB: [-10 - breathe, 6] };
    case "walk": {
      const s = Math.sin(f / 4.2);
      return { ...base, legF: [s * 28, -Math.max(0, s) * 25], legB: [-s * 28, -Math.max(0, -s) * 25], armF: [-s * 24, 15], armB: [s * 24, 15], lift: -Math.abs(s) * 6 };
    }
    case "run": {
      const s = Math.sin(f / 2.6);
      return { ...base, lean: 14, legF: [s * 48, -40 - Math.max(0, s) * 35], legB: [-s * 48, -40 - Math.max(0, -s) * 35], armF: [-s * 55, 80], armB: [s * 55, 80], lift: -Math.abs(s) * 14 };
    }
    case "point":
      return { ...base, armF: [100, -4], armB: [-10 - breathe, 6] };
    case "talk": {
      const g = Math.sin(f / 6);
      return { ...base, armF: [55 + g * 18, 40], armB: [-12, 10] };
    }
    case "cheer": {
      const b = Math.abs(Math.sin(f / 5));
      return { ...base, armF: [160, 10], armB: [-160, -10], lift: -b * 22, legF: [14, -10], legB: [-14, 10] };
    }
    case "shock":
      return { ...base, lean: -8, armF: [125, -50], armB: [-125, 50], lift: Math.sin(f / 2) * 3, head: -6 };
    case "think":
      return { ...base, armF: [28, 150], armB: [-15, 60], head: 8 };
    case "sad":
      return { ...base, lean: 10, head: 18, armF: [4, 0], armB: [-4, 0] };
    case "sit":
      return { ...base, lift: 80, legF: [92, -95], legB: [80, -95], armF: [40, 45], armB: [30, 45] };
    case "punch": {
      const hit = Math.sin(f / 3) > 0.3;
      return { ...base, lean: 10, legF: [24, -10], legB: [-28, 6], armF: hit ? [92, 0] : [55, 95], armB: hit ? [60, 100] : [92, 0] };
    }
    case "kick": {
      const k = (Math.sin(f / 4) + 1) / 2;
      return { ...base, lean: -14, legF: [40 + k * 70, -10 * (1 - k)], legB: [-6, 4], armF: [60, 60], armB: [-70, -30] };
    }
    case "block":
      return { ...base, lean: -4, armF: [110, 120], armB: [95, 125], legF: [20, -12], legB: [-24, 8] };
    case "fall":
      return { ...base, rotate: -84, lift: 40, armF: [150, 0], armB: [-150, 0], legF: [10, 0], legB: [-14, 0] };
    case "give":
      return { ...base, armF: [72, 10], armB: [-10, 6] };
    case "lift": {
      const up = (Math.sin(f / 9) + 1) / 2;
      return { ...base, armF: [170 - up * 40, -up * 110], armB: [-170 + up * 40, up * 110], legF: [22, -18 - up * 20], legB: [-22, 18 + up * 20], lift: up * 18 };
    }
    case "phone":
      return { ...base, armF: [30, 140], armB: [-10, 6], head: 12 };
    case "type": {
      const t = Math.sin(f / 1.6) * 8;
      return { ...base, lift: 80, legF: [92, -95], legB: [80, -95], armF: [70 + t, 25], armB: [62 - t, 25], lean: 6 };
    }
    case "sleep":
      return { ...base, rotate: -90, lift: 30, armF: [40, 30], armB: [10, 0], legF: [6, 0], legB: [-6, 0], head: 0 };
    case "pushup": {
      const d = (Math.sin(f / 7) + 1) / 2;
      return { ...base, rotate: -78 + d * 8, lift: 30, armF: [-10 + d * 30, -d * 70], armB: [-14 + d * 30, -d * 70], legF: [0, 0], legB: [-4, 0] };
    }
  }
}

const Face: React.FC<{ expression: Expression; mouth: number; ink: string; blink: boolean }> = ({ expression, mouth, ink, blink }) => {
  const eyeY = HEAD - 8;
  const eyes =
    expression === "happy" || blink ? (
      <g fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round">
        <path d={`M8 ${eyeY} q8 -9 16 0`} />
        <path d={`M30 ${eyeY} q8 -9 16 0`} />
      </g>
    ) : (
      <g fill={ink}>
        <circle cx={16} cy={eyeY} r={expression === "shock" ? 9 : 6.5} />
        <circle cx={38} cy={eyeY} r={expression === "shock" ? 9 : 6.5} />
      </g>
    );
  const brows =
    expression === "angry" || expression === "determined" ? (
      <g stroke={ink} strokeWidth={6} strokeLinecap="round">
        <line x1={6} y1={eyeY - 20} x2={24} y2={eyeY - 12} />
        <line x1={50} y1={eyeY - 20} x2={32} y2={eyeY - 12} />
      </g>
    ) : expression === "sad" ? (
      <g stroke={ink} strokeWidth={6} strokeLinecap="round">
        <line x1={6} y1={eyeY - 12} x2={24} y2={eyeY - 20} />
        <line x1={50} y1={eyeY - 12} x2={32} y2={eyeY - 20} />
      </g>
    ) : null;
  const my = HEAD + 22;
  let mouthEl: React.ReactNode;
  if (mouth > 0.05) mouthEl = <ellipse cx={28} cy={my} rx={11} ry={3 + mouth * 13} fill={ink} />;
  else if (expression === "happy" || expression === "smug") mouthEl = <path d={`M14 ${my - 4} q14 ${expression === "smug" ? 8 : 16} 28 0`} fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />;
  else if (expression === "sad") mouthEl = <path d={`M14 ${my + 6} q14 -14 28 0`} fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />;
  else if (expression === "shock") mouthEl = <ellipse cx={28} cy={my + 2} rx={10} ry={14} fill={ink} />;
  else mouthEl = <line x1={18} y1={my} x2={38} y2={my} stroke={ink} strokeWidth={6} strokeLinecap="round" />;
  return (
    <g>
      {eyes}
      {brows}
      {mouthEl}
    </g>
  );
};

const HatShape: React.FC<{ hat: Hat; ink: string; color: string }> = ({ hat, ink, color }) => {
  const top = HEAD - HEAD_R;
  switch (hat) {
    case "top":
      return (
        <g fill={ink}>
          <rect x={-60} y={top - 6} width={120} height={14} rx={6} />
          <rect x={-38} y={top - 86} width={76} height={84} rx={6} />
        </g>
      );
    case "cap":
      return <path d={`M-50 ${top + 22} q50 -70 100 0 l38 4 q-10 10 -38 8 z`} fill={color} stroke={ink} strokeWidth={6} />;
    case "crown":
      return <path d={`M-38 ${top + 6} l0 -48 l20 22 l18 -32 l18 32 l20 -22 l0 48 z`} fill="#ffd23f" stroke={ink} strokeWidth={6} strokeLinejoin="round" />;
    case "headband":
      return (
        <g>
          <rect x={-52} y={top + 22} width={104} height={16} fill={color} stroke={ink} strokeWidth={4} />
          <path d={`M-52 ${top + 30} l-40 18 l6 -26 z`} fill={color} stroke={ink} strokeWidth={4} />
        </g>
      );
    case "hair":
      return <path d={`M-50 ${HEAD - 4} q-6 -64 50 -58 q58 -4 52 58 q-14 -34 -52 -36 q-38 2 -50 36z`} fill={ink} />;
    case "bun":
      return (
        <g fill={ink}>
          <circle cx={-20} cy={top - 10} r={24} />
          <path d={`M-50 ${HEAD - 6} q0 -58 50 -54 q50 -4 50 54 q-18 -30 -50 -30 q-32 0 -50 30z`} />
        </g>
      );
  }
};

const PropShape: React.FC<{ prop: HandProp; ink: string }> = ({ prop, ink }) => {
  switch (prop) {
    case "money":
      return (
        <g>
          <path d="M-30 0 Q-40 64 0 68 Q40 64 30 0 Z" fill="#e8b341" stroke={ink} strokeWidth={6} />
          <text x={0} y={50} textAnchor="middle" fontSize={40} fontWeight={900} fill={ink} fontFamily="sans-serif">$</text>
        </g>
      );
    case "phone":
      return <rect x={-14} y={-46} width={28} height={50} rx={6} fill="#2b2b33" stroke={ink} strokeWidth={4} />;
    case "book":
      return <rect x={-6} y={-30} width={46} height={58} rx={4} fill="#d9534f" stroke={ink} strokeWidth={5} />;
    case "sword":
      return (
        <g stroke={ink} strokeLinecap="round">
          <line x1={0} y1={0} x2={0} y2={-150} strokeWidth={10} stroke="#c9d1d9" />
          <line x1={-20} y1={-6} x2={20} y2={-6} strokeWidth={10} />
        </g>
      );
    case "dumbbell":
      return (
        <g stroke={ink} strokeWidth={8}>
          <line x1={-60} y1={0} x2={60} y2={0} />
          <rect x={-78} y={-24} width={20} height={48} fill={ink} />
          <rect x={58} y={-24} width={20} height={48} fill={ink} />
        </g>
      );
    case "trophy":
      return <path d="M-26 -60 h52 v18 q0 34 -26 38 q-26 -4 -26 -38 z M-6 -4 h12 v18 h14 v10 h-40 v-10 h14z" fill="#ffd23f" stroke={ink} strokeWidth={5} />;
    case "paper":
      return <rect x={-4} y={-40} width={44} height={56} fill="#fff" stroke={ink} strokeWidth={5} />;
    case "coffee":
      return <path d="M-14 -36 h32 l-4 40 h-24 z" fill="#8a5a3c" stroke={ink} strokeWidth={5} />;
    case "flag":
      return (
        <g>
          <line x1={0} y1={10} x2={0} y2={-150} stroke={ink} strokeWidth={7} />
          <path d="M0 -150 h70 l-14 24 l14 24 h-70z" fill="#e8715a" stroke={ink} strokeWidth={5} />
        </g>
      );
  }
};

export const Figure: React.FC<{
  pose: Pose;
  frame: number;
  x: number;
  y: number;
  scale?: number;
  face?: 1 | -1;
  expression?: Expression;
  hat?: Hat;
  color?: string;
  prop?: HandProp;
  /** Độ mở miệng 0..1 (từ âm lượng audio). */
  mouth?: number;
  ink?: string;
  skin?: string;
}> = ({ pose, frame, x, y, scale = 1, face = 1, expression = "neutral", hat, color, prop, mouth = 0, ink = "#1b1b1f", skin = "#ffffff" }) => {
  const a = poseAngles(pose, frame);
  const stroke = color ?? ink;
  const limb = (ox: number, oy: number, l: Limb, l1: number, l2: number) => {
    const [x1, y1] = seg(l[0], l1);
    const [x2, y2] = seg(l[0] + l[1], l2);
    return { d: `M${ox} ${oy} L${ox + x1} ${oy + y1} L${ox + x1 + x2} ${oy + y1 + y2}`, end: [ox + x1 + x2, oy + y1 + y2] as const };
  };
  const legF = limb(0, HIP, a.legF, UPPER, LOWER);
  const legB = limb(0, HIP, a.legB, UPPER, LOWER);
  const armF = limb(0, SHOULDER, a.armF, ARM_U, ARM_L);
  const armB = limb(0, SHOULDER, a.armB, ARM_U, ARM_L);
  const blink = expression !== "happy" && frame % 97 < 4;
  return (
    <g transform={`translate(${x} ${y + a.lift}) scale(${scale * face} ${scale}) rotate(${a.rotate} 0 ${HIP})`}>
      <g transform={`rotate(${a.lean} 0 ${HIP})`} stroke={stroke} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={armB.d} />
        <path d={legB.d} />
        <line x1={0} y1={HIP} x2={0} y2={NECK} />
        <path d={legF.d} />
        <g transform={`rotate(${a.head} 0 ${NECK})`}>
          <circle cx={0} cy={HEAD} r={HEAD_R} fill={skin} />
          <g stroke="none">
            <Face expression={expression} mouth={mouth} ink={ink} blink={blink} />
          </g>
          {hat ? (
            <g stroke="none">
              <HatShape hat={hat} ink={ink} color={color ?? "#e8715a"} />
            </g>
          ) : null}
        </g>
        <path d={armF.d} />
        {prop ? (
          <g transform={`translate(${armF.end[0]} ${armF.end[1]})`} stroke="none">
            <PropShape prop={prop} ink={ink} />
          </g>
        ) : null}
      </g>
    </g>
  );
};
