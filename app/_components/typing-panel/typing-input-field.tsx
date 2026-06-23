"use client";

import type {
  CompositionEvent,
  FormEvent,
  KeyboardEvent,
  PointerEvent,
  RefObject,
} from "react";
import { css } from "../../_lib/css-module";
import styles from "../TypingPanel.module.css";
import type { BlockableTextEvent } from "./types";

type TypingInputFieldProps = {
  acceptsTextInput: boolean;
  challengeLanguage: string;
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isFinished: boolean;
  isProductionImeOn: boolean;
  productionImeInputShellRef: RefObject<HTMLDivElement | null>;
  productionImeInputWidth: number | null;
  startedAt: number | null;
  handleImeCompositionEnd: (event: CompositionEvent<HTMLTextAreaElement>) => void;
  handleImeCompositionStart: (event: CompositionEvent<HTMLTextAreaElement>) => void;
  handleImeInputChange: (event: FormEvent<HTMLTextAreaElement>) => void;
  handleImeInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleProductionImeInputWidthCommit: () => void;
  handleProductionImeResizePointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  handleProductionImeResizePointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  handleProductionImeResizePointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  onPreventDirectTextInput: (event: BlockableTextEvent) => void;
};

export function TypingInputField({
acceptsTextInput,
challengeLanguage,
input,
inputRef,
isFinished,
isProductionImeOn,
productionImeInputShellRef,
productionImeInputWidth,
startedAt,
handleImeCompositionEnd,
handleImeCompositionStart,
handleImeInputChange,
handleImeInputKeyDown,
handleProductionImeInputWidthCommit,
handleProductionImeResizePointerDown,
handleProductionImeResizePointerMove,
handleProductionImeResizePointerUp,
onPreventDirectTextInput,
}: TypingInputFieldProps) {
  if (acceptsTextInput && isProductionImeOn) {
    return (
      <div
        className={css(styles, "production-ime-input-shell")}
        ref={productionImeInputShellRef}
        style={productionImeInputWidth !== null ? { width: `${productionImeInputWidth}px` } : undefined}
      >
        <textarea
          aria-label="typing input"
          className={css(styles, "typing-input", "production-ime-input")}
          data-production-ime-input="true"
          disabled={isFinished}
          onChange={handleImeInputChange}
          onBeforeInput={onPreventDirectTextInput}
          onCompositionEnd={handleImeCompositionEnd}
          onCompositionStart={handleImeCompositionStart}
          onDrop={onPreventDirectTextInput}
          onKeyDown={handleImeInputKeyDown}
          onKeyUp={handleProductionImeInputWidthCommit}
          onPaste={onPreventDirectTextInput}
          placeholder={
            startedAt
              ? challengeLanguage === "ja"
                ? "IMEありで入力し、行が一致したら Enter"
                : "英文を入力し、行が一致したら Enter"
              : "開始ボタン、またはここで入力を始める"
          }
          ref={inputRef}
          rows={3}
          value={input}
        />
        <button
          aria-label="resize typing input"
          className={css(styles, "production-ime-input-resize-handle")}
          onPointerDown={handleProductionImeResizePointerDown}
          onPointerMove={handleProductionImeResizePointerMove}
          onPointerUp={handleProductionImeResizePointerUp}
          onPointerCancel={handleProductionImeResizePointerUp}
          type="button"
        />
      </div>
    );
  }

  return acceptsTextInput ? (
    <textarea
      aria-label="typing input"
      className={css(styles, "typing-input", isProductionImeOn ? "production-ime-input" : "")}
      data-production-ime-input={isProductionImeOn ? "true" : undefined}
      onChange={handleImeInputChange}
      onBeforeInput={onPreventDirectTextInput}
      onCompositionEnd={handleImeCompositionEnd}
      onCompositionStart={handleImeCompositionStart}
      onDrop={onPreventDirectTextInput}
      onKeyDown={handleImeInputKeyDown}
      onKeyUp={isProductionImeOn ? handleProductionImeInputWidthCommit : undefined}
      onPointerUp={isProductionImeOn ? handleProductionImeInputWidthCommit : undefined}
      onBlur={isProductionImeOn ? handleProductionImeInputWidthCommit : undefined}
      onPaste={onPreventDirectTextInput}
      placeholder={
        startedAt
          ? challengeLanguage === "ja"
            ? "IMEありで入力し、行が一致したら Enter"
            : "英文を入力し、行が一致したら Enter"
          : "開始ボタン、またはここで入力を始める"
      }
      ref={inputRef}
      rows={isProductionImeOn ? 3 : undefined}
      style={
        isProductionImeOn && productionImeInputWidth !== null
          ? { width: `${productionImeInputWidth}px` }
          : undefined
      }
      value={input}
    />
  ) : (
    <textarea
      aria-label="direct keyboard capture"
      autoCapitalize="none"
      autoCorrect="off"
      className={css(styles, "direct-input-guard")}
      inputMode="none"
      onBeforeInput={onPreventDirectTextInput}
      onCompositionStart={onPreventDirectTextInput}
      onDrop={onPreventDirectTextInput}
      onPaste={onPreventDirectTextInput}
      readOnly
      ref={inputRef}
      spellCheck={false}
      tabIndex={-1}
      value=""
    />
  );
}
