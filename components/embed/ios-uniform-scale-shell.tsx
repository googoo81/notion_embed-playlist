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

type IosUniformScaleShellProps = {
  /** 레이아웃이 바뀔 때마다 달라지는 문자열 하나(부모에서 useMemo로 생성) */
  layoutKey: string;
  children: ReactNode;
  /** 스케일 적용 후 실제 표시 박스 — 재생 대기열 높이 맞춤용 */
  outerBoxRef?: RefObject<HTMLDivElement | null>;
};

/**
 * 뷰포트에 맞춰 자식 블록(고정 320px 디자인)을 통째로 scale.
 * effect 의존성은 항상 [layoutKey] 한 칸만 사용해 Fast Refresh 시 배열 길이 변화 경고를 피함.
 */
export function IosUniformScaleShell({
  layoutKey,
  children,
  outerBoxRef,
}: IosUniformScaleShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [boxHeight, setBoxHeight] = useState(0);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const update = () => {
      const contentH = shell.offsetHeight;
      const contentW = DESIGN_WIDTH_PX;
      const vv = window.visualViewport;
      const availW = Math.max(
        1,
        (vv?.width ?? window.innerWidth) - VIEWPORT_PAD_PX * 2,
      );
      const availH = Math.max(
        1,
        (vv?.height ?? window.innerHeight) - VIEWPORT_PAD_PX * 2,
      );
      const s = Math.min(1, availW / contentW, availH / Math.max(1, contentH));
      const next = Math.max(MIN_SCALE, s);
      setScale(next);
      setBoxHeight(contentH * next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(shell);
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
