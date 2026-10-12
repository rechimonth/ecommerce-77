import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("conserva el valor anterior hasta que transcurre el retardo", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "bot" },
    });

    expect(result.current).toBe("bot");
    rerender({ value: "bota" });
    expect(result.current).toBe("bot");

    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe("bot");

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe("bota");
  });

  it("cancela el temporizador anterior si el valor cambia de nuevo", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 250), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    act(() => { vi.advanceTimersByTime(150); });
    rerender({ value: "abc" });
    act(() => { vi.advanceTimersByTime(150); });
    expect(result.current).toBe("a");

    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe("abc");
  });

  it("respeta un retardo cero", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 0), {
      initialProps: { value: 1 },
    });
    rerender({ value: 2 });
    expect(result.current).toBe(1);
    act(() => { vi.runOnlyPendingTimers(); });
    expect(result.current).toBe(2);
  });
});
