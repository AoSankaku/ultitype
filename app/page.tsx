"use client";

import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Crosshair,
  Gauge,
  Keyboard,
  Languages,
  Lock,
  Moon,
  Play,
  RotateCcw,
  Settings,
  Sun,
  Timer,
  Trophy,
  Waves,
  Zap,
} from "lucide-react";
import {
  ClipboardEvent,
  CompositionEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type DirectChallenge,
  directLongChallenges,
  directShortChallenges,
  englishDirectLongChallenges,
  englishDirectShortChallenges,
  englishLongChallenges,
  longChallenges,
} from "@/src/lib/challenges";
import {
  ModeId,
  applyDirectKey,
  calculateMetrics,
  countCorrectAtSamePositions,
  countImeCorrectCharacters,
  formatTimer,
  getRank,
  isImeSubmissionMatch,
  isProductionUnlocked,
  modes,
  shouldAcceptTextInput,
} from "@/src/lib/typing";

const storageKey = "ultitype:v0";
const productionDurations = [300, 600] as const;
const challengeLanguages = [
  { id: "ja", label: "日本語", flagSrc: "/circle-flags/jp.svg" },
  { id: "en", label: "English", flagSrc: "/circle-flags/us.svg" },
] as const;
const modeIcons = {
  "practice-accuracy": Crosshair,
  "practice-flow": Waves,
  "practice-speed": Zap,
  "production-ime-off": Keyboard,
  "production-ime-on": Languages,
} satisfies Record<ModeId, typeof Gauge>;
const ignoredKeys = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "Tab",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

type StoredState = {
  bestPracticeScore: number;
  bestProductionScore: number;
  sessions: StoredSession[];
  settings: AppSettings;
};

type StoredSession = {
  modeId: ModeId;
  challengeLanguage?: ChallengeLanguage;
  score: number;
  rank: string;
  accuracy: number;
  keysPerSecond: number;
  createdAt: string;
};

type ChallengeLanguage = (typeof challengeLanguages)[number]["id"];
type Theme = "dark" | "light";
type AppSettings = {
  showRomajiWordSpaces: boolean;
  idleRetireSeconds: number;
  theme: Theme;
};
type FinishReason = "completed" | "retired";
type Screen = "mode-select" | "typing" | "settings";
type DirectKeyEvent = Pick<globalThis.KeyboardEvent, "key" | "preventDefault">;

type RuntimeStats = {
  keystrokes: number;
  physicalKeystrokes: number;
  characterAttempts: number;
  correctCharacters: number;
  mistakes: number;
  mistakeDebt: number;
  intervals: number[];
  lastKeyAt: number | null;
  lastInputAt: number | null;
  completedPrompts: number;
};

const initialStats: RuntimeStats = {
  keystrokes: 0,
  physicalKeystrokes: 0,
  characterAttempts: 0,
  correctCharacters: 0,
  mistakes: 0,
  mistakeDebt: 0,
  intervals: [],
  lastKeyAt: null,
  lastInputAt: null,
  completedPrompts: 0,
};

const initialSettings: AppSettings = {
  showRomajiWordSpaces: true,
  idleRetireSeconds: 0,
  theme: "dark",
};

const initialStoredState: StoredState = {
  bestPracticeScore: 0,
  bestProductionScore: 0,
  sessions: [],
  settings: initialSettings,
};

