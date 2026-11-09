import React from "react";
import { AbsoluteFill, Audio, Easing, Series, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { Figure } from "./Figure";
import { Backdrop, EffectShape, GROUND, H, PropShape, W, inkFor, skinFor } from "./Scenery";
import type { Actor, StickScene, StickStory } from "./types";

const FPS = 30;
const TAIL_FRAMES = 6;

export const sceneFrames = (scene: StickScene) =>
  Math.round((scene.narration?.durationSec ?? scene.durationSec ?? 2) * FPS) + TAIL_FRAMES;

export const storyFrames = (story: StickStory) => story.scenes.reduce((sum, s) => sum + sceneFrames(s), 0);

/** Chia câu thành cụm ≤ 3 từ, thời gian theo số ký tự (đủ khớp với TTS đọc đều). */
function captionChunks(text: string, frames: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[][] = [];
  let current: string[] = [];
  for (const word of words) {
    const length = [...current, word].join(" ").length;
    if (current.length && (current.length >= 3 || length > 18)) {
      chunks.push(current);
      current = [];
    }
    current.push(word);
    if (/[.!?,:;…]$/.test(word)) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length) chunks.push(current);
  const total = chunks.reduce((sum, c) => sum + c.join(" ").length, 0) || 1;
  let cursor = 0;
  return chunks.map((words) => {
    const length = Math.round((words.join(" ").length / total) * frames);
    const chunk = { words, from: cursor, to: cursor + length };
    cursor += length;
    return chunk;
  });
}

const Caption: React.FC<{ scene: StickScene; frame: number; speechFrames: number; dark: boolean }> = ({ scene, frame, speechFrames, dark }) => {
  const { fps } = useVideoConfig();
  const chunks = captionChunks(scene.text, Math.max(1, speechFrames));
  const chunk = chunks.find((c) => frame >= c.from && frame < c.to) ?? chunks[chunks.length - 1];
  if (!chunk) return null;
  const pop = spring({ frame: frame - chunk.from, fps, config: { damping: 11, stiffness: 180 } });
  const marks = (scene.highlight ?? []).map((h) => h.toLowerCase());
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        left: 50,
        right: 50,
        textAlign: "center",
        fontFamily: "Inter, 'Noto Sans', sans-serif",
        fontWeight: 900,
        fontSize: 104,
        lineHeight: 1.05,
        textTransform: "uppercase",
        transform: `scale(${0.7 + 0.3 * pop}) rotate(${(1 - pop) * -3}deg)`,
        color: "#fff",
        WebkitTextStroke: `10px ${dark ? "#000" : "#111"}`,
        paintOrder: "stroke",
        letterSpacing: -1,
      }}
    >
      {chunk.words.map((word, i) => {
        const clean = word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
        const hot = marks.some((m) => clean.includes(m.replace(/[^\p{L}\p{N}]/gu, "")));
        return (
          <span key={i} style={{ color: hot ? "#ffd23f" : "#fff" }}>
            {word}{" "}
          </span>
        );
      })}
    </div>
  );
};

/** Miệng mở theo âm lượng thật của audio cảnh. */
function useAudioMouth(file: string, frame: number, speechFrames: number) {
  const { fps } = useVideoConfig();
  const audio = useAudioData(staticFile(file));
  if (frame >= speechFrames) return 0;
  if (!audio) return Math.abs(Math.sin(frame / 2.2)) * 0.6;
  const values = visualizeAudio({ fps, frame, audioData: audio, numberOfSamples: 16 });
  const level = values.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
  return Math.min(1, level * 6);
}

const SceneWithAudio: React.FC<{ scene: StickScene; index: number; file: string }> = ({ scene, index, file }) => {
  const frame = useCurrentFrame();
  const speech = Math.round((scene.narration?.durationSec ?? 2) * FPS);
  return <SceneBody scene={scene} index={index} mouth={useAudioMouth(file, frame, speech)} />;
};

const SceneView: React.FC<{ scene: StickScene; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const file = scene.narration?.file;
  if (file) return <SceneWithAudio scene={scene} index={index} file={file} />;
  // Không có audio (bản xem thử): nhép đều theo nhịp.
  const speech = Math.round((scene.durationSec ?? 2) * FPS);
  return <SceneBody scene={scene} index={index} mouth={frame < speech ? Math.abs(Math.sin(frame / 2.2)) * 0.6 : 0} />;
};

