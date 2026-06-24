import { useState } from "react";
import {
  type SpecialRomajiInputPreset,
  type SokuonInputId,
} from "@/src/lib/typing";
import { topDisplayMetricOptions } from "../_lib/constants";
import { clampInteger } from "../_lib/challenge-utils";
import type { AppSettings, TargetDisplayElementId } from "../_lib/types";
import { MarginBottomSettingKey, FontSizeSettingKey, LineHeightSettingKey, SpecialRomajiOption, StandardRomajiOption } from "./input-settings/types";
export { commitNumberControlDraft, shouldPropagateNumberControlDraft } from "./input-settings/number-control";
import { InputScreenSettingsSection } from "./input-settings/input-screen-settings-section";
import { InputMethodSettingsSection } from "./input-settings/input-method-settings-section";
import { TopDisplaySettingsSection } from "./input-settings/top-display-settings-section";


type InputSettingsSectionsProps = {
  settings: AppSettings;
  onChange: (settings: Partial<AppSettings>) => void;
};

export function InputSettingsSections({ settings, onChange }: InputSettingsSectionsProps) {
  const [draggedDisplayOrderId, setDraggedDisplayOrderId] = useState<TargetDisplayElementId | null>(null);
  const showFuriganaDisplay = settings.showKanjiDisplay && settings.showFuriganaDisplay;
  const showKanjiMarker = settings.showKanjiDisplay && settings.showKanjiMarker;
  const showFuriganaMarker = showFuriganaDisplay && settings.showFuriganaMarker;
  const showHiraganaMarker = settings.showHiraganaDisplay && settings.showHiraganaMarker;
  const showKanjiInputProgress =
    settings.showKanjiDisplay && settings.showKanjiInputProgress;
  const showHiraganaInputProgress =
    settings.showHiraganaDisplay && settings.showHiraganaInputProgress;

  function getRomajiSelection(option: StandardRomajiOption) {
    return (
      settings.romajiInputSelections[option.id] ?? {
        accepted: option.alternatives,
        preferred: option.hepburn,
      }
    );
  }

  function updateRomajiSelection(
    option: StandardRomajiOption,
    selection: { accepted: string[]; preferred: string },
  ) {
    onChange({
      romajiInputSelections: {
        ...settings.romajiInputSelections,
        [option.id]: selection,
      },
    });
  }

  function toggleRomajiAccepted(option: StandardRomajiOption, value: string, checked: boolean) {
    const selection = getRomajiSelection(option);
    const accepted = checked
      ? Array.from(new Set([...selection.accepted, value]))
      : selection.accepted.filter((candidate) => candidate !== value);

    if (accepted.length === 0) {
      return;
    }

    updateRomajiSelection(option, {
      accepted,
      preferred: accepted.includes(selection.preferred) ? selection.preferred : accepted[0],
    });
  }

  function preferRomaji(option: StandardRomajiOption, preferred: string) {
    const selection = getRomajiSelection(option);
    updateRomajiSelection(option, {
      accepted: selection.accepted.includes(preferred)
        ? selection.accepted
        : [...selection.accepted, preferred],
      preferred,
    });
  }

  function getSpecialRomajiSelection(option: SpecialRomajiOption) {
    return (
      settings.specialRomajiInputSelections[option.id] ?? {
        accepted: option.alternatives,
        preferred: option.hepburn,
      }
    );
  }

  function updateSpecialRomajiSelection(
    option: SpecialRomajiOption,
    selection: { accepted: string[]; preferred: string },
  ) {
    onChange({
      specialRomajiInputSelections: {
        ...settings.specialRomajiInputSelections,
        [option.id]: selection,
      },
    });
  }

  function toggleSpecialRomajiAccepted(
    option: SpecialRomajiOption,
    value: string,
    checked: boolean,
  ) {
    const selection = getSpecialRomajiSelection(option);
    const accepted = checked
      ? Array.from(new Set([...selection.accepted, value]))
      : selection.accepted.filter((candidate) => candidate !== value);

    if (accepted.length === 0) {
      return;
    }

    updateSpecialRomajiSelection(option, {
      accepted,
      preferred: accepted.includes(selection.preferred) ? selection.preferred : accepted[0],
    });
  }

  function preferSpecialRomaji(option: SpecialRomajiOption, preferred: string) {
    const selection = getSpecialRomajiSelection(option);
    updateSpecialRomajiSelection(option, {
      accepted: selection.accepted.includes(preferred)
        ? selection.accepted
        : [...selection.accepted, preferred],
      preferred,
    });
  }

  function updateSpecialRomajiPreset(preset: SpecialRomajiInputPreset) {
    onChange({
      allowSplitSpecialYoon: preset === "split",
      specialRomajiInputPreset: preset,
    });
  }

  function toggleSokuonAccepted(value: SokuonInputId, checked: boolean) {
    const accepted = checked
      ? Array.from(new Set([...settings.sokuonInput.accepted, value]))
      : settings.sokuonInput.accepted.filter((candidate) => candidate !== value);

    if (accepted.length === 0) {
      return;
    }

    onChange({
      sokuonInput: {
        ...settings.sokuonInput,
        accepted,
        preferred: accepted.includes(settings.sokuonInput.preferred)
          ? settings.sokuonInput.preferred
          : accepted[0],
      },
    });
  }

  function preferSokuon(preferred: SokuonInputId) {
    onChange({
      sokuonInput: {
        ...settings.sokuonInput,
        accepted: settings.sokuonInput.accepted.includes(preferred)
          ? settings.sokuonInput.accepted
          : [...settings.sokuonInput.accepted, preferred],
        preferred,
      },
    });
  }

  function toggleTopDisplayMetric(id: AppSettings["topDisplayMetricIds"][number], checked: boolean) {
    const selectedIds = new Set(settings.topDisplayMetricIds);
    if (checked) {
      selectedIds.add(id);
    } else {
      selectedIds.delete(id);
    }

    onChange({
      topDisplayMetricIds: topDisplayMetricOptions
        .map((option) => option.id)
        .filter((metricId) => selectedIds.has(metricId)),
    });
  }

  function getTargetDisplayElementVisibility(id: TargetDisplayElementId) {
    if (id === "kanji") return settings.showKanjiDisplay;
    if (id === "kanjiInputProgress") return showKanjiInputProgress;
    if (id === "hiragana") return settings.showHiraganaDisplay;
    if (id === "hiraganaInputProgress") return showHiraganaInputProgress;
    return true;
  }

  function moveTargetDisplayElement(activeId: TargetDisplayElementId, overId: TargetDisplayElementId) {
    if (activeId === overId) {
      return;
    }

    const order = [...settings.targetDisplayOrder];
    const activeIndex = order.indexOf(activeId);
    const overIndex = order.indexOf(overId);
    if (activeIndex < 0 || overIndex < 0) {
      return;
    }

    const [active] = order.splice(activeIndex, 1);
    if (!active) {
      return;
    }

    order.splice(overIndex, 0, active);
    onChange({ targetDisplayOrder: order });
  }

  function stepTargetDisplayElement(id: TargetDisplayElementId, direction: -1 | 1) {
    const currentIndex = settings.targetDisplayOrder.indexOf(id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= settings.targetDisplayOrder.length) {
      return;
    }

    const order = [...settings.targetDisplayOrder];
    const [active] = order.splice(currentIndex, 1);
    if (!active) {
      return;
    }

    order.splice(nextIndex, 0, active);
    onChange({ targetDisplayOrder: order });
  }

  function updateFontSize(
    key: FontSizeSettingKey,
    value: string,
  ) {
    onChange({ [key]: clampInteger(value, 10, 48) } as Partial<AppSettings>);
  }

  function updateFuriganaFontScale(value: string) {
    const parsed = Number.parseFloat(value);
    const scale = Number.isNaN(parsed) ? 0.42 : Math.min(1, Math.max(0.2, parsed));

    onChange({ furiganaFontScale: Math.round(scale * 100) / 100 });
  }

  function updateLineHeight(key: LineHeightSettingKey, value: string) {
    const parsed = Number.parseFloat(value);
    const lineHeight = Number.isNaN(parsed) ? 1.45 : Math.min(2.5, Math.max(0.8, parsed));

    onChange({ [key]: Math.round(lineHeight * 100) / 100 } as Partial<AppSettings>);
  }

  function updateMarginBottom(key: MarginBottomSettingKey, value: string) {
    onChange({ [key]: clampInteger(value, 0, 48) } as Partial<AppSettings>);
  }

  function updateProductionLongTextLineCount(value: string) {
    onChange({ productionLongTextLineCount: clampInteger(value, 3, 12) });
  }

  const controller = {
    draggedDisplayOrderId,
    getRomajiSelection,
    getSpecialRomajiSelection,
    getTargetDisplayElementVisibility,
    moveTargetDisplayElement,
    onChange,
    preferRomaji,
    preferSokuon,
    preferSpecialRomaji,
    setDraggedDisplayOrderId,
    settings,
    showFuriganaDisplay,
    showFuriganaMarker,
    showHiraganaInputProgress,
    showHiraganaMarker,
    showKanjiInputProgress,
    showKanjiMarker,
    stepTargetDisplayElement,
    toggleRomajiAccepted,
    toggleSokuonAccepted,
    toggleSpecialRomajiAccepted,
    toggleTopDisplayMetric,
    updateFontSize,
    updateFuriganaFontScale,
    updateLineHeight,
    updateMarginBottom,
    updateProductionLongTextLineCount,
    updateSpecialRomajiPreset,
  };

  return (
    <>
      <TopDisplaySettingsSection controller={controller} />
      <InputMethodSettingsSection controller={controller} />
      <InputScreenSettingsSection controller={controller} />
    </>
  );
}
