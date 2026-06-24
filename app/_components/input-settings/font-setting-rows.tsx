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
import { FontSizeSettingKey } from "./types";

export type FontSizeSettingRowProps = {
  ariaLabel: string;
  defaultValue: number;
  description: string;
  id: string;
  label: string;
  value: number;
  onChange: (key: FontSizeSettingKey, value: string) => void;
  settingKey: FontSizeSettingKey;
};

export function FontSizeSettingRow({
  ariaLabel,
  defaultValue,
  description,
  id,
  label,
  value,
  onChange,
  settingKey,
}: FontSizeSettingRowProps) {
  return (
    <NumericSettingRow
      ariaLabel={ariaLabel}
      defaultValue={defaultValue}
      description={description}
      id={id}
      label={label}
      max={48}
      min={10}
      onChange={(nextValue) => onChange(settingKey, nextValue)}
      step={1}
      unit="px"
      value={value}
    />
  );
}

export type FontScaleSettingRowProps = {
  disabled: boolean;
  value: number;
  onChange: (value: string) => void;
};

export function FontScaleSettingRow({ disabled, value, onChange }: FontScaleSettingRowProps) {
  return (
    <NumericSettingRow
      ariaLabel="furigana font scale"
      defaultValue={initialSettings.furiganaFontScale}
      description="漢字フォントサイズに対するふりがなの倍率"
      disabled={disabled}
      id="furigana-font-scale-setting"
      label="ふりがなフォント倍率"
      lockLabel="ふりがな表示オフのためロック"
      max={1}
      min={0.2}
      onChange={onChange}
      step={0.01}
      unit="倍"
      value={value}
    />
  );
}

export type FontFamilyOption =
  | (typeof japaneseFontFamilyOptions)[number]
  | (typeof englishFontFamilyOptions)[number];

export type FontFamilySettingRowProps = {
  ariaLabel: string;
  description: string;
  id: string;
  label: string;
  options: readonly FontFamilyOption[];
  value: string;
  onChange: (value: string) => void;
};

export function FontFamilySettingRow({
  ariaLabel,
  description,
  id,
  label,
  options,
  value,
  onChange,
}: FontFamilySettingRowProps) {
  return (
    <section className={css(styles, "settings-row")} aria-labelledby={id}>
      <div>
        <h4 className={css(styles, "font-size-setting")} id={id}>
          {label}
        </h4>
        <p>{description}</p>
      </div>
      <label className={css(styles, "font-family-select")}>
        <select
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.currentTarget.value)}
          value={value}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
