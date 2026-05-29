import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";
import type {
  ClipboardEvent,
  CompositionEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  ReactNode,
  RefObject,
} from "react";
import {
  formatTimer,
  getRomajiInputProgress,
  type Metrics,
  type Rank,
  type RomajiInputTarget,
  type TypingMode,
} from "@/src/lib/typing";
import { getVisibleSessionRank } from "../_lib/session-rank-visibility";
import type { ChallengeLanguage, FinishReason, RuntimeStats } from "../_lib/types";

type BlockableTextEvent =
  | FormEvent<HTMLTextAreaElement>
  | ClipboardEvent<HTMLTextAreaElement>
  | CompositionEvent<HTMLTextAreaElement>
  | DragEvent<HTMLTextAreaElement>;

type TypingPanelProps = {
  acceptsTextInput: boolean;
  challengeLanguage: ChallengeLanguage;
  correctionDebt: number;
  currentDisplay: string;
  currentGuide: string;
  currentRomajiTarget: RomajiInputTarget | null;
  currentRank: Rank;
  elapsedSeconds: number | null;
  finishReason: FinishReason | null;
  imeError: string;
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isFinished: boolean;
  isProductionBlocked: boolean;
  metrics: Metrics;
  mode: TypingMode;
  progress: number;
  remainingSeconds: number;
  startedAt: number | null;
  stats: RuntimeStats;
  onBackToModeSelect: () => void;
  onImeInput: (input: string) => void;
  onImeKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPrepareSession: () => void;
  onPreventDirectTextInput: (event: BlockableTextEvent) => void;
  onResetSession: () => void;
};

