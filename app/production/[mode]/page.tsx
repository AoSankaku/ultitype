import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ModePage } from "../../_components/ModePage";
import { ProductionModePageView } from "../../_components/ProductionModePageView";
import { getRouteModeId, getRouteParams } from "../../_lib/mode-routes";

export function generateStaticParams() {
  return getRouteParams("production");
}

export default async function ProductionModePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  const modeId = getRouteModeId("production", mode);

  if (!modeId) {
    notFound();
  }

  return (
    <Suspense fallback={<ModePage modeId={modeId} />}>
      <ProductionModePageView modeId={modeId} />
    </Suspense>
  );
}
