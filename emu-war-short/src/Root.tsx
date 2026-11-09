import React from "react";
import { Composition } from "remotion";
import { StickmanShort, storyFrames } from "./stickman/StickmanShort";
import type { StickStory } from "./stickman/types";
import storyJson from "../story.json";

// Một composition "short" đọc story.json (sửa JSON, không cần sửa code).
const story = storyJson as unknown as StickStory;

export const Root: React.FC = () => (
  <Composition
    id="short"
    component={StickmanShort}
    durationInFrames={storyFrames(story)}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ story }}
  />
);
