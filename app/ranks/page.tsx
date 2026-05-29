"use client";

import { ArrowLeft, Star } from "lucide-react";
import { AppShell } from "../_components/AppShell";
import { RankGuide } from "../_components/RankGuide";
import { SelectSoundLink } from "../_components/SelectSoundLink";

export default function RanksPage() {
  return (
    <AppShell className="shell rank-guide-page">
      {() => (
        <>
          <header className="rank-guide-page-head">
            <div>
              <div className="panel-heading">
                <Star size={18} fill="currentColor" />
                <span>Rank Guide</span>
              </div>
              <h1>ランクガイド</h1>
              <p>
                500点未満はランクなし、500点から G0 が始まり、基準スコアはランクごとに90点ずつ上がります。
              </p>
            </div>
            <SelectSoundLink
              className="icon-link"
              href="/"
              aria-label="戻る"
              soundKind="back"
              title="戻る"
            >
              <ArrowLeft size={20} />
            </SelectSoundLink>
          </header>
          <RankGuide />
        </>
      )}
    </AppShell>
  );
}
