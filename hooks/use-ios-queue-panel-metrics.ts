import { useMemo } from "react";
import { iosUniformQueuePanelScale } from "@/components/embed/ios-uniform-scale-shell";

export function useIosQueuePanelMetrics(
  locked: boolean,
  frame: { width: number; height: number } | null | undefined,
) {
  const scale = useMemo(
    () =>
      locked && frame
        ? iosUniformQueuePanelScale(frame.width)
        : 1,
    [locked, frame],
  );

  const designViewportHeightPx = useMemo(
    () => (locked && frame ? frame.height / scale : 0),
    [locked, frame, scale],
  );

  return { scale, designViewportHeightPx };
}
