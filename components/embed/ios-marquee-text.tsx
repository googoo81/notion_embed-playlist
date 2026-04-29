"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const GAP_PX = 32;
const PX_PER_SEC = 42;

export function IosMarqueeText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [duration, setDuration] = useState(12);
  const [shiftPx, setShiftPx] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const outer = outerRef.current;
    const measure = measureRef.current;
    if (!outer || !measure) return;

    const update = () => {
      const ow = outer.clientWidth;
      const tw = measure.scrollWidth;
      const over = tw > ow + 1;
      setOverflow(over);
      if (over) {
        const step = tw + GAP_PX;
        setShiftPx(step);
        setDuration(Math.max(5, Math.min(50, step / PX_PER_SEC)));
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(measure);

    const onFonts = () => update();
    void document.fonts.ready.then(onFonts);

    return () => ro.disconnect();
  }, [text, reduceMotion]);

  const showMarquee = overflow && !reduceMotion;

  useLayoutEffect(() => {
    if (!showMarquee || shiftPx <= 0) return;
    const el = trackRef.current;
    if (!el) return;

    const anim = el.animate(
      [
        { transform: "translateX(0)" },
        { transform: `translateX(-${shiftPx}px)` },
      ],
      {
        duration: Math.round(duration * 1000),
        iterations: Number.POSITIVE_INFINITY,
        easing: "linear",
      },
    );

    return () => {
      anim.cancel();
    };
  }, [showMarquee, shiftPx, duration, text]);

  const measureClass =
    `pointer-events-none absolute left-0 top-0 -z-10 w-max max-w-none whitespace-nowrap opacity-0 ${className}`.trim();

  return (
    <div
      ref={outerRef}
      className="relative w-full min-w-0 overflow-hidden text-left"
    >
      <span ref={measureRef} className={measureClass} aria-hidden>
        {text}
      </span>
      {showMarquee ? (
        <div ref={trackRef} className="flex w-max will-change-transform">
          <span className={`shrink-0 whitespace-nowrap ${className}`.trim()}>
            {text}
          </span>
          <span
            className={`shrink-0 whitespace-nowrap pl-8 ${className}`.trim()}
            aria-hidden
          >
            {text}
          </span>
        </div>
      ) : (
        <span
          className={`block min-w-0 truncate ${className}`.trim()}
          title={overflow ? text : undefined}
        >
          {text}
        </span>
      )}
    </div>
  );
}
