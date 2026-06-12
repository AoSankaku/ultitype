import { notFound } from "next/navigation";
import { ModePage } from "../../../_components/ModePage";
import { getRouteModeId, getRouteParams } from "../../../_lib/mode-routes";

export function generateStaticParams() {
  return getRouteParams("production");
}

export default async function EnglishProductionModePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  const modeId = getRouteModeId("production", mode);

  if (!modeId) {
    notFound();
  }

  return <ModePage challengeLanguage="en" modeId={modeId} />;
}
