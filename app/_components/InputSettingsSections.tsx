import { ChevronDown, ChevronUp, Lock, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import {
	specialRomajiVariantOptions,
	standardRomajiVariantOptions,
	sokuonInputOptions,
	type SpecialRomajiInputPreset,
	type SokuonInputId,
} from "@/src/lib/typing";
import { css } from "../_lib/css-module";
import { initialSettings, topDisplayMetricOptions } from "../_lib/constants";
import { clampInteger } from "../_lib/challenge-utils";
import type { AppSettings, NextChallengePreviewMode } from "../_lib/types";
import styles from "./SettingsScreen.module.css";

type InputSettingsSectionsProps = {
	settings: AppSettings;
	onChange: (settings: Partial<AppSettings>) => void;
};

type StandardRomajiOption = (typeof standardRomajiVariantOptions)[number];
type SpecialRomajiOption = (typeof specialRomajiVariantOptions)[number];

type FontSizeSettingKey =
	| "kanjiFontSize"
	| "hiraganaFontSize"
	| "romajiFontSize";

type LineHeightSettingKey =
	| "kanjiLineHeight"
	| "furiganaLineHeight"
	| "hiraganaLineHeight"
	| "romajiLineHeight";

type MarginBottomSettingKey =
	| "kanjiMarginBottom"
	| "furiganaMarginBottom"
	| "hiraganaMarginBottom"
	| "romajiMarginBottom";

const nextChallengePreviewModeOptions: Array<{
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
		label: "中央揃え",
		description: "入力位置を中心に置く連続表示",
	},
	{
		id: "none",
		label: "非表示",
		description: "次の課題を表示しない",
	},
];