export function TypingPanel({
  acceptsTextInput,
  challengeLanguage,
  correctionDebt,
  currentDisplay,
  currentGuide,
  currentRomajiTarget,
  currentRank,
  elapsedSeconds,
  finishReason,
  imeError,
  input,
  inputRef,
  isFinished,
  isProductionBlocked,
  metrics,
  mode,
  progress,
  remainingSeconds,
  startedAt,
  stats,
  onBackToModeSelect,
  onImeInput,
  onImeKeyDown,
  onPrepareSession,
  onPreventDirectTextInput,
  onResetSession,
}: TypingPanelProps) {
  const visibleRank = getVisibleSessionRank({
    elapsedSeconds,
    rankLabel: currentRank.label,
  });

  return (
    <section
      className={`practice-panel ${acceptsTextInput ? "ime-panel" : "direct-panel"}`}
      aria-label="typing practice"
    >
      <div className="meter-row">
        <Metric label="残り" value={formatTimer(remainingSeconds)} icon={<Timer size={17} />} />
        <Metric label="打鍵/秒" value={metrics.keysPerSecond.toFixed(2)} />
        <Metric label="WPM" value={metrics.wpm.toFixed(1)} />
        <Metric label="正確率" value={`${(metrics.accuracy * 100).toFixed(1)}%`} />
        <Metric label="ミス" value={stats.mistakes.toString()} />
        <Metric label="安定度" value={`${(metrics.consistency * 100).toFixed(0)}%`} />
      </div>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="session-head">
        <div>
          <p className="mode-label">{mode.label}</p>
          <h2>
            <span
              aria-label={visibleRank.isConcealed ? "Rank hidden for the first 30 seconds" : undefined}
              className={`session-rank-value ${visibleRank.isConcealed ? "concealed" : ""}`}
            >
              {visibleRank.label}
            </span>
            <span>{Math.round(metrics.score).toLocaleString()} pts</span>
          </h2>
        </div>
        <div className="actions">
          <button
            className="icon-button"
            onClick={onBackToModeSelect}
            title="モード選択"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="icon-button primary"
            onClick={onPrepareSession}
            title="開始"
            type="button"
          >
            <Play size={18} />
          </button>
          <button
            className="icon-button"
            onClick={onResetSession}
            title="リセット"
            type="button"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {isProductionBlocked ? (
        <div className="locked-panel">
          <Lock size={28} />
          <p>本番モードは仮レーティング A0 以上で解放されます。</p>
        </div>
      ) : (
        <>
          <div className="target-view" aria-label="current challenge">
            {mode.requiresIme ? (
              <p>{currentDisplay}</p>
            ) : (
              <DirectChallengeView
                display={currentDisplay}
                guide={currentGuide}
                input={input}
                romajiTarget={currentRomajiTarget}
              />
            )}
          </div>

          <CorrectionDebtIndicator debt={correctionDebt} />

          {acceptsTextInput ? (
            <textarea
              aria-label="typing input"
              className="typing-input"
              onChange={(event) => onImeInput(event.target.value)}
              onBeforeInput={onPreventDirectTextInput}
              onCompositionStart={onPreventDirectTextInput}
              onDrop={onPreventDirectTextInput}
              onKeyDown={onImeKeyDown}
              onPaste={onPreventDirectTextInput}
              placeholder={
                startedAt
                  ? challengeLanguage === "ja"
                    ? "IMEありで入力し、行が一致したら Enter"
                    : "英文を入力し、行が一致したら Enter"
                  : "開始ボタン、またはここで入力を始める"
              }
              ref={inputRef}
              value={input}
            />
          ) : null}
          {imeError ? <p className="error-line">{imeError}</p> : null}
        </>
      )}

      {isFinished ? (
        <div className={`result-band ${finishReason === "retired" ? "retired" : ""}`}>
          <CheckCircle2 size={20} />
          <span>
            {finishReason === "retired"
              ? "無入力が続いたためリタイアしました"
              : `セッション終了: ${currentRank.label} / ${Math.round(metrics.score).toLocaleString()} pts`}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function CorrectionDebtIndicator({ debt }: { debt: number }) {
  if (debt <= 0) {
    return null;
  }

  const visibleDots = Math.min(debt, 12);

  return (
    <div aria-live="polite" className="correction-debt" role="status">
      <span className="keycap">Backspace</span>
      <span className="debt-count">あと {debt} 回</span>
      <span className="debt-dots" aria-hidden="true">
        {Array.from({ length: visibleDots }, (_, index) => (
          <span key={index} />
        ))}
        {debt > visibleDots ? <em>+{debt - visibleDots}</em> : null}
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="metric">
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function DirectChallengeView({
  display,
  guide,
  input,
  romajiTarget,
}: {
  display: string;
  guide: string;
  input: string;
  romajiTarget: RomajiInputTarget | null;
}) {
  const hasSeparateDisplay = display !== guide;

  return (
    <>
      {hasSeparateDisplay ? <p className="display-text">{display}</p> : null}
      <p
        className="input-target"
        aria-label={hasSeparateDisplay ? "romaji input target" : "input target"}
      >
        {romajiTarget ? renderRomajiGuideCharacters(romajiTarget, input) : renderGuideCharacters(guide, input)}
      </p>
    </>
  );
}

function renderRomajiGuideCharacters(target: RomajiInputTarget, input: string) {
  const progress = getRomajiInputProgress(target, input);

  return target.parts.map((part, partIndex) => {
    if (part.kind === "visual") {
      return (
        <span className="visual-space" key={`space-${partIndex}`} aria-hidden="true">
          {part.text}
        </span>
      );
    }

    const text =
      progress.currentTokenIndex === part.tokenIndex && progress.currentOption
        ? progress.currentOption
        : (progress.selectedOptions[part.tokenIndex] ?? part.text);

    return Array.from(text).map((character, characterIndex) => {
      const isCompletedToken = part.tokenIndex < progress.completedTokens;
      const isCurrentToken = part.tokenIndex === progress.currentTokenIndex;
      const isTypedCurrentCharacter =
        isCurrentToken &&
        progress.currentOption !== null &&
        characterIndex < progress.currentOptionOffset;
      const className = isCompletedToken
        ? "char correct"
        : isCurrentToken
          ? isTypedCurrentCharacter
            ? "char correct current"
            : "char current"
          : "char";

      return (
        <span className={className} key={`${part.tokenIndex}-${character}-${characterIndex}`}>
          {character}
        </span>
      );
    });
  });
}

function renderGuideCharacters(guide: string, input: string) {
  let targetIndex = 0;

  return Array.from(guide).map((character, index) => {
    if (/\s/.test(character)) {
      return (
        <span className="visual-space" key={`space-${index}`} aria-hidden="true">
          {character}
        </span>
      );
    }

    const typed = input[targetIndex];
    const currentIndex = targetIndex;
    targetIndex += 1;

    const className =
      typed === undefined
        ? currentIndex === input.length
          ? "char current"
          : "char"
        : typed === character
          ? "char correct"
          : "char wrong";

    return (
      <span className={className} key={`${character}-${index}`}>
        {character}
      </span>
    );
  });
}
