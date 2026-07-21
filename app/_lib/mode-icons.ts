import { Crosshair, Keyboard, Languages, Waves, Zap, type LucideIcon } from "lucide-react";
import type { ModeId } from "@/src/lib/typing";

export const modeIconNames = {
  "practice-accuracy": "crosshair",
  "practice-flow": "waves",
  "practice-speed": "zap",
  "production-ime-off": "keyboard",
  "production-ime-on": "languages",
} as const satisfies Record<ModeId, string>;

export const modeIcons = {
  "practice-accuracy": Crosshair,
  "practice-flow": Waves,
  "practice-speed": Zap,
  "production-ime-off": Keyboard,
  "production-ime-on": Languages,
} satisfies Record<ModeId, LucideIcon>;
