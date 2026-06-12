import { notFound } from "next/navigation";
import { ModePage } from "../../../_components/ModePage";
import { getRouteModeId, getRouteParams } from "../../../_lib/mode-routes";

export function generateStaticParams() {
  return getRouteParams("practice");
}

export default async function EnglishPracticeModePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  const modeId = getRouteModeId("practice", mode);

  if (!modeId) {
    notFound();
  }

  return <ModePage challengeLanguage="en" modeId={modeId} />;
}
