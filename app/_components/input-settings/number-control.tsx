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


export type NumericSettingRowProps = {
  ariaLabel: string;
  defaultValue: number;
  description: string;
  disabled?: boolean;
  id: string;
  label: string;
  max: number;
  min: number;
  step: number;
  unit: string;
  value: number;
  onChange: (value: string) => void;
  lockLabel?: string;
};

export function NumericSettingRow({
  ariaLabel,
  defaultValue,
  description,
  disabled = false,
  id,
  label,
  max,
  min,
  step,
  unit,
  value,
  onChange,
  lockLabel,
}: NumericSettingRowProps) {
  return (
    <section className={css(styles, "settings-row")} aria-labelledby={id}>
      <div>
        <h4 className={css(styles, "font-size-setting")} id={id}>
          {label}
        </h4>
        <p>{description}</p>
      </div>
      <NumberControl
        ariaLabel={ariaLabel}
        defaultValue={defaultValue}
        disabled={disabled}
        lockLabel={lockLabel}
        max={max}
        min={min}
        onChange={onChange}
        step={step}
        unit={unit}
        value={value}
      />
    </section>
  );
}

export type NumberControlProps = {
  ariaLabel: string;
  defaultValue: number;
  disabled?: boolean;
  lockLabel?: string;
  max: number;
  min: number;
  step: number;
  unit: string;
  value: number;
  onChange: (value: string) => void;
};

export function NumberControl({
  ariaLabel,
  defaultValue,
  disabled = false,
  lockLabel,
  max,
  min,
  step,
  unit,
  value,
  onChange,
}: NumberControlProps) {
  const formattedValue = formatNumberControlValue(value, step);
  const [draftValue, setDraftValue] = useState(formattedValue);
  const [isEditing, setIsEditing] = useState(false);
  const canIncrease = !disabled && value < max;
  const canDecrease = !disabled && value > min;
  const formattedDefaultValue = formatNumberControlValue(defaultValue, step);
  const canReset =
    !disabled && formattedValue !== formattedDefaultValue;

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(formattedValue);
    }
  }, [formattedValue, isEditing]);

  function handleDraftChange(nextDraftValue: string) {
    setDraftValue(nextDraftValue);

    if (shouldPropagateNumberControlDraft(nextDraftValue, min, max)) {
      onChange(formatNumberControlValue(Number(nextDraftValue), step));
    }
  }

  function commitDraft() {
    const committedValue = commitNumberControlDraft(draftValue, min, max, step);
    setIsEditing(false);
    setDraftValue(committedValue);
    onChange(committedValue);
  }

  function changeBy(delta: number) {
    const nextValue = Math.min(max, Math.max(min, value + delta));
    setDraftValue(formatNumberControlValue(nextValue, step));
    onChange(formatNumberControlValue(nextValue, step));
  }

  function resetToDefault() {
    setDraftValue(formattedDefaultValue);
    onChange(formattedDefaultValue);
  }

  return (
    <div className={css(styles, "number-control", disabled ? "locked" : "")}>
      <input
        aria-label={ariaLabel}
        disabled={disabled}
        min={min}
        max={max}
        onBlur={commitDraft}
        onChange={(event) => handleDraftChange(event.currentTarget.value)}
        onFocus={() => setIsEditing(true)}
        step={step}
        type="number"
        value={isEditing ? draftValue : formattedValue}
      />
      <span>{unit}</span>
      {disabled && lockLabel ? (
        <b className={css(styles, "number-lock-icon")} aria-label={lockLabel}>
          <Lock aria-hidden="true" size={15} strokeWidth={2.6} />
        </b>
      ) : null}
      <button
        aria-label={`${ariaLabel} を初期値に戻す`}
        className={css(styles, "number-reset-button")}
        disabled={!canReset}
        onClick={resetToDefault}
        title="初期値に戻す"
        type="button"
      >
        <RotateCcw aria-hidden="true" size={14} />
      </button>
      <div className={css(styles, "number-stepper")} aria-label={`${ariaLabel} を調整`}>
        <button
          aria-label={`${ariaLabel} を増やす`}
          disabled={!canIncrease}
          onClick={() => changeBy(step)}
          type="button"
        >
          <ChevronUp size={14} />
        </button>
        <button
          aria-label={`${ariaLabel} を減らす`}
          disabled={!canDecrease}
          onClick={() => changeBy(-step)}
          type="button"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}

export function shouldPropagateNumberControlDraft(value: string, min: number, max: number) {
  const parsed = parseNumberControlDraft(value);

  return parsed !== null && parsed >= min && parsed <= max;
}

export function commitNumberControlDraft(value: string, min: number, max: number, step: number) {
  const parsed = parseNumberControlDraft(value);
  const nextValue = parsed === null ? min : Math.min(max, Math.max(min, parsed));

  return formatNumberControlValue(nextValue, step);
}

export function parseNumberControlDraft(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function formatNumberControlValue(value: number, step: number) {
  const fractionDigits = Math.max(0, `${step}`.split(".")[1]?.length ?? 0);
  return Number(value.toFixed(fractionDigits)).toString();
}
