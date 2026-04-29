"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

const DESIGN_WIDTH_PX = 320;
const VIEWPORT_PAD_PX = 16;
const MIN_SCALE = 0.34;

/** 플레이어·대기열이 공유하는 iOS 임베드 디자인 폭(px) */
export const IOS_UNIFORM_DESIGN_WIDTH_PX = DESIGN_WIDTH_PX;
export const IOS_UNIFORM_MIN_SCALE = MIN_SCALE;

/**
 * 플레이어 `IosUniformScaleShell` 외곽 너비에 맞춰 목록만 한 번 더 축소.
 * 긴 재생 목록은 디자인 좌표 안에서 스크롤하므로 높이로 스케일하지 않음.
 */
export function iosUniformQueuePanelScale(panelWidthPx: number): number {
  const w = Math.max(1, panelWidthPx);
  return Math.max(MIN_SCALE, Math.min(1, w / DESIGN_WIDTH_PX));
}

type IosUniformScaleShellProps = {
  /** 레이아웃이 바뀔 때마다 달라지는 문자열 하나(부모에서 useMemo로 생성) */
  layoutKey: string;
  children: ReactNode;
  /** 스케일 적용 후 실제 표시 박스 — 재생 대기열 높이 맞춤용 */
  outerBoxRef?: RefObject<HTMLDivElement | null>;
  /**
   * 있으면 `getBoundingClientRect`로 가용 너비·높이를 잡음.
   * iframe·플렉스 분할에서 `window`보다 실제 들어갈 영역에 맞춰 스케일됨.
   */
  boundsRef?: RefObject<Element | null>;
};

/**
 * 뷰포트에 맞춰 자식 블록(고정 320px 디자인)을 통째로 scale.
 * effect 의존성은 항상 [layoutKey] 한 칸만 사용해 Fast Refresh 시 배열 길이 변화 경고를 피함.
 */
export function IosUniformScaleShell({
  layoutKey,
  children,
  outerBoxRef,
  boundsRef,
}: IosUniformScaleShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const boundsRefLatest = useRef(boundsRef);
  boundsRefLatest.current = boundsRef;
  const [scale, setScale] = useState(1);
  const [boxHeight, setBoxHeight] = useState(0);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const update = () => {
      const contentH = shell.offsetHeight;
      const contentW = DESIGN_WIDTH_PX;
      const boundsEl = boundsRefLatest.current?.current ?? null;
      let availW: number;
      let availH: number;
      if (boundsEl) {
        const r = boundsEl.getBoundingClientRect();
        availW = Math.max(1, r.width - VIEWPORT_PAD_PX * 2);
        availH = Math.max(1, r.height - VIEWPORT_PAD_PX * 2);
      } else {
        const vv = window.visualViewport;
        availW = Math.max(
          1,
          (vv?.width ?? window.innerWidth) - VIEWPORT_PAD_PX * 2,
        );
        availH = Math.max(
          1,
          (vv?.height ?? window.innerHeight) - VIEWPORT_PAD_PX * 2,
        );
      }
      const s = Math.min(1, availW / contentW, availH / Math.max(1, contentH));
      const next = Math.max(MIN_SCALE, s);
      setScale(next);
      setBoxHeight(contentH * next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(shell);
    const boundsEl = boundsRefLatest.current?.current ?? null;
    if (boundsEl) ro.observe(boundsEl);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [layoutKey]);

  return (
    <div
      ref={outerBoxRef}
      className="shrink-0 overflow-hidden"
      style={{
        width: DESIGN_WIDTH_PX * scale,
        height: Math.max(boxHeight, 1),
      }}
    >
      <div
        ref={shellRef}
        className="w-[320px] origin-top-left will-change-transform"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
