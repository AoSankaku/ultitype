"use client";

import { Copy, Share2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Metrics, TypingMode } from "@/src/lib/typing";
import { drawRankBadge } from "../../_lib/rank-badge";
import type { ChallengeLanguage, RuntimeStats } from "../../_lib/types";
import { css } from "../../_lib/css-module";
import styles from "../TypingPanel.module.css";
import { paintResultShareModeIcon } from "./result-share-mode-icon";

const imageWidth = 1200;
const imageHeight = 630;

export type ShareResult = {
  accuracy: number;
  correctCharacters: number;
  finishedAt: number;
  keysPerSecond: number;
  language: ChallengeLanguage;
  mode: TypingMode;
  rank: string;
  score: number;
};

export function ResultShareCard({
  challengeLanguage,
  finishedAt,
  metrics,
  mode,
  rank,
  stats,
}: {
  challengeLanguage: ChallengeLanguage;
  finishedAt: number;
  metrics: Metrics;
  mode: TypingMode;
  rank: string;
  stats: RuntimeStats;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageBlobRef = useRef<Blob | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const result: ShareResult = {
    accuracy: metrics.accuracy,
    correctCharacters: stats.correctCharacters,
    finishedAt,
    keysPerSecond: metrics.keysPerSecond,
    language: challengeLanguage,
    mode,
    rank,
    score: metrics.score,
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    paintShareResult(context, result);
    imageBlobRef.current = null;
    canvas.toBlob((blob) => {
      imageBlobRef.current = blob;
    }, "image/png");
  }, [challengeLanguage, finishedAt, metrics, mode, rank, stats.correctCharacters]);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const shareTargets = getResultShareTargets(result, pageUrl);

  async function handleNativeShare() {
    const blob = imageBlobRef.current ?? (await getCanvasBlob(canvasRef.current));
    if (!blob) {
      setShareStatus("画像を準備できませんでした。もう一度お試しください。");
      return;
    }

    const file = new File([blob], getResultImageFilename(result), { type: "image/png" });
    const shareData = {
      files: [file],
      text: getShareTextWithUrl(result, pageUrl),
      title: "ULTITYPE RESULT",
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share(shareData);
        setShareStatus("共有メニューにリザルト画像を送りました。");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setShareStatus("共有を完了できませんでした。画像保存をお試しください。");
      }
      return;
    }

    downloadBlob(blob, file.name);
    await copyShareText(result, pageUrl);
    setShareStatus("Share APIが使えないため、画像を保存して投稿文をコピーしました。");
  }

  async function handleComposerShare(serviceName: string) {
    const blob = imageBlobRef.current ?? (await getCanvasBlob(canvasRef.current));
    if (!blob) {
      setShareStatus(`${serviceName}を開きます。画像はPNG保存から添付してください。`);
      return;
    }

    const copied = await prepareImageForComposer(blob, getResultImageFilename(result));
    setShareStatus(
      copied
        ? `${serviceName}を開きました。投稿画面にリザルト画像を貼り付けてください。`
        : `${serviceName}を開き、リザルト画像を保存しました。投稿画面で添付してください。`,
    );
  }

  async function handleCopy() {
    const copied = await copyShareText(result, pageUrl);
    setShareStatus(
      copied ? "投稿テンプレートをコピーしました。" : "投稿テンプレートをコピーできませんでした。",
    );
  }

  return (
    <section className={css(styles, "result-share")} aria-label="SNS share result">
      <div className={css(styles, "result-share-heading")}>
        <div>
          <span>Share Result</span>
          <strong>SNS用リザルト画像</strong>
        </div>
        <small>1200 × 630 PNG</small>
      </div>

      <div className={css(styles, "result-share-canvas-shell")}>
        <canvas
          aria-label={`${mode.label}のリザルト画像。ランク${rank}、${Math.round(metrics.score).toLocaleString()}ポイント`}
          className={css(styles, "result-share-canvas")}
          height={imageHeight}
          ref={canvasRef}
          role="img"
          width={imageWidth}
        />
      </div>

      <div className={css(styles, "result-share-actions")}>
        <a
          className={css(styles, "share-action misskey")}
          href={shareTargets.misskey}
          onClick={() => void handleComposerShare("Misskey")}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className={css(styles, "share-service-mark")}>Mi</span>
          Misskey
        </a>
        <a
          className={css(styles, "share-action mastodon")}
          href={shareTargets.mastodon}
          onClick={() => void handleComposerShare("Mastodon")}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className={css(styles, "share-service-mark")}>M</span>
          Mastodon
        </a>
        <a
          className={css(styles, "share-action x")}
          href={shareTargets.x}
          onClick={() => void handleComposerShare("X")}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className={css(styles, "share-service-mark")}>X</span>
          X (Twitter)
        </a>
        <button className={css(styles, "share-action primary")} onClick={handleNativeShare} type="button">
          <Share2 size={17} aria-hidden="true" />
          Share API
        </button>
        <button className={css(styles, "share-action")} onClick={handleCopy} type="button">
          <Copy size={17} aria-hidden="true" />
          文言をコピー
        </button>
      </div>

      <p className={css(styles, "result-share-help")}>
        各SNSの投稿画面にはテンプレート文を入力済みです。画像は貼り付け、未対応ブラウザでは保存して添付できます。
      </p>

      <p aria-live="polite" className={css(styles, "result-share-status")} role="status">
        {shareStatus}
      </p>
    </section>
  );
}

