// Tạo lời dẫn cho Short người que: mỗi cảnh = 1 block của một job CreateMulti (giọng riêng từng cảnh), rồi tải từng
// block về public/media/stickman/<id>/ và ghi url / file / durationSec vào JSON.
//   TTSFORFREE_API_KEY=... node scripts/voice.mjs story.json   (--force: tạo lại)
// narration.voice = tên giọng đúng như Voice Library (FreindlyName), ví dụ "Andrew (Natural)  (United States)".
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const API = "https://api.ttsforfree.com/api";
const key = process.env.TTSFORFREE_API_KEY;
if (!key) throw new Error("Set TTSFORFREE_API_KEY");
const headers = { "X-API-Key": key, "Content-Type": "application/json" };
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const force = process.argv.includes("--force");
const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = async (url, init) => {
  const res = await fetch(url, { headers, ...init });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

const voiceCache = new Map();
async function voiceToken(lang, name) {
  if (!voiceCache.has(lang)) {
    const list = await getJson(`${API}/Common/GetListVoice?lang=${lang}&type=singlevoice`);
    voiceCache.set(lang, new Map(list.Data.map((v) => [v.FreindlyName, v])));
  }
  const voice = voiceCache.get(lang).get(name);
  if (!voice) throw new Error(`voice not found for ${lang}: ${name}`);
  return voice;
}

const probe = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

for (const rel of files) {
  const file = path.resolve(rel);
  const story = JSON.parse(fs.readFileSync(file, "utf8"));
  const todo = story.scenes.filter((s) => s.narration?.voice && (force || !s.narration.url));
  if (todo.length) {
    let credits = 0;
    const blocks = [];
    for (const scene of todo) {
      const voice = await voiceToken(story.lang, scene.narration.voice);
      credits += scene.text.length * voice.BaseCreditsPerCharacter;
      blocks.push({ Texts: scene.text, Voice: voice.VoiceName, Volume: 1, Speed: 1, Pitch: 0, PauseAfterMs: 0 });
    }
    console.log(`${story.id}: ${blocks.length} blocks, ~${Math.round(credits)} credits`);
    const created = await getJson(`${API}/TTS/CreateMulti`, {
      method: "POST",
      body: JSON.stringify({ ConnectionId: `stickman-${story.id}`, MinSpeechRate: 0.95, MaxSpeechRate: 1.5, Blocks: blocks }),
    });
    if (!(created.Id > 0)) throw new Error(`${story.id}: ${created.Message}`);
    // Chờ mọi block xong (không cần chờ file ghép: mỗi cảnh dùng audio block riêng).
    let detail;
    for (let i = 0; i < 90; i++) {
      await sleep(4000);
      detail = (await getJson(`${API}/TTS/GetJobTTSDetail?jobId=${created.Id}`)).Data;
      if (detail.Blocks.every((b) => b.FilePath && b.StatusId === 200)) break;
      if (detail.Blocks.some((b) => b.StatusId >= 400)) throw new Error(`${story.id}: block failed`);
    }
    const byText = new Map();
    for (const block of detail.Blocks) byText.set(block.Text, block.FilePath);
    for (const scene of todo) {
      scene.narration.url = byText.get(scene.text);
      if (!scene.narration.url) throw new Error(`${story.id}: missing audio for "${scene.text}"`);
      scene.narration.credits = Math.round(scene.text.length * (await voiceToken(story.lang, scene.narration.voice)).BaseCreditsPerCharacter);
    }
  }
  // Tải về + đo (tên file theo URL: thứ tự cảnh đổi cũng không dùng nhầm file).
  for (const scene of story.scenes) {
    if (!scene.narration?.url) continue;
    const relFile = `audio/${path.basename(new URL(scene.narration.url).pathname)}`;
    const target = path.join(root, "public", relFile);
    if (!fs.existsSync(target)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const res = await fetch(scene.narration.url);
      if (!res.ok) throw new Error(`${scene.narration.url} -> ${res.status}`);
      fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    }
    scene.narration.file = relFile;
    scene.narration.durationSec = Math.round(probe(target) * 1000) / 1000;
  }
  fs.writeFileSync(file, JSON.stringify(story, null, 2) + "\n");
  const total = story.scenes.reduce((s, x) => s + (x.narration?.durationSec ?? 0), 0);
  const credits = story.scenes.reduce((s, x) => s + (x.narration?.credits ?? 0), 0);
  console.log(`${story.id}: ${total.toFixed(1)}s of narration, ${credits} credits`);
}
