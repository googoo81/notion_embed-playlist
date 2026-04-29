import { useRef } from "react";

/** 비동기/이펙트 콜백이 항상 최신 props/state를 읽도록 (렌더마다 동기화) */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
