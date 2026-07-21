import type { ModeId } from "@/src/lib/typing";
import { modeIconNames } from "../../_lib/mode-icons";

export type ResultShareModeIconKind = (typeof modeIconNames)[ModeId];

export function getResultShareModeIconKind(modeId: ModeId): ResultShareModeIconKind {
  return modeIconNames[modeId];
}

export function paintResultShareModeIcon(
  context: CanvasRenderingContext2D,
  modeId: ModeId,
  x: number,
  y: number,
  size: number,
) {
  const kind = getResultShareModeIconKind(modeId);
  const color = modeId.startsWith("practice-") ? "#d7ff5f" : "#56d6a4";
  const iconSize = size * 0.58;
  const iconOffset = (size - iconSize) / 2;
  const scale = iconSize / 24;

  context.save();
  context.translate(x, y);
  context.fillStyle = "#0d0c0a";
  context.fillRect(0, 0, size, size);
  context.strokeStyle = "#39362c";
  context.lineWidth = 2;
  context.strokeRect(0, 0, size, size);

  context.translate(iconOffset, iconOffset);
  context.scale(scale, scale);
  context.strokeStyle = color;
  context.fillStyle = "transparent";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 2.2;

  switch (kind) {
    case "crosshair":
      paintCrosshair(context);
      break;
    case "waves":
      paintWaves(context);
      break;
    case "zap":
      strokeSvgPath(
        context,
        "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
      );
      break;
    case "keyboard":
      paintKeyboard(context);
      break;
    case "languages":
      paintLanguages(context);
      break;
  }

  context.restore();
}

function paintCrosshair(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.arc(12, 12, 10, 0, Math.PI * 2);
  context.stroke();
  strokeLine(context, 22, 12, 18, 12);
  strokeLine(context, 6, 12, 2, 12);
  strokeLine(context, 12, 6, 12, 2);
  strokeLine(context, 12, 22, 12, 18);
}

function paintWaves(context: CanvasRenderingContext2D) {
  strokeSvgPath(context, "M2 12q2.5 2 5 0t5 0 5 0 5 0");
  strokeSvgPath(context, "M2 19q2.5 2 5 0t5 0 5 0 5 0");
  strokeSvgPath(context, "M2 5q2.5 2 5 0t5 0 5 0 5 0");
}

function paintKeyboard(context: CanvasRenderingContext2D) {
  for (const path of [
    "M10 8h.01",
    "M12 12h.01",
    "M14 8h.01",
    "M16 12h.01",
    "M18 8h.01",
    "M6 8h.01",
    "M7 16h10",
    "M8 12h.01",
  ]) {
    strokeSvgPath(context, path);
  }
  context.beginPath();
  context.roundRect(2, 4, 20, 16, 2);
  context.stroke();
}

function paintLanguages(context: CanvasRenderingContext2D) {
  for (const path of [
    "m5 8 6 6",
    "m4 14 6-6 2-3",
    "M2 5h12",
    "M7 2h1",
    "m22 22-5-10-5 10",
    "M14 18h6",
  ]) {
    strokeSvgPath(context, path);
  }
}

function strokeSvgPath(context: CanvasRenderingContext2D, path: string) {
  context.stroke(new Path2D(path));
}

function strokeLine(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}
