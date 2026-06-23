import { Suspense } from "react";

import { ModeSelectPage } from "./_components/ModeSelectPage";
import { ModeSelectPageView } from "./_components/ModeSelectPageView";

export default function Home() {
  return (
    <Suspense fallback={<ModeSelectPage />}>
      <ModeSelectPageView />
    </Suspense>
  );
}
