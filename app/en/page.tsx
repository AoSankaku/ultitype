import { Suspense } from "react";
import { ModeSelectPage } from "../_components/ModeSelectPage";
import { ModeSelectPageView } from "../_components/ModeSelectPageView";

export default function EnglishHome() {
  return (
    <Suspense fallback={<ModeSelectPage challengeLanguage="en" />}>
      <ModeSelectPageView challengeLanguage="en" />
    </Suspense>
  );
}