type NumericSettingRowProps = {
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

function NumericSettingRow({
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

type NumberControlProps = {
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

function NumberControl({
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
	const canReset = !disabled && formattedValue !== formattedDefaultValue;

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
			<div
				className={css(styles, "number-stepper")}
				aria-label={`${ariaLabel} を調整`}
			>
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

export function shouldPropagateNumberControlDraft(
	value: string,
	min: number,
	max: number,
) {
	const parsed = parseNumberControlDraft(value);

	return parsed !== null && parsed >= min && parsed <= max;
}

export function commitNumberControlDraft(
	value: string,
	min: number,
	max: number,
	step: number,
) {
	const parsed = parseNumberControlDraft(value);
	const nextValue =
		parsed === null ? min : Math.min(max, Math.max(min, parsed));

	return formatNumberControlValue(nextValue, step);
}

function parseNumberControlDraft(value: string) {
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

type TextSpacingSettingRowsProps = {
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

function TextSpacingSettingRows({
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

type FontSizeSettingRowProps = {
	ariaLabel: string;
	defaultValue: number;
	description: string;
	id: string;
	label: string;
	value: number;
	onChange: (key: FontSizeSettingKey, value: string) => void;
	settingKey: FontSizeSettingKey;
};

function FontSizeSettingRow({
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

type FontScaleSettingRowProps = {
	disabled: boolean;
	value: number;
	onChange: (value: string) => void;
};

function FontScaleSettingRow({
	disabled,
	value,
	onChange,
}: FontScaleSettingRowProps) {
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

export function InputSettingsSections({
	settings,
	onChange,
}: InputSettingsSectionsProps) {
	const showFuriganaDisplay =
		settings.showKanjiDisplay && settings.showFuriganaDisplay;
	const showKanjiMarker = settings.showKanjiDisplay && settings.showKanjiMarker;
	const showFuriganaMarker = showFuriganaDisplay && settings.showFuriganaMarker;
	const showHiraganaMarker =
		settings.showHiraganaDisplay && settings.showHiraganaMarker;

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

	function toggleRomajiAccepted(
		option: StandardRomajiOption,
		value: string,
		checked: boolean,
	) {
		const selection = getRomajiSelection(option);
		const accepted = checked
			? Array.from(new Set([...selection.accepted, value]))
			: selection.accepted.filter((candidate) => candidate !== value);

		if (accepted.length === 0) {
			return;
		}

		updateRomajiSelection(option, {
			accepted,
			preferred: accepted.includes(selection.preferred)
				? selection.preferred
				: accepted[0],
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
			preferred: accepted.includes(selection.preferred)
				? selection.preferred
				: accepted[0],
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
			: settings.sokuonInput.accepted.filter(
					(candidate) => candidate !== value,
				);

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

	function toggleTopDisplayMetric(
		id: AppSettings["topDisplayMetricIds"][number],
		checked: boolean,
	) {
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

	function updateFontSize(key: FontSizeSettingKey, value: string) {
		onChange({ [key]: clampInteger(value, 10, 48) } as Partial<AppSettings>);
	}

	function updateFuriganaFontScale(value: string) {
		const parsed = Number.parseFloat(value);
		const scale = Number.isNaN(parsed)
			? 0.42
			: Math.min(1, Math.max(0.2, parsed));

		onChange({ furiganaFontScale: Math.round(scale * 100) / 100 });
	}

	function updateLineHeight(key: LineHeightSettingKey, value: string) {
		const parsed = Number.parseFloat(value);
		const lineHeight = Number.isNaN(parsed)
			? 1.45
			: Math.min(2.5, Math.max(0.8, parsed));

		onChange({
			[key]: Math.round(lineHeight * 100) / 100,
		} as Partial<AppSettings>);
	}

	function updateMarginBottom(key: MarginBottomSettingKey, value: string) {
		onChange({ [key]: clampInteger(value, 0, 48) } as Partial<AppSettings>);
	}

	function updateProductionLongTextLineCount(value: string) {
		onChange({ productionLongTextLineCount: clampInteger(value, 3, 12) });
	}

	return (
		<>
			<section
				className={css(styles, "settings-category")}
				aria-labelledby="top-display-settings"
			>
				<h3
					className={css(styles, "settings-category-title")}
					id="top-display-settings"
				>
					上部表示情報
				</h3>
				<div className={css(styles, "settings-category-list")}>
					<section
						className={css(styles, "settings-row top-display-settings-row")}
						aria-labelledby="top-display-setting"
					>
						<div>
							<h4 id="top-display-setting">表示する情報</h4>
							<p>残り時間を外しても、残り時間バーは表示されます。</p>
						</div>
						<div
							className={css(styles, "top-display-setting-controls")}
							aria-label="上部表示情報"
						>
							{topDisplayMetricOptions.map((option) => (
								<label
									className={css(styles, "top-display-option")}
									key={option.id}
								>
									<input
										checked={settings.topDisplayMetricIds.includes(option.id)}
										onChange={(event) =>
											toggleTopDisplayMetric(
												option.id,
												event.currentTarget.checked,
											)
										}
										type="checkbox"
									/>
									<span>{option.label}</span>
								</label>
							))}
						</div>
					</section>
				</div>
			</section>

			<section
				className={css(styles, "settings-category")}
				aria-labelledby="input-settings"
			>
				<h3
					className={css(styles, "settings-category-title")}
					id="input-settings"
				>
					入力方式
				</h3>
				<div className={css(styles, "settings-category-list")}>
					<section
						className={css(styles, "settings-row romaji-method-row")}
						aria-labelledby="romaji-method-setting"
					>
						<div>
							<h4 id="romaji-method-setting">ローマ字入力法</h4>
							<p>許容する派生と、ガイドで優先表示する表記を選ぶ</p>
						</div>
						<div className={css(styles, "romaji-method-controls")}>
							<div
								className={css(styles, "romaji-preset-segmented")}
								role="group"
								aria-label="ローマ字入力法"
							>
								<button
									aria-pressed={settings.romajiInputPreset === "hepburn"}
									className={
										settings.romajiInputPreset === "hepburn"
											? css(styles, "selected")
											: ""
									}
									onClick={() => onChange({ romajiInputPreset: "hepburn" })}
									type="button"
								>
									ヘボン式優先
								</button>
								<button
									aria-pressed={settings.romajiInputPreset === "shortest"}
									className={
										settings.romajiInputPreset === "shortest"
											? css(styles, "selected")
											: ""
									}
									onClick={() => onChange({ romajiInputPreset: "shortest" })}
									type="button"
								>
									最短優先
								</button>
								<button
									aria-pressed={settings.romajiInputPreset === "custom"}
									className={
										settings.romajiInputPreset === "custom"
											? css(styles, "selected")
											: ""
									}
									onClick={() => onChange({ romajiInputPreset: "custom" })}
									type="button"
								>
									個別設定
								</button>
							</div>

							{settings.romajiInputPreset === "custom" ? (
								<div className={css(styles, "romaji-custom-list")}>
									{standardRomajiVariantOptions.map((option) => {
										const selection = getRomajiSelection(option);

										return (
											<div
												className={css(styles, "romaji-custom-item")}
												key={option.id}
											>
												<span>{option.label}</span>
												<div className={css(styles, "romaji-choice-list")}>
													{option.alternatives.map((alternative) => (
														<label key={alternative}>
															<input
																checked={selection.accepted.includes(
																	alternative,
																)}
																onChange={(event) =>
																	toggleRomajiAccepted(
																		option,
																		alternative,
																		event.currentTarget.checked,
																	)
																}
																type="checkbox"
															/>
															{alternative}
														</label>
													))}
												</div>
												<label
													className={css(styles, "romaji-preferred-select")}
												>
													<span>表示</span>
													<select
														onChange={(event) =>
															preferRomaji(option, event.currentTarget.value)
														}
														value={selection.preferred}
													>
														{option.alternatives.map((alternative) => (
															<option key={alternative} value={alternative}>
																{alternative}
															</option>
														))}
													</select>
												</label>
											</div>
										);
									})}
								</div>
							) : null}
						</div>
					</section>

					<section
						className={css(styles, "settings-row sokuon-method-row")}
						aria-labelledby="sokuon-setting"
					>
						<div>
							<h4 id="sokuon-setting">促音入力</h4>
							<p>「っ」の子音重複と ltsu / xtsu / ltu / xtu の扱いを選ぶ</p>
						</div>
						<div className={css(styles, "sokuon-setting-controls")}>
							<label className={css(styles, "sokuon-split-toggle")}>
								<span>促音分割を許可</span>
								<span className={css(styles, "toggle-control")}>
									<input
										checked={settings.sokuonInput.allowSplit}
										onChange={(event) =>
											onChange({
												sokuonInput: {
													...settings.sokuonInput,
													allowSplit: event.currentTarget.checked,
												},
											})
										}
										type="checkbox"
									/>
									<span aria-hidden="true" />
								</span>
							</label>
							<div
								className={css(styles, "romaji-choice-list")}
								aria-label="促音入力候補"
							>
								{sokuonInputOptions.map((option) => (
									<label key={option}>
										<input
											checked={settings.sokuonInput.accepted.includes(option)}
											onChange={(event) =>
												toggleSokuonAccepted(
													option,
													event.currentTarget.checked,
												)
											}
											type="checkbox"
										/>
										{option}
									</label>
								))}
							</div>
							<label className={css(styles, "romaji-preferred-select")}>
								<span>表示</span>
								<select
									onChange={(event) =>
										preferSokuon(event.currentTarget.value as SokuonInputId)
									}
									value={settings.sokuonInput.preferred}
								>
									{sokuonInputOptions.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</label>
						</div>
					</section>

					<section
						className={css(styles, "settings-row")}
						aria-labelledby="split-yoon-setting"
					>
						<div>
							<h4 id="split-yoon-setting">一般拗音分割入力</h4>
							<p>
								「きゃ」を kya だけでなく kila / kixa でも入力できるようにする
							</p>
						</div>
						<label className={css(styles, "toggle-control")}>
							<input
								checked={settings.allowSplitYoon}
								onChange={(event) =>
									onChange({ allowSplitYoon: event.currentTarget.checked })
								}
								type="checkbox"
							/>
							<span aria-hidden="true" />
						</label>
					</section>

					<section
						className={css(styles, "settings-row")}
						aria-labelledby="special-yoon-method-setting"
					>
						<div>
							<h4 id="special-yoon-method-setting">特殊拗音入力法</h4>
							<p>
								出現頻度の低い外来語カナを統合形で打つか、分割形で打つかを選ぶ
							</p>
						</div>
						<div className={css(styles, "romaji-method-controls")}>
							<div
								className={css(styles, "romaji-preset-segmented")}
								role="group"
								aria-label="特殊拗音入力法"
							>
								<button
									aria-pressed={settings.specialRomajiInputPreset === "split"}
									className={
										settings.specialRomajiInputPreset === "split"
											? css(styles, "selected")
											: ""
									}
									onClick={() => updateSpecialRomajiPreset("split")}
									type="button"
								>
									すべて分割
								</button>
								<button
									aria-pressed={
										settings.specialRomajiInputPreset === "integrated"
									}
									className={
										settings.specialRomajiInputPreset === "integrated"
											? css(styles, "selected")
											: ""
									}
									onClick={() => updateSpecialRomajiPreset("integrated")}
									type="button"
								>
									すべて統合
								</button>
								<button
									aria-pressed={settings.specialRomajiInputPreset === "custom"}
									className={
										settings.specialRomajiInputPreset === "custom"
											? css(styles, "selected")
											: ""
									}
									onClick={() => updateSpecialRomajiPreset("custom")}
									type="button"
								>
									個別設定
								</button>
							</div>

							{settings.specialRomajiInputPreset === "custom" ? (
								<div className={css(styles, "romaji-custom-list")}>
									{specialRomajiVariantOptions.map((option) => {
										const selection = getSpecialRomajiSelection(option);

										return (
											<div
												className={css(styles, "romaji-custom-item")}
												key={option.id}
											>
												<span>{option.label}</span>
												<div className={css(styles, "romaji-choice-list")}>
													{option.alternatives.map((alternative) => (
														<label key={alternative}>
															<input
																checked={selection.accepted.includes(
																	alternative,
																)}
																onChange={(event) =>
																	toggleSpecialRomajiAccepted(
																		option,
																		alternative,
																		event.currentTarget.checked,
																	)
																}
																type="checkbox"
															/>
															{alternative}
														</label>
													))}
												</div>
												<label
													className={css(styles, "romaji-preferred-select")}
												>
													<span>表示</span>
													<select
														onChange={(event) =>
															preferSpecialRomaji(
																option,
																event.currentTarget.value,
															)
														}
														value={selection.preferred}
													>
														{option.alternatives.map((alternative) => (
															<option key={alternative} value={alternative}>
																{alternative}
															</option>
														))}
													</select>
												</label>
											</div>
										);
									})}
								</div>
							) : null}
						</div>
					</section>
				</div>
			</section>

			<section
				className={css(styles, "settings-category")}
				aria-labelledby="input-screen-settings"
			>
				<h3
					className={css(styles, "settings-category-title")}
					id="input-screen-settings"
				>
					入力画面
				</h3>
				<div
					className={css(
						styles,
						"settings-category-list input-screen-category-list",
					)}
				>
					<section
						className={css(styles, "settings-subcategory")}
						aria-labelledby="kanji-input-screen-settings"
					>
						<h4
							className={css(styles, "settings-subcategory-title")}
							id="kanji-input-screen-settings"
						>
							漢字
						</h4>
						<div className={css(styles, "settings-subcategory-list")}>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="kanji-display-setting"
							>
								<div>
									<h4 id="kanji-display-setting">漢字表示</h4>
									<p>入力画面に漢字混じりの課題文を表示する</p>
								</div>
								<label
									className={css(styles, "toggle-control")}
									aria-label="漢字表示"
								>
									<input
										checked={settings.showKanjiDisplay}
										onChange={(event) =>
											onChange({
												showFuriganaDisplay: event.currentTarget.checked
													? settings.showFuriganaDisplay
													: false,
												showFuriganaMarker: event.currentTarget.checked
													? settings.showFuriganaMarker
													: false,
												showKanjiDisplay: event.currentTarget.checked,
												showKanjiMarker: event.currentTarget.checked
													? settings.showKanjiMarker
													: false,
											})
										}
										type="checkbox"
									/>
									<span aria-hidden="true" />
								</label>
							</section>
							<FontSizeSettingRow
								ariaLabel="kanji font size"
								defaultValue={initialSettings.kanjiFontSize}
								description="漢字混じりの課題文の文字サイズ"
								id="kanji-font-size-setting"
								label="漢字フォントサイズ"
								onChange={updateFontSize}
								settingKey="kanjiFontSize"
								value={settings.kanjiFontSize}
							/>
							<TextSpacingSettingRows
								bottomSpacingAriaLabel="kanji bottom spacing"
								bottomSpacingDefaultValue={initialSettings.kanjiMarginBottom}
								bottomSpacingDescription="漢字行の下に空ける余白"
								bottomSpacingId="kanji-bottom-spacing-setting"
								bottomSpacingKey="kanjiMarginBottom"
								bottomSpacingLabel="漢字の下余白"
								bottomSpacingValue={settings.kanjiMarginBottom}
								lineHeightAriaLabel="kanji line height"
								lineHeightDefaultValue={initialSettings.kanjiLineHeight}
								lineHeightDescription="漢字行の行間倍率"
								lineHeightId="kanji-line-height-setting"
								lineHeightKey="kanjiLineHeight"
								lineHeightLabel="漢字の行間"
								lineHeightValue={settings.kanjiLineHeight}
								onBottomSpacingChange={updateMarginBottom}
								onLineHeightChange={updateLineHeight}
							/>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="kanji-marker-setting"
							>
								<div>
									<h4 id="kanji-marker-setting">漢字マーカー</h4>
									<p>入力中の位置を漢字表示に下線で表示する</p>
								</div>
								<label
									className={css(
										styles,
										"toggle-control",
										settings.showKanjiDisplay ? "" : "locked",
									)}
									aria-label="漢字マーカー"
								>
									<input
										checked={showKanjiMarker}
										disabled={!settings.showKanjiDisplay}
										onChange={(event) =>
											onChange({ showKanjiMarker: event.currentTarget.checked })
										}
										type="checkbox"
									/>
									<span aria-hidden="true" />
									{!settings.showKanjiDisplay ? (
										<b
											className={css(styles, "toggle-lock-icon")}
											aria-label="漢字表示オフのためロック"
										>
											<Lock aria-hidden="true" size={15} strokeWidth={2.6} />
										</b>
									) : null}
								</label>
							</section>
						</div>
					</section>

					<section
						className={css(styles, "settings-subcategory")}
						aria-labelledby="furigana-input-screen-settings"
					>
						<h4
							className={css(styles, "settings-subcategory-title")}
							id="furigana-input-screen-settings"
						>
							ふりがな
						</h4>
						<div className={css(styles, "settings-subcategory-list")}>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="furigana-display-setting"
							>
								<div>
									<h4 id="furigana-display-setting">ふりがな表示</h4>
									<p>漢字混じりの課題文の上にふりがなを表示する</p>
								</div>
								<label
									className={css(
										styles,
										"toggle-control",
										settings.showKanjiDisplay ? "" : "locked",
									)}
									aria-label="ふりがな表示"
								>
									<input
										checked={showFuriganaDisplay}
										disabled={!settings.showKanjiDisplay}
										onChange={(event) =>
											onChange({
												showFuriganaDisplay: event.currentTarget.checked,
												showFuriganaMarker: event.currentTarget.checked
													? settings.showFuriganaMarker
													: false,
											})
										}
										type="checkbox"
									/>
									<span aria-hidden="true" />
									{!settings.showKanjiDisplay ? (
										<b
											className={css(styles, "toggle-lock-icon")}
											aria-label="漢字表示オフのためロック"
										>
											<Lock aria-hidden="true" size={15} strokeWidth={2.6} />
										</b>
									) : null}
								</label>
							</section>
							<FontScaleSettingRow
								disabled={!showFuriganaDisplay}
								onChange={updateFuriganaFontScale}
								value={settings.furiganaFontScale}
							/>
							<TextSpacingSettingRows
								bottomSpacingAriaLabel="furigana bottom spacing"
								bottomSpacingDefaultValue={initialSettings.furiganaMarginBottom}
								bottomSpacingDescription="ふりがな側に追加する下余白"
								bottomSpacingId="furigana-bottom-spacing-setting"
								bottomSpacingKey="furiganaMarginBottom"
								bottomSpacingLabel="ふりがなの下余白"
								bottomSpacingValue={settings.furiganaMarginBottom}
								lineHeightAriaLabel="furigana line height"
								lineHeightDefaultValue={initialSettings.furiganaLineHeight}
								lineHeightDescription="ふりがなの行間倍率"
								lineHeightId="furigana-line-height-setting"
								lineHeightKey="furiganaLineHeight"
								lineHeightLabel="ふりがなの行間"
								lineHeightValue={settings.furiganaLineHeight}
								onBottomSpacingChange={updateMarginBottom}
								onLineHeightChange={updateLineHeight}
							/>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="furigana-marker-setting"
							>
								<div>
									<h4 id="furigana-marker-setting">ふりがなマーカー</h4>
									<p>入力中の位置をふりがな表示に下線で表示する</p>
								</div>
								<label
									className={css(
										styles,
										"toggle-control",
										showFuriganaDisplay ? "" : "locked",
									)}
									aria-label="ふりがなマーカー"
								>
									<input
										checked={showFuriganaMarker}
										disabled={!showFuriganaDisplay}
										onChange={(event) =>
											onChange({
												showFuriganaMarker: event.currentTarget.checked,
											})
										}
										type="checkbox"
									/>
									<span aria-hidden="true" />
									{!showFuriganaDisplay ? (
										<b
											className={css(styles, "toggle-lock-icon")}
											aria-label="ふりがな表示オフのためロック"
										>
											<Lock aria-hidden="true" size={15} strokeWidth={2.6} />
										</b>
									) : null}
								</label>
							</section>
						</div>
					</section>

					<section
						className={css(styles, "settings-subcategory")}
						aria-labelledby="hiragana-input-screen-settings"
					>
						<h4
							className={css(styles, "settings-subcategory-title")}
							id="hiragana-input-screen-settings"
						>
							ひらがな
						</h4>
						<div className={css(styles, "settings-subcategory-list")}>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="hiragana-display-setting"
							>
								<div>
									<h4 id="hiragana-display-setting">ひらがな表示</h4>
									<p>入力画面にひらがなの読みを表示する</p>
								</div>
								<label
									className={css(styles, "toggle-control")}
									aria-label="ひらがな表示"
								>
									<input
										checked={settings.showHiraganaDisplay}
										onChange={(event) =>
											onChange({
												showHiraganaDisplay: event.currentTarget.checked,
												showHiraganaMarker: event.currentTarget.checked
													? settings.showHiraganaMarker
													: false,
											})
										}
										type="checkbox"
									/>
									<span aria-hidden="true" />
								</label>
							</section>
							<FontSizeSettingRow
								ariaLabel="hiragana font size"
								defaultValue={initialSettings.hiraganaFontSize}
								description="ひらがなの読みの文字サイズ"
								id="hiragana-font-size-setting"
								label="ひらがなフォントサイズ"
								onChange={updateFontSize}
								settingKey="hiraganaFontSize"
								value={settings.hiraganaFontSize}
							/>
							<TextSpacingSettingRows
								bottomSpacingAriaLabel="hiragana bottom spacing"
								bottomSpacingDefaultValue={initialSettings.hiraganaMarginBottom}
								bottomSpacingDescription="ひらがな行の下に空ける余白"
								bottomSpacingId="hiragana-bottom-spacing-setting"
								bottomSpacingKey="hiraganaMarginBottom"
								bottomSpacingLabel="ひらがなの下余白"
								bottomSpacingValue={settings.hiraganaMarginBottom}
								lineHeightAriaLabel="hiragana line height"
								lineHeightDefaultValue={initialSettings.hiraganaLineHeight}
								lineHeightDescription="ひらがな行の行間倍率"
								lineHeightId="hiragana-line-height-setting"
								lineHeightKey="hiraganaLineHeight"
								lineHeightLabel="ひらがなの行間"
								lineHeightValue={settings.hiraganaLineHeight}
								onBottomSpacingChange={updateMarginBottom}
								onLineHeightChange={updateLineHeight}
							/>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="hiragana-marker-setting"
							>
								<div>
									<h4 id="hiragana-marker-setting">ひらがなマーカー</h4>
									<p>入力中の位置をひらがな表示に下線で表示する</p>
								</div>
								<label
									className={css(
										styles,
										"toggle-control",
										settings.showHiraganaDisplay ? "" : "locked",
									)}
									aria-label="ひらがなマーカー"
								>
									<input
										checked={showHiraganaMarker}
										disabled={!settings.showHiraganaDisplay}
										onChange={(event) =>
											onChange({
												showHiraganaMarker: event.currentTarget.checked,
											})
										}
										type="checkbox"
									/>
									<span aria-hidden="true" />
									{!settings.showHiraganaDisplay ? (
										<b
											className={css(styles, "toggle-lock-icon")}
											aria-label="ひらがな表示オフのためロック"
										>
											<Lock aria-hidden="true" size={15} strokeWidth={2.6} />
										</b>
									) : null}
								</label>
							</section>
						</div>
					</section>

					<section
						className={css(styles, "settings-subcategory")}
						aria-labelledby="romaji-input-screen-settings"
					>
						<h4
							className={css(styles, "settings-subcategory-title")}
							id="romaji-input-screen-settings"
						>
							ローマ字
						</h4>
						<div className={css(styles, "settings-subcategory-list")}>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="romaji-marker-setting"
							>
								<div>
									<h4 id="romaji-marker-setting">ローマ字マーカー</h4>
									<p>入力中の位置をローマ字表示に下線で表示する。ON推奨</p>
								</div>
								<label
									className={css(styles, "toggle-control")}
									aria-label="ローマ字マーカー"
								>
									<input
										checked={settings.showRomajiMarker}
										onChange={(event) =>
											onChange({
												showRomajiMarker: event.currentTarget.checked,
											})
										}
										type="checkbox"
									/>
									<span aria-hidden="true" />
								</label>
							</section>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="romaji-marker-mode-setting"
							>
								<div>
									<h4
										className={css(styles, "font-size-setting")}
										id="romaji-marker-mode-setting"
									>
										ローマ字マーカー単位
									</h4>
									<p>
										ローマ字の現在位置を1文字ずつ表示するか、su や shi
										などの発音単位で表示するかを選ぶ
									</p>
								</div>
								<div
									className={css(styles, "romaji-preset-segmented")}
									role="group"
									aria-label="romaji marker mode"
								>
									<button
										aria-pressed={settings.romajiMarkerMode === "character"}
										className={
											settings.romajiMarkerMode === "character"
												? css(styles, "selected")
												: ""
										}
										onClick={() => onChange({ romajiMarkerMode: "character" })}
										type="button"
									>
										文字単位
									</button>
									<button
										aria-pressed={settings.romajiMarkerMode === "token"}
										className={
											settings.romajiMarkerMode === "token"
												? css(styles, "selected")
												: ""
										}
										onClick={() => onChange({ romajiMarkerMode: "token" })}
										type="button"
									>
										発音単位
									</button>
								</div>
							</section>
							<FontSizeSettingRow
								ariaLabel="romaji font size"
								defaultValue={initialSettings.romajiFontSize}
								description="ローマ字の課題文の文字サイズ"
								id="romaji-font-size-setting"
								label="ローマ字フォントサイズ"
								onChange={updateFontSize}
								settingKey="romajiFontSize"
								value={settings.romajiFontSize}
							/>
							<TextSpacingSettingRows
								bottomSpacingAriaLabel="romaji bottom spacing"
								bottomSpacingDefaultValue={initialSettings.romajiMarginBottom}
								bottomSpacingDescription="ローマ字行の下に空ける余白"
								bottomSpacingId="romaji-bottom-spacing-setting"
								bottomSpacingKey="romajiMarginBottom"
								bottomSpacingLabel="ローマ字の下余白"
								bottomSpacingValue={settings.romajiMarginBottom}
								lineHeightAriaLabel="romaji line height"
								lineHeightDefaultValue={initialSettings.romajiLineHeight}
								lineHeightDescription="ローマ字行の行間倍率"
								lineHeightId="romaji-line-height-setting"
								lineHeightKey="romajiLineHeight"
								lineHeightLabel="ローマ字の行間"
								lineHeightValue={settings.romajiLineHeight}
								onBottomSpacingChange={updateMarginBottom}
								onLineHeightChange={updateLineHeight}
							/>
						</div>
					</section>

					<section
						className={css(styles, "settings-subcategory")}
						aria-labelledby="other-input-screen-settings"
					>
						<h4
							className={css(styles, "settings-subcategory-title")}
							id="other-input-screen-settings"
						>
							その他の設定
						</h4>
						<div className={css(styles, "settings-subcategory-list")}>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="next-challenge-preview-mode-setting"
							>
								<div>
									<h4 id="next-challenge-preview-mode-setting">
										次の課題の表示方式
									</h4>
									<p>短文練習で次の課題をどう見せるかを選ぶ</p>
								</div>
								<div
									className={css(styles, "preview-mode-segmented")}
									role="group"
									aria-label="次の課題の表示方式"
								>
									{nextChallengePreviewModeOptions.map((option) => (
										<button
											aria-pressed={
												settings.nextChallengePreviewMode === option.id
											}
											className={
												settings.nextChallengePreviewMode === option.id
													? css(styles, "selected")
													: ""
											}
											key={option.id}
											onClick={() =>
												onChange({ nextChallengePreviewMode: option.id })
											}
											title={option.description}
											type="button"
										>
											{option.label}
										</button>
									))}
								</div>
							</section>
							<NumericSettingRow
								ariaLabel="long text kanji area height"
								defaultValue={initialSettings.productionLongTextLineCount}
								description="本番（IMEなし）の漢字文を表示する行数"
								id="production-long-text-line-count-setting"
								label="長文モードの漢字文エリアの高さ"
								max={12}
								min={3}
								onChange={updateProductionLongTextLineCount}
								step={1}
								unit="行"
								value={settings.productionLongTextLineCount}
							/>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="strict-mistake-display-setting"
							>
								<div>
									<h4 id="strict-mistake-display-setting">
										正確無比の誤入力表示
									</h4>
									<p>誤入力した文字を課題文ローマ字上に表示する方法を選ぶ</p>
								</div>
								<div
									className={css(styles, "romaji-preset-segmented")}
									role="group"
									aria-label="正確無比の誤入力表示"
								>
									<button
										aria-pressed={
											settings.strictMistakeDisplayMode === "overwrite"
										}
										className={
											settings.strictMistakeDisplayMode === "overwrite"
												? css(styles, "selected")
												: ""
										}
										onClick={() =>
											onChange({ strictMistakeDisplayMode: "overwrite" })
										}
										type="button"
									>
										上書き
									</button>
									<button
										aria-pressed={
											settings.strictMistakeDisplayMode === "insert"
										}
										className={
											settings.strictMistakeDisplayMode === "insert"
												? css(styles, "selected")
												: ""
										}
										onClick={() =>
											onChange({ strictMistakeDisplayMode: "insert" })
										}
										type="button"
									>
										挿入
									</button>
									<button
										aria-pressed={settings.strictMistakeDisplayMode === "none"}
										className={
											settings.strictMistakeDisplayMode === "none"
												? css(styles, "selected")
												: ""
										}
										onClick={() =>
											onChange({ strictMistakeDisplayMode: "none" })
										}
										type="button"
									>
										何もしない
									</button>
								</div>
							</section>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="rank-calculation-mode-setting"
							>
								<div>
									<h4 id="rank-calculation-mode-setting">ランク算出方式</h4>
									<p>
										タイピング中のランク表示に使うスコアの算出方式を選びます。
									</p>
								</div>
								<div
									className={css(styles, "rank-calculation-segmented")}
									role="group"
									aria-label="ランク算出方式"
								>
									<button
										aria-pressed={settings.rankCalculationMode === "projected"}
										className={
											settings.rankCalculationMode === "projected"
												? css(styles, "selected")
												: ""
										}
										onClick={() =>
											onChange({ rankCalculationMode: "projected" })
										}
										type="button"
									>
										予測値（変動方式）
									</button>
									<button
										aria-pressed={settings.rankCalculationMode === "actual"}
										className={
											settings.rankCalculationMode === "actual"
												? css(styles, "selected")
												: ""
										}
										onClick={() => onChange({ rankCalculationMode: "actual" })}
										type="button"
									>
										実値（加点方式）
									</button>
								</div>
							</section>
						</div>
					</section>

					<section
						className={css(styles, "settings-subcategory")}
						aria-labelledby="english-space-settings"
					>
						<h4
							className={css(styles, "settings-subcategory-title")}
							id="english-space-settings"
						>
							英文モード
						</h4>
						<div className={css(styles, "settings-subcategory-list")}>
							<section
								className={css(styles, "settings-row")}
								aria-labelledby="en-space-display-setting"
							>
								<div>
									<h4 id="en-space-display-setting">スペース表示</h4>
									<p>英文モードでスペースを記号として表示する</p>
								</div>
								<div
									className={css(styles, "romaji-preset-segmented")}
									role="group"
									aria-label="スペース表示"
								>
									<button
										aria-pressed={settings.enSpaceDisplay === "glyph"}
										className={
											settings.enSpaceDisplay === "glyph"
												? css(styles, "selected")
												: ""
										}
										onClick={() => onChange({ enSpaceDisplay: "glyph" })}
										type="button"
									>
										␣
									</button>
									<button
										aria-pressed={settings.enSpaceDisplay === "underscore"}
										className={
											settings.enSpaceDisplay === "underscore"
												? css(styles, "selected")
												: ""
										}
										onClick={() => onChange({ enSpaceDisplay: "underscore" })}
										type="button"
									>
										_
									</button>
								</div>
							</section>
						</div>
					</section>
				</div>
			</section>
		</>
	);
}