export default function Home() {
  const [stored, setStored] = useState<StoredState>(initialStoredState);
  const [modeId, setModeId] = useState<ModeId>("practice-accuracy");
  const [screen, setScreen] = useState<Screen>("mode-select");
  const [challengeLanguage, setChallengeLanguage] = useState<ChallengeLanguage>("ja");
  const [productionDuration, setProductionDuration] =
    useState<(typeof productionDurations)[number]>(300);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<RuntimeStats>(initialStats);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [finishReason, setFinishReason] = useState<FinishReason | null>(null);
  const [imeError, setImeError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const mode = modes.find((item) => item.id === modeId) ?? modes[0];
  const acceptsTextInput = shouldAcceptTextInput(mode);
  const durationSeconds = mode.group === "production" ? productionDuration : mode.durationSeconds;
  const elapsedSeconds = startedAt ? Math.min((now - startedAt) / 1000, durationSeconds) : 0;
  const remainingSeconds = durationSeconds - elapsedSeconds;
  const productionUnlocked = isProductionUnlocked(stored.bestPracticeScore);
  const directChallenges = getDirectChallenges(challengeLanguage, mode.group);
  const currentDirectChallenge =
    directChallenges[challengeIndex % directChallenges.length] ??
    ({
      display: "",
      guide: "",
      input: "",
    } satisfies DirectChallenge);
  const imeChallenges = challengeLanguage === "ja" ? longChallenges : englishLongChallenges;
  const currentImeChallenge = imeChallenges[challengeIndex % imeChallenges.length] ?? "";
  const currentDisplay = mode.requiresIme
    ? currentImeChallenge
    : currentDirectChallenge.display;
  const currentInputTarget = mode.requiresIme
    ? currentImeChallenge
    : currentDirectChallenge.input;
  const currentGuide =
    challengeLanguage === "ja" &&
    !mode.requiresIme &&
    !stored.settings.showRomajiWordSpaces &&
    currentDirectChallenge.guide
      ? removeRomajiVisualSpaces(currentDirectChallenge.guide)
      : currentDirectChallenge.guide;
  const bestPracticeRank = getRank(stored.bestPracticeScore);
  const bestProductionRank = getRank(stored.bestProductionScore);

  const metrics = useMemo(
    () =>
      calculateMetrics({
        elapsedSeconds,
        keystrokes: stats.keystrokes,
        characterAttempts: stats.characterAttempts,
        correctCharacters: stats.correctCharacters,
        mistakes: stats.mistakes,
        intervals: stats.intervals,
        accuracyExponent: mode.accuracyExponent,
        useFlowMultiplier: mode.id === "practice-flow",
      }),
    [elapsedSeconds, mode.accuracyExponent, mode.id, stats],
  );

  const currentRank = getRank(metrics.score);
  const currentCorrect = mode.requiresIme
    ? countImeCorrectCharacters(input, currentDisplay)
    : countCorrectAtSamePositions(input, currentInputTarget);
  const currentAccuracy =
    mode.requiresIme && currentDisplay.length > 0
      ? currentCorrect / currentDisplay.length
      : input.length > 0
        ? currentCorrect / input.length
        : 1;

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      setStored({
        ...initialStoredState,
        ...parsed,
        settings: {
          ...initialSettings,
          ...parsed.settings,
        },
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  }, [stored]);

  useEffect(() => {
    document.documentElement.dataset.theme = stored.settings.theme;
  }, [stored.settings.theme]);

  useEffect(() => {
    if (!startedAt || isFinished) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => window.clearInterval(timer);
  }, [isFinished, startedAt]);

  useEffect(() => {
    if (startedAt && !isFinished && remainingSeconds <= 0) {
      finishSession();
    }
  });

  useEffect(() => {
    const idleRetireMs = stored.settings.idleRetireSeconds * 1000;
    if (!startedAt || isFinished || idleRetireMs <= 0 || isProductionBlocked) {
      return;
    }

    const lastActivityAt = stats.lastInputAt ?? startedAt;
    if (now - lastActivityAt >= idleRetireMs) {
      finishSession("retired");
    }
  });

  useEffect(() => {
    if (screen !== "typing" || acceptsTextInput || isProductionBlocked) {
      return;
    }

    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      handleDirectKeyDown(event);
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  });

  function prepareSession() {
    setStats(initialStats);
    setInput("");
    setChallengeIndex(0);
    setStartedAt(null);
    setNow(Date.now());
    setIsFinished(false);
    setFinishReason(null);
    setImeError("");
    window.requestAnimationFrame(() => {
      if (acceptsTextInput) {
        inputRef.current?.focus();
        return;
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  }

  function beginSession() {
    const timestamp = Date.now();
    setStartedAt(timestamp);
    setNow(timestamp);
    setIsFinished(false);
  }

  function resetSession() {
    setStats(initialStats);
    setInput("");
    setChallengeIndex(0);
    setStartedAt(null);
    setNow(Date.now());
    setIsFinished(false);
    setFinishReason(null);
    setImeError("");
  }

  function finishSession(reason: FinishReason = "completed") {
    if (isFinished) {
      return;
    }

    setIsFinished(true);
    setFinishReason(reason);

    if (reason === "retired") {
      return;
    }

    const session: StoredSession = {
      modeId,
      challengeLanguage,
      score: metrics.score,
      rank: currentRank.label,
      accuracy: metrics.accuracy,
      keysPerSecond: metrics.keysPerSecond,
      createdAt: new Date().toISOString(),
    };

    setStored((previous) => ({
      settings: previous.settings,
      bestPracticeScore:
        mode.group === "practice"
          ? Math.max(previous.bestPracticeScore, metrics.score)
          : previous.bestPracticeScore,
      bestProductionScore:
        mode.group === "production"
          ? Math.max(previous.bestProductionScore, metrics.score)
          : previous.bestProductionScore,
      sessions: [session, ...previous.sessions].slice(0, 8),
    }));
  }

  function selectMode(nextModeId: ModeId) {
    const nextMode = modes.find((item) => item.id === nextModeId);
    if (!nextMode || (nextMode.group === "production" && !productionUnlocked)) {
      return;
    }

    setModeId(nextModeId);
    resetSession();
    setScreen("typing");
  }

  function returnToModeSelect() {
    resetSession();
    setScreen("mode-select");
  }

  function openSettings() {
    resetSession();
    setScreen("settings");
  }

  function changeChallengeLanguage(nextLanguage: ChallengeLanguage) {
    if (challengeLanguage === nextLanguage) {
      return;
    }

    setChallengeLanguage(nextLanguage);
    resetSession();
  }

  function updateSettings(nextSettings: Partial<AppSettings>) {
    setStored((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        ...nextSettings,
      },
    }));
  }

  function recordKey(metricKeystrokes = 1, physicalKeystrokes = 1) {
    const timestamp = Date.now();

    setStats((previous) => ({
      ...previous,
      keystrokes: previous.keystrokes + metricKeystrokes,
      physicalKeystrokes: previous.physicalKeystrokes + physicalKeystrokes,
      intervals:
        previous.lastKeyAt === null
          ? previous.intervals
          : [...previous.intervals, timestamp - previous.lastKeyAt],
      lastKeyAt: timestamp,
      lastInputAt: timestamp,
    }));
  }

  function handleDirectKeyDown(event: DirectKeyEvent) {
    if (acceptsTextInput || isFinished) {
      return;
    }

    if (ignoredKeys.has(event.key)) {
      return;
    }

    if (event.key !== "Backspace" && event.key.length !== 1) {
      return;
    }

    event.preventDefault();

    if (!startedAt) {
      beginSession();
    }

    const result = applyDirectKey({
      state: {
        input,
        mistakeDebt: stats.mistakeDebt,
        characterAttempts: stats.characterAttempts,
        correctCharacters: stats.correctCharacters,
        mistakes: stats.mistakes,
        completedPrompts: stats.completedPrompts,
      },
      key: event.key,
      target: currentInputTarget,
      lockMistakes: mode.lockMistakes,
    });

    recordKey();
    setStats((previous) => ({
      ...previous,
      characterAttempts: result.state.characterAttempts,
      correctCharacters: result.state.correctCharacters,
      mistakes: result.state.mistakes,
      mistakeDebt: result.state.mistakeDebt,
      completedPrompts: result.state.completedPrompts,
      lastKeyAt:
        result.state.completedPrompts > previous.completedPrompts ? null : previous.lastKeyAt,
    }));

    setInput(result.state.input);

    if (result.state.completedPrompts > stats.completedPrompts) {
      setChallengeIndex((previous) => previous + 1);
    }
  }

  function handleImeKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (!acceptsTextInput || isFinished) {
      return;
    }

    if (!ignoredKeys.has(event.key)) {
      if (!startedAt) {
        beginSession();
      }
      recordKey(0, 1);
    }

    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    const matches = isImeSubmissionMatch(input, currentDisplay);

    if (!matches) {
      setImeError("課題文と一致していません。修正してから Enter で提出してください。");
      setStats((previous) => ({ ...previous, mistakes: previous.mistakes + 1 }));
      return;
    }

    const estimatedKeystrokes = estimateImeKeystrokes(currentDisplay);
    setStats((previous) => ({
      ...previous,
      keystrokes: previous.keystrokes + estimatedKeystrokes,
      characterAttempts: previous.characterAttempts + currentDisplay.length,
      correctCharacters: previous.correctCharacters + currentDisplay.length,
      completedPrompts: previous.completedPrompts + 1,
    }));
    setInput("");
    setImeError("");
    setChallengeIndex((previous) => previous + 1);
  }

  function handleImeInput(nextInput: string) {
    if (!acceptsTextInput) {
      return;
    }

    setInput(nextInput);
    if (imeError) {
      setImeError("");
    }
  }

  function preventDirectTextInput(
    event:
      | FormEvent<HTMLTextAreaElement>
      | ClipboardEvent<HTMLTextAreaElement>
      | CompositionEvent<HTMLTextAreaElement>,
  ) {
    if (!acceptsTextInput) {
      event.preventDefault();
    }
  }

  const isProductionBlocked = mode.group === "production" && !productionUnlocked;
  const progress = Math.min(100, (elapsedSeconds / durationSeconds) * 100);
  const correctionDebt = !acceptsTextInput && mode.lockMistakes ? stats.mistakeDebt : 0;

  return (
    <main className="shell">
      <header className="app-header" aria-label="UltiType header">
        <div className="brand-block">
          <h1>UltiType</h1>
          <p>Typing practice and rating</p>
        </div>
        <div className="header-status">
          <div className="rank-strip" aria-label="saved ratings">
            <RankBadge label="仮" rank={bestPracticeRank.label} score={stored.bestPracticeScore} />
            <RankBadge label="本" rank={bestProductionRank.label} score={stored.bestProductionScore} />
          </div>
          <div className="header-actions" aria-label="settings and language">
            <div className="language-switch" aria-label="challenge language">
              {challengeLanguages.map((language) => (
                <button
                  aria-pressed={challengeLanguage === language.id}
                  className={challengeLanguage === language.id ? "selected" : ""}
                  key={language.id}
                  onClick={() => changeChallengeLanguage(language.id)}
                  type="button"
                >
                  <img className="flag-icon" src={language.flagSrc} alt="" aria-hidden="true" />
                  {language.label}
                </button>
              ))}
            </div>
            <button
              className="settings-button"
              onClick={openSettings}
              title="設定"
              type="button"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {screen === "settings" ? (
        <SettingsScreen
          onBack={() => setScreen("mode-select")}
          onChange={updateSettings}
          settings={stored.settings}
        />
      ) : screen === "mode-select" ? (
        <section className="mode-select-screen" aria-label="mode selection">
          <div className="mode-select-heading">
            <div className="panel-heading">
              <Gauge size={18} />
              <span>Modes</span>
            </div>
            <p>練習モードまたは本番モードを選択してください。</p>
          </div>

          <div className="mode-select-group">
            <div className="mode-select-section">
              <div className="mode-select-section-heading">
                <span>Practice</span>
                <small>練習モード</small>
              </div>
              <div className="mode-select-grid practice-modes">
                {modes
                  .filter((item) => item.group === "practice")
                  .map((item) => (
                    <ModeSelectCard
                      key={item.id}
                      locked={false}
                      mode={item}
                      onSelect={() => selectMode(item.id)}
                    />
                  ))}
              </div>
            </div>

            <div className="mode-select-section production-section">
              <div className="mode-select-section-heading">
                <span>Rating</span>
                <small>本番モード</small>
              </div>
              <div className="duration-block mode-select-duration">
                <div className="segmented">
                  {productionDurations.map((duration) => (
                    <button
                      className={productionDuration === duration ? "selected" : ""}
                      key={duration}
                      onClick={() => setProductionDuration(duration)}
                      type="button"
                    >
                      {duration / 60}分
                    </button>
                  ))}
                </div>
              </div>
              <div className="mode-select-grid production-modes">
                {modes
                  .filter((item) => item.group === "production")
                  .map((item) => {
                    const locked = !productionUnlocked;
                    return (
                      <ModeSelectCard
                        key={item.id}
                        locked={locked}
                        mode={item}
                        onSelect={() => selectMode(item.id)}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        </section>
      ) : (
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
            <Metric label="均等率" value={`${(metrics.consistency * 100).toFixed(0)}%`} />
          </div>

          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="session-head">
            <div>
              <p className="mode-label">{mode.label}</p>
              <h2>
                {currentRank.label}
                <span>{Math.round(metrics.score).toLocaleString()} pts</span>
              </h2>
            </div>
            <div className="actions">
              <button className="icon-button" onClick={returnToModeSelect} title="モード選択" type="button">
                <ArrowLeft size={18} />
              </button>
              <button className="icon-button primary" onClick={prepareSession} title="開始" type="button">
                <Play size={18} />
              </button>
              <button className="icon-button" onClick={resetSession} title="リセット" type="button">
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
              <CorrectionDebtIndicator debt={correctionDebt} />

              <div className="target-view" aria-label="current challenge">
                {mode.requiresIme ? (
                  <p>{currentDisplay}</p>
                ) : (
                  renderDirectChallenge(
                    currentDisplay,
                    currentGuide ?? currentInputTarget,
                    currentInputTarget,
                    input,
                  )
                )}
              </div>

              {acceptsTextInput ? (
                <textarea
                  aria-label="typing input"
                  className="typing-input"
                  onChange={(event) => handleImeInput(event.target.value)}
                  onBeforeInput={preventDirectTextInput}
                  onCompositionStart={preventDirectTextInput}
                  onDrop={preventDirectTextInput}
                  onKeyDown={handleImeKeyDown}
                  onPaste={preventDirectTextInput}
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
      )}

      {screen === "typing" ? (
        <section className="lower-grid">
        <div className="analysis-panel">
          <div className="panel-heading">
            <Activity size={18} />
            <span>Live Analysis</span>
          </div>
          <dl>
            <div>
              <dt>現在行の一致率</dt>
              <dd>{(currentAccuracy * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt>平均打鍵間隔</dt>
              <dd>{metrics.paceMs ? `${metrics.paceMs.toFixed(0)} ms` : "--"}</dd>
            </div>
            <div>
              <dt>完了課題</dt>
              <dd>{stats.completedPrompts}</dd>
            </div>
            <div>
              <dt>物理打鍵</dt>
              <dd>{stats.physicalKeystrokes}</dd>
            </div>
          </dl>
        </div>

        <div className="history-panel">
          <div className="panel-heading">
            <Trophy size={18} />
            <span>Recent Sessions</span>
          </div>
          {stored.sessions.length === 0 ? (
            <p className="empty">まだ保存されたセッションはありません。</p>
          ) : (
            <ol>
              {stored.sessions.map((session) => (
                <li key={`${session.createdAt}-${session.modeId}`}>
                  <span>{session.rank}</span>
                  <strong>{Math.round(session.score).toLocaleString()}</strong>
                  <small>{modes.find((item) => item.id === session.modeId)?.label}</small>
                  <em>{session.challengeLanguage === "en" ? "English" : "日本語"}</em>
                </li>
              ))}
            </ol>
          )}
        </div>
        </section>
      ) : null}
    </main>
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

function ModeSelectCard({
  locked,
  mode,
  onSelect,
}: {
  locked: boolean;
  mode: (typeof modes)[number];
  onSelect: () => void;
}) {
  const ModeIcon = modeIcons[mode.id];

  return (
    <button
      className={`mode-select-card ${locked ? "locked" : ""}`}
      disabled={locked}
      onClick={onSelect}
      title={locked ? "仮レーティング A0 以上で解放" : mode.description}
      type="button"
    >
      <span className="mode-icon" aria-hidden="true">
        <ModeIcon size={28} strokeWidth={2.2} />
      </span>
      <span className="mode-code">{mode.shortLabel}</span>
      <strong>{mode.label}</strong>
      <small>{mode.description}</small>
      {locked ? (
        <span className="mode-lock">
          <Lock size={15} />
          A0
        </span>
      ) : null}
    </button>
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

function RankBadge({ label, rank, score }: { label: string; rank: string; score: number }) {
  return (
    <div className="rank-badge">
      <span>{label}</span>
      <strong>{rank}</strong>
      <small>{Math.round(score).toLocaleString()}</small>
    </div>
  );
}

function SettingsScreen({
  settings,
  onBack,
  onChange,
}: {
  settings: AppSettings;
  onBack: () => void;
  onChange: (settings: Partial<AppSettings>) => void;
}) {
  return (
    <section className="settings-screen" aria-label="settings">
      <div className="settings-head">
        <div>
          <div className="panel-heading">
            <Settings size={18} />
            <span>Settings</span>
          </div>
          <h2>設定</h2>
        </div>
        <button className="icon-button" onClick={onBack} title="戻る" type="button">
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="settings-list">
        <section className="settings-row" aria-labelledby="romaji-space-setting">
          <div>
            <h3 id="romaji-space-setting">日本語ローマ字のスペース</h3>
            <p>ローマ字ガイドの単語間スペースを表示する</p>
          </div>
          <label className="toggle-control">
            <input
              checked={settings.showRomajiWordSpaces}
              onChange={(event) =>
                onChange({ showRomajiWordSpaces: event.currentTarget.checked })
              }
              type="checkbox"
            />
            <span aria-hidden="true" />
          </label>
        </section>

        <section className="settings-row" aria-labelledby="idle-retire-setting">
          <div>
            <h3 id="idle-retire-setting">無入力リタイア</h3>
            <p>0 秒で無効</p>
          </div>
          <label className="number-control">
            <input
              min={0}
              max={120}
              onChange={(event) =>
                onChange({
                  idleRetireSeconds: clampInteger(event.currentTarget.value, 0, 120),
                })
              }
              step={1}
              type="number"
              value={settings.idleRetireSeconds}
            />
            <span>秒</span>
          </label>
        </section>

        <section className="settings-row" aria-labelledby="theme-setting">
          <div>
            <h3 id="theme-setting">テーマ</h3>
            <p>表示テーマを切り替える</p>
          </div>
          <div className="theme-segmented" role="group" aria-label="theme">
            <button
              aria-pressed={settings.theme === "dark"}
              className={settings.theme === "dark" ? "selected" : ""}
              onClick={() => onChange({ theme: "dark" })}
              type="button"
            >
              <Moon size={17} />
              Dark
            </button>
            <button
              aria-pressed={settings.theme === "light"}
              className={settings.theme === "light" ? "selected" : ""}
              onClick={() => onChange({ theme: "light" })}
              type="button"
            >
              <Sun size={17} />
              Light
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function renderDirectChallenge(
  display: string,
  guide: string,
  target: string,
  input: string,
) {
  const hasSeparateDisplay = display !== guide;

  return (
    <>
      {hasSeparateDisplay ? <p className="display-text">{display}</p> : null}
      <p className="input-target" aria-label={hasSeparateDisplay ? "romaji input target" : "input target"}>
        {renderGuideCharacters(guide, input)}
      </p>
    </>
  );
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

function removeRomajiVisualSpaces(value: string) {
  return value.replace(/\s/g, "");
}

function clampInteger(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return min;
  }

  return Math.min(max, Math.max(min, parsed));
}

function estimateImeKeystrokes(target: string): number {
  const kanaLike = Array.from(target).filter((character) => !/\s/.test(character)).length;
  return Math.ceil(kanaLike * 1.15);
}

function getDirectChallenges(language: ChallengeLanguage, group: "practice" | "production") {
  if (language === "en") {
    return group === "practice" ? englishDirectShortChallenges : englishDirectLongChallenges;
  }

  return group === "practice" ? directShortChallenges : directLongChallenges;
}
