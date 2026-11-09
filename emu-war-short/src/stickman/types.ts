// Dữ liệu một Short người que: mỗi cảnh = 1 câu lời dẫn (audio TTSForFree riêng), nhân vật, bối cảnh, hiệu ứng.
// Viết tay hoặc để skill "stickman-short" sinh ra; engine chỉ đọc JSON này (không cần sửa code để làm video mới).

export type Pose =
  | "stand" | "walk" | "run" | "point" | "talk" | "cheer" | "shock" | "think" | "sad" | "sit"
  | "punch" | "kick" | "block" | "fall" | "give" | "lift" | "phone" | "type" | "sleep" | "pushup";

export type Expression = "neutral" | "happy" | "shock" | "angry" | "sad" | "determined" | "smug";

export type Hat = "top" | "cap" | "crown" | "headband" | "hair" | "bun";

export type HandProp = "money" | "phone" | "book" | "sword" | "dumbbell" | "trophy" | "paper" | "coffee" | "flag";

export type Background =
  | "paris" | "city" | "room" | "office" | "gym" | "dojo" | "space" | "night" | "classroom" | "street" | "void" | "earth";

export type Effect =
  | "pow" | "speedlines" | "sweat" | "question" | "sparkle" | "moneyRain" | "rain" | "zzz" | "hearts" | "fire" | "arrowUp";

export type Camera = "push" | "shake" | "punchIn" | "flash" | "pan";

export type Actor = {
  id: string;
  pose: Pose;
  /** Vị trí ngang 0..1 (theo chiều rộng khung). */
  x: number;
  /** Đi từ ngoài khung vào (cạnh trái / phải) trong ~1 giây đầu cảnh. */
  enter?: "left" | "right";
  /** Di chuyển tới x2 trong cảnh (đi bộ / chạy). */
  x2?: number;
  /** Vị trí dọc của bàn chân 0..1 (mặc định mặt đất), vd rơi giữa lòng Trái Đất. */
  y?: number;
  face?: 1 | -1;
  expression?: Expression;
  hat?: Hat;
  /** Màu nét (mặc định đen) để phân biệt hai đối thủ. */
  color?: string;
  prop?: HandProp;
  /** Miệng nhép theo audio của cảnh. */
  speaking?: boolean;
  scale?: number;
};

export type SceneProp = {
  kind: "tower" | "desk" | "sign" | "clock" | "chart" | "door" | "bed" | "podium" | "calendar" | "hole" | "trophy" | "box" | "phoneBig";
  x: number;
  label?: string;
  scale?: number;
};

export type StickScene = {
  /** Câu lời dẫn = phụ đề chạy từng chữ. */
  text: string;
  /** Từ được tô màu trong phụ đề (không phân biệt hoa thường). */
  highlight?: string[];
  narration?: { url?: string; file?: string; durationSec?: number; voice?: string };
  /** Thời lượng khi không có lời dẫn (giây). */
  durationSec?: number;
  background: Background;
  /** Chữ trên bảng / biển (classroom, sign). */
  boardText?: string;
  actors: Actor[];
  props?: SceneProp[];
  effects?: { kind: Effect; x: number; y?: number; at?: number }[];
  camera?: Camera;
  bubble?: { actor: string; text: string };
  /** Chữ lớn giữa màn hình (số liệu, cú twist). */
  bigText?: string;
};

export type StickStory = {
  id: string;
  lang: "en" | "vi";
  title: string;
  /** Nhóm nội dung cho landing: history, motivation, fight, whatif, storytime, psychology. */
  useCase: string;
  /** Mức giọng: budget (Azure), hybrid (Gemini cho hook + twist), premium (Gemini cả bài). */
  voiceTier: "budget" | "hybrid" | "premium";
  theme?: "light" | "dark";
  scenes: StickScene[];
};
