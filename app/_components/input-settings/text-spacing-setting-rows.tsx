"use client";

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

import { NumericSettingRow } from "./number-control";
import { LineHeightSettingKey, MarginBottomSettingKey } from "./types";

export type TextSpacingSettingRowsProps = {
  bottomSpacingAriaLabel: string;
  bottomSpacingDefaultValue: number;
  bottomSpacingDescription: string;
  bottomSpacingId: string;
  bottomSpacingKey: MarginBottomSettingKey;
  bottomSpacingLabel: string;
  bottomSpacingValue: number;
  lineHeightAriaLabel: string;
  lineHeightDefaultValue: number;
  lineHeightDescription: string;
  lineHeightId: string;
  lineHeightKey: LineHeightSettingKey;
  lineHeightLabel: string;
  lineHeightValue: number;
  onBottomSpacingChange: (key: MarginBottomSettingKey, value: string) => void;
  onLineHeightChange: (key: LineHeightSettingKey, value: string) => void;
};

export function TextSpacingSettingRows({
  bottomSpacingAriaLabel,
  bottomSpacingDefaultValue,
  bottomSpacingDescription,
  bottomSpacingId,
  bottomSpacingKey,
  bottomSpacingLabel,
  bottomSpacingValue,
  lineHeightAriaLabel,
  lineHeightDefaultValue,
  lineHeightDescription,
  lineHeightId,
  lineHeightKey,
  lineHeightLabel,
  lineHeightValue,
  onBottomSpacingChange,
  onLineHeightChange,
}: TextSpacingSettingRowsProps) {
  return (
    <>
      <NumericSettingRow
        ariaLabel={lineHeightAriaLabel}
        defaultValue={lineHeightDefaultValue}
        description={lineHeightDescription}
        id={lineHeightId}
        label={lineHeightLabel}
        max={2.5}
        min={0.8}
        onChange={(value) => onLineHeightChange(lineHeightKey, value)}
        step={0.05}
        unit="倍"
        value={lineHeightValue}
      />
      <NumericSettingRow
        ariaLabel={bottomSpacingAriaLabel}
        defaultValue={bottomSpacingDefaultValue}
        description={bottomSpacingDescription}
        id={bottomSpacingId}
        label={bottomSpacingLabel}
        max={48}
        min={0}
        onChange={(value) => onBottomSpacingChange(bottomSpacingKey, value)}
        step={1}
        unit="px"
        value={bottomSpacingValue}
      />
    </>
  );
}