const ActorView: React.FC<{ actor: Actor; frame: number; total: number; ink: string; skin: string; mouth: number }> = ({ actor, frame, total, ink, skin, mouth }) => {
  const enterFrom = actor.enter === "left" ? -0.2 : actor.enter === "right" ? 1.2 : actor.x;
  const enterDone = actor.enter ? 26 : 0;
  let x = interpolate(frame, [0, Math.max(1, enterDone)], [enterFrom, actor.x], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  if (actor.x2 !== undefined) {
    x = interpolate(frame, [enterDone, Math.max(enterDone + 1, total - 8)], [actor.x, actor.x2], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  }
  const moving = (actor.enter && frame < enterDone) || actor.x2 !== undefined;
  const pose = moving && actor.pose === "stand" ? "walk" : actor.pose;
  return (
    <Figure
      pose={pose}
      frame={frame}
      x={x * W}
      y={actor.y !== undefined ? actor.y * H : GROUND}
      scale={actor.scale ?? 1.3}
      face={actor.face ?? (actor.enter === "right" ? -1 : 1)}
      expression={actor.expression}
      hat={actor.hat}
      color={actor.color}
      prop={actor.prop}
      mouth={actor.speaking ? mouth : 0}
      ink={ink}
      skin={skin}
    />
  );
};

const Bubble: React.FC<{ x: number; text: string; frame: number; ink: string }> = ({ x, text, frame, ink }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 4, fps, config: { damping: 12 } });
  const width = Math.min(620, 70 + text.length * 30);
  const left = Math.min(W - width - 30, Math.max(30, x * W - width / 2));
  return (
    <g transform={`translate(0 ${(1 - p) * 30})`} opacity={p}>
      <rect x={left} y={600} width={width} height={150} rx={36} fill="#fff" stroke={ink} strokeWidth={8} />
      <path d={`M${x * W - 20} 746 L${x * W} 800 L${x * W + 24} 746`} fill="#fff" stroke={ink} strokeWidth={8} strokeLinejoin="round" />
      <text x={left + width / 2} y={696} textAnchor="middle" fontSize={54} fontWeight={800} fill="#1b1b1f" fontFamily="Inter, sans-serif">
        {text}
      </text>
    </g>
  );
};

const SceneBody: React.FC<{ scene: StickScene; index: number; mouth: number }> = ({ scene, index, mouth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = sceneFrames(scene);
  const speech = Math.round((scene.narration?.durationSec ?? scene.durationSec ?? 2) * FPS);
  const ink = inkFor(scene.background);
  const skin = skinFor(scene.background);
  const dark = ink !== "#1b1b1f";

  const camera = scene.camera ?? (index % 2 === 0 ? "push" : "pan");
  let transform = "";
  if (camera === "push") transform = `scale(${interpolate(frame, [0, total], [1, 1.07])})`;
  if (camera === "pan") transform = `translateX(${interpolate(frame, [0, total], [18, -18])}px) scale(1.04)`;
  if (camera === "punchIn") transform = `scale(${1.18 - 0.14 * spring({ frame, fps, config: { damping: 14 } })})`;
  if (camera === "shake") transform = `translate(${Math.sin(frame * 1.7) * 9}px, ${Math.cos(frame * 2.3) * 7}px) scale(1.05)`;
  const flash = camera === "flash" ? interpolate(frame, [0, 8], [0.9, 0], { extrapolateRight: "clamp" }) : 0;
  const speaker = scene.bubble ? scene.actors.find((a) => a.id === scene.bubble?.actor) : undefined;
  const bigPop = spring({ frame: frame - 6, fps, config: { damping: 9, stiffness: 160 } });

  return (
    <AbsoluteFill>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, transform, transformOrigin: "50% 72%" }}>
        <Backdrop bg={scene.background} frame={frame} boardText={scene.boardText} />
        {(scene.props ?? []).map((prop, i) => (
          <PropShape key={i} prop={prop} ink={ink} frame={frame} />
        ))}
        {scene.actors.map((actor) => (
          <ActorView key={actor.id} actor={actor} frame={frame} total={total} ink={ink} skin={skin} mouth={mouth} />
        ))}
        {(scene.effects ?? []).map((effect, i) =>
          frame >= (effect.at ?? 0) * fps ? (
            <EffectShape key={i} effect={effect.kind} x={effect.x} y={effect.y ?? 0.62} t={frame - (effect.at ?? 0) * fps} ink={ink} />
          ) : null,
        )}
        {scene.bubble && speaker ? <Bubble x={speaker.x2 ?? speaker.x} text={scene.bubble.text} frame={frame} ink={ink} /> : null}
        {scene.bigText ? (
          <text
            x={W / 2}
            y={820}
            textAnchor="middle"
            fontSize={190}
            fontWeight={900}
            fill="#ffd23f"
            stroke={dark ? "#000" : "#1b1b1f"}
            strokeWidth={14}
            paintOrder="stroke"
            fontFamily="Inter, sans-serif"
            transform={`translate(${W / 2} 760) scale(${bigPop}) translate(${-W / 2} -760)`}
          >
            {scene.bigText}
          </text>
        ) : null}
      </svg>
      <Caption scene={scene} frame={frame} speechFrames={speech} dark={dark} />
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
      {scene.narration?.file ? <Audio src={staticFile(scene.narration.file)} /> : null}
    </AbsoluteFill>
  );
};

export const StickmanShort: React.FC<{ story: StickStory }> = ({ story }) => {
  const frame = useCurrentFrame();
  const total = storyFrames(story);
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <Series>
        {story.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={sceneFrames(scene)}>
            <SceneView scene={scene} index={i} />
          </Series.Sequence>
        ))}
      </Series>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 14, width: `${(frame / Math.max(1, total - 1)) * 100}%`, background: "#ffd23f" }} />
      <div
        style={{
          position: "absolute",
          bottom: 70,
          width: "100%",
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 34,
          color: "rgba(0,0,0,0.45)",
          textShadow: "0 0 8px rgba(255,255,255,0.7)",
        }}
      >
        Voice: TTSForFree · ttsforfree.com
      </div>
    </AbsoluteFill>
  );
};