export function getResultShareText(result: ShareResult) {
  return [
    `ULTITYPE「${result.mode.label}」に挑戦しました！`,
    `🏆 Rank ${result.rank}｜${Math.round(result.score).toLocaleString("ja-JP")} pts`,
    `🎯 正確率 ${(result.accuracy * 100).toFixed(1)}%`,
    `⌨️ ${result.keysPerSecond.toFixed(2)} 打鍵/秒｜${Math.round(result.keysPerSecond * 60).toLocaleString("ja-JP")} 打鍵/分`,
    "#ULTITYPE #タイピング",
  ].join("\n");
}

export function getResultShareTargets(result: ShareResult, pageUrl: string) {
  const text = getResultShareText(result);
  const misskey = new URL("https://misskey-hub.net/ja/share");
  misskey.searchParams.set("text", text);
  misskey.searchParams.set("url", pageUrl);
  misskey.searchParams.set("visibility", "public");
  misskey.searchParams.set("localOnly", "0");

  const mastodon = new URL("https://mastodonshare.com/share");
  mastodon.searchParams.set("text", text);
  mastodon.searchParams.set("url", pageUrl);

  const x = new URL("https://twitter.com/intent/tweet");
  x.searchParams.set("text", text);
  x.searchParams.set("url", pageUrl);

  return {
    mastodon: mastodon.toString(),
    misskey: misskey.toString(),
    x: x.toString(),
  };
}

export function getResultImageFilename(result: ShareResult) {
  const date = new Date(result.finishedAt);
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ];
  return `ultitype-result-${result.mode.id}-${parts.slice(0, 3).join("")}-${parts.slice(3).join("")}.png`;
}

export function formatResultDate(finishedAt: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(finishedAt));
}

export function getResultScoreFontSize(measuredWidth: number, maxWidth = 186) {
  const baseSize = 48;
  const minimumSize = 30;
  if (measuredWidth <= maxWidth || measuredWidth <= 0) {
    return baseSize;
  }

  return Math.max(minimumSize, Math.floor((baseSize * maxWidth) / measuredWidth));
}

export function getResultCardMetrics(result: ShareResult) {
  return [
    { label: "ACCURACY", value: `${(result.accuracy * 100).toFixed(1)}%` },
    { label: "KEYS / SEC", value: result.keysPerSecond.toFixed(2) },
    { label: "CORRECT CHARS", value: result.correctCharacters.toLocaleString("ja-JP") },
  ];
}

