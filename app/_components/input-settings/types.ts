import { ChevronDown, ChevronUp, Lock, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  specialRomajiVariantOptions,
  standardRomajiVariantOptions,
  sokuonInputOptions,
  type SpecialRomajiInputPreset,
  type SokuonInputId,
} from "@/src/lib/typing";
import { css } from "../../_lib/css-module";
import {
  englishFontFamilyOptions,
  initialSettings,
  japaneseFontFamilyOptions,
  targetDisplayElementOptions,
  topDisplayMetricOptions,
} from "../../_lib/constants";
import { clampInteger } from "../../_lib/challenge-utils";
import type { AppSettings, NextChallengePreviewMode, TargetDisplayElementId } from "../../_lib/types";
import styles from "../SettingsScreen.module.css";


export type StandardRomajiOption = (typeof standardRomajiVariantOptions)[number];

export type SpecialRomajiOption = (typeof specialRomajiVariantOptions)[number];

export type FontSizeSettingKey =
  | "kanjiFontSize"
  | "kanjiInputProgressFontSize"
  | "hiraganaFontSize"
  | "hiraganaInputProgressFontSize"
  | "romajiFontSize";

export type LineHeightSettingKey =
  | "kanjiLineHeight"
  | "kanjiInputProgressLineHeight"
  | "furiganaLineHeight"
  | "hiraganaLineHeight"
  | "hiraganaInputProgressLineHeight"
  | "romajiLineHeight";

export type MarginBottomSettingKey =
  | "kanjiMarginBottom"
  | "kanjiInputProgressMarginBottom"
  | "furiganaMarginBottom"
  | "hiraganaMarginBottom"
  | "hiraganaInputProgressMarginBottom"
  | "romajiMarginBottom";

export const nextChallengePreviewModeOptions: Array<{
  id: NextChallengePreviewMode;
  label: string;
  description: string;
}> = [
    {
      id: "split-slide",
      label: "スライド",
      description: "上下に分け、次の課題が上へ移る",
    },
    {
      id: "split-alternate",
      label: "交代",
      description: "上下の入力位置を交互に切り替える",
    },
    {
      id: "center-scroll",
      label: "中央揃え・連結",
      description: "入力位置を中心に置く連続表示",
    },
    {
      id: "none",
      label: "非表示",
      description: "次の課題を表示しない",
    },
  ];