function paintShareResult(context: CanvasRenderingContext2D, result: ShareResult) {
  context.clearRect(0, 0, imageWidth, imageHeight);
  context.fillStyle = "#11100d";
  context.fillRect(0, 0, imageWidth, imageHeight);
  paintGrid(context);

  const accentGradient = context.createLinearGradient(0, 0, imageWidth, 0);
  accentGradient.addColorStop(0, "#d7ff5f");
  accentGradient.addColorStop(0.54, "#56d6a4");
  accentGradient.addColorStop(1, "#f6c85f");
  context.fillStyle = accentGradient;
  context.fillRect(0, 0, imageWidth, 12);

  context.fillStyle = "#d7ff5f";
  context.font = '700 26px "Quantico", "Noto Sans JP", sans-serif';
  context.fillText("ULTITYPE", 72, 76);
  context.fillStyle = "#aaa394";
  context.font = '700 17px "Inter", "Noto Sans JP", sans-serif';
  context.fillText("RESULT REPORT", 72, 108);

  context.textAlign = "right";
  context.fillStyle = "#aaa394";
  context.font = '700 19px "Inter", "Noto Sans JP", sans-serif';
  context.fillText(formatResultDate(result.finishedAt), 1128, 78);
  context.fillStyle = "#746d5f";
  context.font = '700 15px "Inter", "Noto Sans JP", sans-serif';
  context.fillText(`${result.mode.group.toUpperCase()} / ${result.language.toUpperCase()}`, 1128, 108);
  context.textAlign = "left";

  context.fillStyle = "#191814";
  context.fillRect(72, 146, 1056, 150);
  context.strokeStyle = "#39362c";
  context.lineWidth = 2;
  context.strokeRect(72, 146, 1056, 150);

  paintResultShareModeIcon(context, result.mode.id, 104, 174, 96);
  context.fillStyle = "#aaa394";
  context.font = '700 17px "Inter", "Noto Sans JP", sans-serif';
  context.fillText("CHALLENGE", 224, 194);
  context.fillStyle = "#f2efe4";
  context.font = '900 42px "Noto Sans JP", "Inter", sans-serif';
  context.fillText(result.mode.label, 224, 249);

  paintRankBadge(context, result.rank, 732, 168, 164, 106);
  context.fillStyle = "#aaa394";
  context.font = '700 16px "Inter", "Noto Sans JP", sans-serif';
  context.fillText("SCORE", 930, 190);
  const scoreText = Math.round(result.score).toLocaleString("ja-JP");
  context.fillStyle = "#f2efe4";
  context.font = '900 48px "Quantico", "Inter", sans-serif';
  const scoreFontSize = getResultScoreFontSize(context.measureText(scoreText).width);
  context.font = `900 ${scoreFontSize}px "Quantico", "Inter", sans-serif`;
  context.fillText(scoreText, 930, 241);
  context.fillStyle = "#aaa394";
  context.font = '700 16px "Inter", sans-serif';
  context.fillText("PTS", 930, 270);

  const metrics = getResultCardMetrics(result);
  metrics.forEach((metric, index) => {
    const x = 72 + index * 360;
    context.fillStyle = "#151410";
    context.fillRect(x, 320, 336, 154);
    context.strokeStyle = "#39362c";
    context.strokeRect(x, 320, 336, 154);
    context.fillStyle = index === 0 ? "#d7ff5f" : index === 1 ? "#56d6a4" : "#f6c85f";
    context.fillRect(x, 320, 6, 154);
    context.fillStyle = "#aaa394";
    context.font = '700 16px "Inter", sans-serif';
    context.fillText(metric.label, x + 30, 362);
    context.fillStyle = "#f2efe4";
    context.font = '900 50px "Quantico", "Inter", sans-serif';
    context.fillText(metric.value, x + 30, 428);
  });

  context.fillStyle = "#746d5f";
  context.font = '700 16px "Inter", "Noto Sans JP", sans-serif';
  context.fillText("速さだけじゃない。精度と安定性まで、次の一打へ。", 72, 548);
  context.textAlign = "right";
  context.fillStyle = "#d7ff5f";
  context.fillText("ultitype", 1128, 548);
  context.fillStyle = "#39362c";
  context.fillRect(72, 580, 1056, 2);
  context.textAlign = "left";
}

function paintGrid(context: CanvasRenderingContext2D) {
  context.strokeStyle = "rgba(255, 255, 255, 0.035)";
  context.lineWidth = 1;
  for (let x = 0; x <= imageWidth; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, imageHeight);
    context.stroke();
  }
  for (let y = 0; y <= imageHeight; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(imageWidth, y);
    context.stroke();
  }
}

function paintRankBadge(
  context: CanvasRenderingContext2D,
  rank: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const badgeCanvas = document.createElement("canvas");
  badgeCanvas.width = width;
  badgeCanvas.height = height;
  const badgeContext = badgeCanvas.getContext("2d");
  if (!badgeContext) {
    return;
  }
  drawRankBadge(badgeContext, rank, width, height);
  context.drawImage(badgeCanvas, x, y, width, height);
}

function getCanvasBlob(canvas: HTMLCanvasElement | null) {
  return new Promise<Blob | null>((resolve) => canvas?.toBlob(resolve, "image/png") ?? resolve(null));
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function getShareTextWithUrl(result: ShareResult, pageUrl: string) {
  return pageUrl ? `${getResultShareText(result)}\n${pageUrl}` : getResultShareText(result);
}

async function prepareImageForComposer(blob: Blob, filename: string) {
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return true;
    } catch {
      // Fall through to a local download when image clipboard access is unavailable.
    }
  }

  downloadBlob(blob, filename);
  return false;
}

async function copyShareText(result: ShareResult, pageUrl: string) {
  if (!navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(getShareTextWithUrl(result, pageUrl));
    return true;
  } catch {
    return false;
  }
}
